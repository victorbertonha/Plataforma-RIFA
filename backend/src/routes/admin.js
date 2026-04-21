import express from 'express';
import pool from '../db.js';
import { authenticateToken, requireRole } from '../auth.js';

const router = express.Router();

// Dashboard - Métricas gerais (admin/root)
router.get('/dashboard/metrics', authenticateToken, async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) as total FROM profiles');
    const campaigns = await pool.query('SELECT COUNT(*) as total FROM campaigns');
    const revenue = await pool.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE status = 'completed'"
    );
    const tickets = await pool.query("SELECT COUNT(*) as total FROM tickets WHERE status = 'sold'");

    res.json({
      totalUsers: parseInt(users.rows[0].total),
      totalCampaigns: parseInt(campaigns.rows[0].total),
      totalRevenue: parseFloat(revenue.rows[0].total),
      totalTicketsSold: parseInt(tickets.rows[0].total),
    });
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ error: 'Erro ao obter métricas' });
  }
});

// Obter todos os usuários (autenticado)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, cpf, role, created_at FROM profiles ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter usuários:', error);
    res.status(500).json({ error: 'Erro ao obter usuários' });
  }
});

// Alterar role de usuário (apenas admin/root)
router.put('/users/:id/role', authenticateToken, requireRole('admin', 'root'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin', 'root'].includes(role)) {
    return res.status(400).json({ error: 'Role inválido' });
  }

  if (id === req.user.id && role !== 'root') {
    return res.status(400).json({ error: 'Não pode remover seu próprio acesso root' });
  }

  try {
    const result = await pool.query(
      'UPDATE profiles SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao alterar role:', error);
    res.status(500).json({ error: 'Erro ao alterar role' });
  }
});

// Desativar/ativar usuário — armazena em profiles.is_active (admin/root)
router.put('/users/:id/status', authenticateToken, requireRole('admin', 'root'), async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive deve ser boolean' });
  }

  try {
    // Ensure column exists (graceful degradation)
    await pool.query(
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`
    );

    const result = await pool.query(
      'UPDATE profiles SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});

// Obter logs de auditoria (autenticado)
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        al.id, al.action, al.entity_type, al.entity_id,
        u.name as user_name, al.details, al.created_at
      FROM audit_logs al
      LEFT JOIN profiles u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter logs:', error);
    res.status(500).json({ error: 'Erro ao obter logs' });
  }
});

// Relatório de receita por período (autenticado)
router.get('/reports/revenue', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(*) as transactions_count,
        SUM(t.amount) as amount,
        SUM(t.tax) as tax,
        SUM(t.total) as total
      FROM transactions t
      WHERE t.status = 'completed'
        AND t.created_at >= $1
        AND t.created_at <= $2
      GROUP BY DATE(t.created_at)
      ORDER BY date DESC
    `, [startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate || new Date()]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// Métricas por campanha: receita, prize_price e lucro
router.get('/campaigns/metrics', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.title,
        COALESCE(SUM(t.total), 0) as revenue,
        COALESCE(c.prize_price, 0) as prize_price,
        (COALESCE(SUM(t.total), 0) - COALESCE(c.prize_price, 0)) as profit,
        c.total_numbers,
        COUNT(CASE WHEN tk.status = 'sold' THEN 1 END) as tickets_sold
      FROM campaigns c
      LEFT JOIN transactions t ON c.id = t.campaign_id AND t.status = 'completed'
      LEFT JOIN tickets tk ON c.id = tk.campaign_id
      GROUP BY c.id
      ORDER BY revenue DESC
    `);

    res.json(result.rows.map(r => ({
      id: r.id,
      title: r.title,
      revenue: parseFloat(r.revenue),
      prize_price: parseFloat(r.prize_price),
      profit: parseFloat(r.profit),
      total_numbers: r.total_numbers,
      tickets_sold: parseInt(r.tickets_sold, 10)
    })));
  } catch (error) {
    console.error('Erro ao obter métricas por campanha:', error);
    res.status(500).json({ error: 'Erro ao obter métricas por campanha' });
  }
});

// ============================================================
// GESTÃO DE RIFAS - Visão geral das campanhas com stats reais
// ============================================================
router.get('/raffle/overview', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.title,
        c.category,
        c.total_numbers,
        c.price_per_number,
        c.status,
        COUNT(t.id)                                          AS total_tickets,
        COUNT(CASE WHEN t.status = 'available' THEN 1 END)  AS available,
        COUNT(CASE WHEN t.status = 'reserved'  THEN 1 END)  AS reserved,
        COUNT(CASE WHEN t.status = 'sold'      THEN 1 END)  AS sold,
        COALESCE(SUM(CASE WHEN t.status = 'sold' THEN c.price_per_number END), 0) AS revenue
      FROM campaigns c
      LEFT JOIN tickets t ON t.campaign_id = c.id
      GROUP BY c.id
      ORDER BY c.title
    `);

    res.json(result.rows.map(r => ({
      ...r,
      total_numbers: parseInt(r.total_numbers),
      available:     parseInt(r.available),
      reserved:      parseInt(r.reserved),
      sold:          parseInt(r.sold),
      revenue:       parseFloat(r.revenue),
      price_per_number: parseFloat(r.price_per_number),
    })));
  } catch (error) {
    console.error('Erro ao obter overview:', error);
    res.status(500).json({ error: 'Erro ao obter overview' });
  }
});

