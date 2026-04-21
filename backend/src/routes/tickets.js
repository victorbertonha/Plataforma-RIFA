// ============================================================
// TICKETS ROUTES - Rifas (Cotas com Reserva e Pagamento)
// ============================================================
// Fluxo:
// 1. GET /available          → Ver cotas disponíveis
// 2. POST /reserve           → Reservar no carrinho (24h)
// 3. POST /confirm-purchase  → Confirmar pagamento
// 4. POST /cancel-reservation → Sair do carrinho
// 5. GET /purchased          → Ver cotas compradas
// 6. GET /reserved           → Ver cotas reservadas
// 7. GET /campaign/status    → Status da campanha
// ============================================================

import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// ============================================================
// 1. Obter Números Disponíveis (apenas 'available')
// ============================================================
router.get('/campaign/:campaignId/available', async (req, res) => {
  const { campaignId } = req.params;
  const { limit = 100 } = req.query;

  try {
    // Liberar reservas expiradas ANTES de retornar disponíveis
    await pool.query('SELECT release_expired_reservations()');

    const result = await pool.query(
      `SELECT number FROM tickets
       WHERE campaign_id = $1 AND status = 'available'
       ORDER BY RANDOM()
       LIMIT $2`,
      [campaignId, parseInt(limit) || 100]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM tickets 
       WHERE campaign_id = $1 AND status = 'available'`,
      [campaignId]
    );

    res.json({
      available: result.rows.map(r => r.number),
      count: result.rows.length,
      totalAvailable: parseInt(countResult.rows[0].total)
    });
  } catch (error) {
    console.error('Erro ao obter números disponíveis:', error);
    res.status(500).json({ error: 'Erro ao obter números' });
  }
});

// ============================================================
// 2. Reservar Cotas no Carrinho (sem confirmar pagamento)
// ============================================================
router.post('/reserve', authenticateToken, async (req, res) => {
  const { campaignId, numbers } = req.body;
  const userId = req.user.id;

  if (!campaignId || !Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Liberar reservas expiradas deste usuário
    await client.query(
      `UPDATE tickets
       SET status = 'available', reserved_by = NULL, reserved_at = NULL, reservation_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $1 
         AND reserved_by = $2 
         AND status = 'reserved'
         AND reservation_expires_at <= CURRENT_TIMESTAMP`,
      [campaignId, userId]
    );

    // 2. Verificar se os números estão disponíveis (status = 'available')
    const checkAvailable = await client.query(
      `SELECT COUNT(*) as count FROM tickets 
       WHERE campaign_id = $1 
         AND number = ANY($2) 
         AND status = 'available'`,
      [campaignId, numbers]
    );

    if (parseInt(checkAvailable.rows[0].count) !== numbers.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Um ou mais números não estão mais disponíveis',
        reason: 'Alguém comprou enquanto você estava reservando'
      });
    }

    // 3. Reservar os números (status = 'reserved')
    const reservationExpiresAt = new Date();
    reservationExpiresAt.setHours(reservationExpiresAt.getHours() + 24); // 24h de expiração

    await client.query(
      `UPDATE tickets 
       SET 
         status = 'reserved',
         reserved_by = $1,
         reserved_at = CURRENT_TIMESTAMP,
         reservation_expires_at = $2,
         updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $3 AND number = ANY($4)`,
      [userId, reservationExpiresAt, campaignId, numbers]
    );

    // 4. Criar ou atualizar registro de reserva no carrinho
    await client.query(
      `INSERT INTO cart_reservations (user_id, campaign_id, ticket_numbers, expires_at, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (user_id, campaign_id) 
       DO UPDATE SET 
         ticket_numbers = $3,
         expires_at = $4,
         status = 'active',
         reserved_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, campaignId, numbers, reservationExpiresAt]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      reserved: {
        campaignId,
        numbers,
        count: numbers.length,
        expiresAt: reservationExpiresAt.toISOString(),
        message: '✅ Cotas reservadas por 24h'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao reservar cotas:', error);
    res.status(500).json({ error: 'Erro ao reservar cotas' });
  } finally {
    client.release();
  }
});

// ============================================================
// 3. Confirmar Compra (após pagamento confirmado)
// ============================================================
router.post('/confirm-purchase', authenticateToken, async (req, res) => {
  const { campaignId, paymentId, paymentMethod } = req.body;
  const userId = req.user.id;

  if (!campaignId || !paymentId || !paymentMethod) {
    return res.status(400).json({ error: 'Dados de pagamento inválidos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Buscar a reserva ativa do usuário
    const reservationCheck = await client.query(
      `SELECT id, ticket_numbers, expires_at FROM cart_reservations
       WHERE user_id = $1 AND campaign_id = $2 AND status = 'active'`,
      [userId, campaignId]
    );

    if (reservationCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Nenhuma reserva encontrada',
        reason: 'Você precisa adicionar cotas ao carrinho primeiro'
      });
    }

    const reservation = reservationCheck.rows[0];
    const ticketNumbers = reservation.ticket_numbers;

    // 2. Verificar se a reserva ainda está válida
    if (new Date(reservation.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Reserva expirada',
        reason: 'Sua reserva de 24h venceu. Adicione novamente ao carrinho'
      });
    }

    // 3. Verificar se ainda estão reservadas para este usuário
    const stillReserved = await client.query(
      `SELECT COUNT(*) as count FROM tickets
       WHERE campaign_id = $1 
         AND number = ANY($2) 
         AND status = 'reserved' 
         AND reserved_by = $3`,
      [campaignId, ticketNumbers, userId]
    );

    if (parseInt(stillReserved.rows[0].count) !== ticketNumbers.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Uma ou mais cotas não estão mais reservadas',
        reason: 'A reserva expirou ou foi alterada'
      });
    }

    // 4. Buscar preço da campanha
    const campaign = await client.query(
      'SELECT price_per_number FROM campaigns WHERE id = $1',
      [campaignId]
    );

    if (campaign.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const pricePerNumber = campaign.rows[0].price_per_number;
    const amount = pricePerNumber * ticketNumbers.length;
    const tax = amount * 0.01;
    const total = amount + tax;

    // 5. Atualizar tickets: 'reserved' → 'sold'
    const soldResult = await client.query(
      `UPDATE tickets 
       SET 
         status = 'sold',
         bought_by = $1,
         bought_at = CURRENT_TIMESTAMP,
         reserved_by = NULL,
         reserved_at = NULL,
         reservation_expires_at = NULL,
         updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $2 AND number = ANY($3) AND status = 'reserved'
       RETURNING id`,
      [userId, campaignId, ticketNumbers]
    );

    const ticketIds = soldResult.rows.map(r => r.id);

    // 6. Criar transação
    const transaction = await client.query(
      `INSERT INTO transactions 
       (user_id, campaign_id, ticket_ids, ticket_numbers, amount, tax, total, status, payment_method, payment_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8, $9)
       RETURNING *`,
      [userId, campaignId, ticketIds, ticketNumbers, amount, tax, total, paymentMethod, paymentId]
    );

    // 7. Marcar reserva como completada
    await client.query(
      `UPDATE cart_reservations 
       SET status = 'completed', transaction_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND campaign_id = $3`,
      [transaction.rows[0].id, userId, campaignId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      transaction: transaction.rows[0],
      message: `✅ ${ticketNumbers.length} cotas compradas com sucesso!`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao confirmar compra:', error);
    res.status(500).json({ error: 'Erro ao confirmar compra' });
  } finally {
    client.release();
  }
});

// ============================================================
// 4. Remover Reserva (usuário sai do carrinho)
// ============================================================
router.post('/cancel-reservation', authenticateToken, async (req, res) => {
  const { campaignId } = req.body;
  const userId = req.user.id;

  if (!campaignId) {
    return res.status(400).json({ error: 'campaignId é obrigatório' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Buscar reserva
    const reservation = await client.query(
      `SELECT ticket_numbers FROM cart_reservations
       WHERE user_id = $1 AND campaign_id = $2`,
      [userId, campaignId]
    );

    if (reservation.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Nenhuma reserva encontrada' });
    }

    const ticketNumbers = reservation.rows[0].ticket_numbers;

    // 2. Liberar cotas (voltar para 'available')
    await client.query(
      `UPDATE tickets 
       SET 
         status = 'available',
         reserved_by = NULL,
         reserved_at = NULL,
         reservation_expires_at = NULL,
         updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $1 AND number = ANY($2) AND reserved_by = $3`,
      [campaignId, ticketNumbers, userId]
    );

    // 3. Remover reserva
    await client.query(
      `DELETE FROM cart_reservations 
       WHERE user_id = $1 AND campaign_id = $2`,
      [userId, campaignId]
    );

    await client.query('COMMIT');

    res.json({ 
      success: true,
      count: ticketNumbers.length,
      message: `${ticketNumbers.length} cotas liberadas. Voltaram para disponíveis.`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({ error: 'Erro ao cancelar reserva' });
  } finally {
    client.release();
  }
});

// ============================================================
// 5. Ver Cotas Compradas (apenas SOLD = pagas)
// ============================================================
router.get('/user/purchased/:campaignId', authenticateToken, async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, number, status, bought_at 
       FROM tickets 
       WHERE campaign_id = $1 AND bought_by = $2 AND status = 'sold'
       ORDER BY number`,
      [campaignId, userId]
    );

    res.json({
      campaignId,
      purchasedTickets: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Erro ao obter cotas compradas:', error);
    res.status(500).json({ error: 'Erro ao obter cotas' });
  }
});

// ============================================================
// 6. Ver Cotas Reservadas (no carrinho)
// ============================================================
router.get('/user/reserved/:campaignId', authenticateToken, async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, number, status, reserved_at, reservation_expires_at,
              (reservation_expires_at > CURRENT_TIMESTAMP) as is_active
       FROM tickets 
       WHERE campaign_id = $1 AND reserved_by = $2 AND status = 'reserved'
       ORDER BY number`,
      [campaignId, userId]
    );

    const expiresAt = result.rows.length > 0 ? result.rows[0].reservation_expires_at : null;

    res.json({
      campaignId,
      reservedTickets: result.rows,
      count: result.rows.length,
      expiresAt: expiresAt,
      message: result.rows.length > 0 ? '⏱️ Sua reserva expira em 24h' : 'Nenhuma cota reservada'
    });
  } catch (error) {
    console.error('Erro ao obter cotas reservadas:', error);
    res.status(500).json({ error: 'Erro ao obter cotas reservadas' });
  }
});

// ============================================================
// 7a. Stats de todas as campanhas (público, sem auth)
// ============================================================
router.get('/campaigns/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        COUNT(CASE WHEN t.status = 'sold'      THEN 1 END)::int AS sold,
        COUNT(CASE WHEN t.status = 'reserved'  THEN 1 END)::int AS reserved,
        COUNT(CASE WHEN t.status = 'available' THEN 1 END)::int AS available,
        c.total_numbers::int                                      AS total_numbers
      FROM campaigns c
      LEFT JOIN tickets t ON t.campaign_id = c.id
      GROUP BY c.id
    `);

    const map = {};
    result.rows.forEach(r => { map[r.id] = r; });
    res.json(map);
  } catch (error) {
    console.error('Erro ao obter stats de campanhas:', error);
    res.status(500).json({ error: 'Erro ao obter stats' });
  }
});

// ============================================================
// 7. Obter Status da Campanha
// ============================================================
router.get('/campaign/:campaignId/status', async (req, res) => {
  const { campaignId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM campaign_status WHERE id = $1`,
      [campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter status da campanha:', error);
    res.status(500).json({ error: 'Erro ao obter status' });
  }
});

// ============================================================
// 8. Ver Minhas Transações (histórico de compras)
// ============================================================
router.get('/user/transactions/:campaignId', authenticateToken, async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, campaign_id, ticket_numbers, amount, tax, total, status, payment_method, created_at
       FROM transactions
       WHERE user_id = $1 AND campaign_id = $2 AND status = 'completed'
       ORDER BY created_at DESC`,
      [userId, campaignId]
    );

    res.json({
      campaignId,
      transactions: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Erro ao obter transações:', error);
    res.status(500).json({ error: 'Erro ao obter transações' });
  }
});

// ============================================================
// 9. Todos os Pedidos do Usuário (histórico geral)
// ============================================================
router.get('/user/orders', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT t.id, t.campaign_id, c.title AS campaign_title,
              t.ticket_numbers, t.amount, t.tax, t.total,
              t.status, t.payment_method, t.payment_id, t.created_at
       FROM transactions t
       JOIN campaigns c ON c.id = t.campaign_id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Erro ao obter pedidos:', error);
    res.status(500).json({ error: 'Erro ao obter pedidos' });
  }
});

// ============================================================
// LEGACY: Manter compatibilidade com código antigo
// ============================================================

// Compatibilidade: GET /user/campaign/:campaignId → purchased
router.get('/user/campaign/:campaignId', authenticateToken, async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT number, status FROM tickets 
       WHERE campaign_id = $1 AND bought_by = $2 AND status = 'sold'
       ORDER BY number`,
      [campaignId, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter tickets do usuário:', error);
    res.status(500).json({ error: 'Erro ao obter tickets' });
  }
});

export default router;