// ============================================================
// Cotas de uma campanha com info do comprador
// ============================================================
router.get('/raffle/campaigns/:id/tickets', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.query; // filtro opcional: available | reserved | sold

  try {
    const params = [id];
    let statusFilter = '';
    if (status) {
      params.push(status);
      statusFilter = `AND t.status = $${params.length}`;
    }

    const result = await pool.query(`
      SELECT
        t.number,
        t.status,
        t.reserved_at,
        t.reservation_expires_at,
        t.bought_at,
        p_buyer.email    AS buyer_email,
        p_buyer.name     AS buyer_name,
        p_reserve.email  AS reserver_email
      FROM tickets t
      LEFT JOIN profiles p_buyer   ON p_buyer.id   = t.bought_by
      LEFT JOIN profiles p_reserve ON p_reserve.id = t.reserved_by
      WHERE t.campaign_id = $1 ${statusFilter}
      ORDER BY t.number
    `, params);

    const campaign = await pool.query(
      'SELECT id, title, total_numbers, price_per_number, status FROM campaigns WHERE id = $1',
      [id]
    );

    if (campaign.rows.length === 0) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    res.json({
      campaign: campaign.rows[0],
      tickets: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Erro ao obter cotas:', error);
    res.status(500).json({ error: 'Erro ao obter cotas' });
  }
});

// ============================================================
// CONTROLE DE COTAS - Ações administrativas
// ============================================================

// Liberar cota (volta para available)
router.put('/raffle/tickets/:campaignId/:number/release', authenticateToken, async (req, res) => {
  const { campaignId, number } = req.params;
  try {
    const result = await pool.query(
      `UPDATE tickets
       SET status = 'available', bought_by = NULL, bought_at = NULL,
           reserved_by = NULL, reserved_at = NULL, reservation_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $1 AND number = $2
       RETURNING number, status`,
      [campaignId, parseInt(number)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cota não encontrada' });

    // Remove cart_reservation if any
    await pool.query(
      `UPDATE cart_reservations SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $1`,
      [campaignId]
    );

    res.json({ success: true, ticket: result.rows[0] });
  } catch (err) {
    console.error('Erro ao liberar cota:', err);
    res.status(500).json({ error: 'Erro ao liberar cota' });
  }
});

// Reassinar cota para outro usuário (por email)
router.put('/raffle/tickets/:campaignId/:number/reassign', authenticateToken, async (req, res) => {
  const { campaignId, number } = req.params;
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'email obrigatório' });

  try {
    const userResult = await pool.query('SELECT id, name FROM profiles WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado com esse email' });

    const newOwner = userResult.rows[0];

    const result = await pool.query(
      `UPDATE tickets
       SET status = 'sold', bought_by = $1, bought_at = COALESCE(bought_at, CURRENT_TIMESTAMP),
           reserved_by = NULL, reserved_at = NULL, reservation_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $2 AND number = $3
       RETURNING number, status`,
      [newOwner.id, campaignId, parseInt(number)]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Cota não encontrada' });
    res.json({ success: true, ticket: result.rows[0], newOwner });
  } catch (err) {
    console.error('Erro ao reassinar cota:', err);
    res.status(500).json({ error: 'Erro ao reassinar cota' });
  }
});

// Marcar cota como vendida manualmente (para um usuário por email)
router.put('/raffle/tickets/:campaignId/:number/confirm', authenticateToken, async (req, res) => {
  const { campaignId, number } = req.params;
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'email obrigatório' });

  try {
    const userResult = await pool.query('SELECT id, name FROM profiles WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    const owner = userResult.rows[0];

    const result = await pool.query(
      `UPDATE tickets
       SET status = 'sold', bought_by = $1, bought_at = CURRENT_TIMESTAMP,
           reserved_by = NULL, reserved_at = NULL, reservation_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $2 AND number = $3 AND status != 'sold'
       RETURNING number, status`,
      [owner.id, campaignId, parseInt(number)]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Cota não encontrada ou já vendida' });

    res.json({ success: true, ticket: result.rows[0], owner });
  } catch (err) {
    console.error('Erro ao confirmar cota:', err);
    res.status(500).json({ error: 'Erro ao confirmar cota' });
  }
});

// Estender reserva de uma cota
router.put('/raffle/tickets/:campaignId/:number/extend', authenticateToken, async (req, res) => {
  const { campaignId, number } = req.params;
  const { hours = 24 } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tickets
       SET reservation_expires_at = CURRENT_TIMESTAMP + ($1 || ' hours')::INTERVAL,
           updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $2 AND number = $3 AND status = 'reserved'
       RETURNING number, status, reservation_expires_at`,
      [parseInt(hours), campaignId, parseInt(number)]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Cota não está reservada' });

    res.json({ success: true, ticket: result.rows[0] });
  } catch (err) {
    console.error('Erro ao estender reserva:', err);
    res.status(500).json({ error: 'Erro ao estender reserva' });
  }
});

// Criar cotas adicionais para uma campanha
router.post('/raffle/campaigns/:campaignId/tickets/create', authenticateToken, async (req, res) => {
  const { campaignId } = req.params;
  const { numbers } = req.body; // array de números

  if (!Array.isArray(numbers) || numbers.length === 0)
    return res.status(400).json({ error: 'numbers[] obrigatório' });

  try {
    const inserted = [];
    for (const num of numbers) {
      try {
        await pool.query(
          `INSERT INTO tickets (campaign_id, number, status) VALUES ($1, $2, 'available')
           ON CONFLICT (campaign_id, number) DO NOTHING`,
          [campaignId, parseInt(num)]
        );
        inserted.push(num);
      } catch (_) {}
    }

    // Update total_numbers on campaign
    await pool.query(
      `UPDATE campaigns SET total_numbers = (SELECT COUNT(*) FROM tickets WHERE campaign_id = $1)
       WHERE id = $1`,
      [campaignId]
    );

    res.json({ success: true, inserted, count: inserted.length });
  } catch (err) {
    console.error('Erro ao criar cotas:', err);
    res.status(500).json({ error: 'Erro ao criar cotas' });
  }
});

export default router;
