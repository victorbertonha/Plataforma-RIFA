// ============================================================
// Backend Routes: Tickets com Fluxo de Reserva e Pagamento
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

  try {
    // Liberar reservas expiradas ANTES de retornar disponíveis
    await pool.query('SELECT release_expired_reservations()');

    const result = await pool.query(
      `SELECT number FROM tickets
       WHERE campaign_id = $1 AND status = 'available'
       ORDER BY RANDOM()`,
      [campaignId]
    );

    const availableCount = result.rows.length;
    res.json({
      available: result.rows.map(r => r.number),
      count: availableCount
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
       SET status = 'available', reserved_by = NULL, reserved_at = NULL, reservation_expires_at = NULL
       WHERE campaign_id = $1 
         AND reserved_by = $2 
         AND status = 'reserved'
         AND reservation_expires_at <= CURRENT_TIMESTAMP`,
      [campaignId, userId]
    );

    // 2. Verificar se os números estão disponíveis (não 'sold' ou 'reserved' por outro usuário)
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
        reason: 'alguém comprou enquanto você estava reservando'
      });
    }

    // 3. Reservar os números (status = 'reserved')
    const reservationExpiresAt = new Date();
    reservationExpiresAt.setHours(reservationExpiresAt.getHours() + 24); // 24h de expiração

    const reserveResult = await client.query(
      `UPDATE tickets 
       SET 
         status = 'reserved',
         reserved_by = $1,
         reserved_at = CURRENT_TIMESTAMP,
         reservation_expires_at = $2
       WHERE campaign_id = $3 AND number = ANY($4)
       RETURNING id, number, reserved_at, reservation_expires_at`,
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
         reserved_at = CURRENT_TIMESTAMP`,
      [userId, campaignId, numbers, reservationExpiresAt]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      reserved: {
        campaignId,
        numbers,
        count: numbers.length,
        expiresAt: reservationExpiresAt,
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
  const { campaignId, paymentId, paymentMethod, transactionToken } = req.body;
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
         reservation_expires_at = NULL
       WHERE campaign_id = $2 AND number = ANY($3) AND status = 'reserved'
       RETURNING id`,
      [userId, campaignId, ticketNumbers]
    );

    const ticketIds = soldResult.rows.map(r => r.id);

    // 6. Criar transação
    const transaction = await client.query(
      `INSERT INTO transactions 
       (user_id, campaign_id, ticket_ids, amount, tax, total, status, payment_method, payment_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, $8)
       RETURNING *`,
      [userId, campaignId, ticketIds, amount, tax, total, paymentMethod, paymentId]
    );

    // 7. Marcar reserva como completada
    await client.query(
      `UPDATE cart_reservations 
       SET status = 'completed', transaction_id = $1
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
         reservation_expires_at = NULL
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
// 5. Ver Cotas do Usuário (apenas SOLD = compradas)
// ============================================================
router.get('/user/campaign/:campaignId/purchased', authenticateToken, async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT number, status, bought_at 
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
    console.error('Erro ao obter cotas do usuário:', error);
    res.status(500).json({ error: 'Erro ao obter cotas' });
  }
});

// ============================================================
// 6. Ver Cotas Reservadas (no carrinho)
// ============================================================
router.get('/user/campaign/:campaignId/reserved', authenticateToken, async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT number, status, reserved_at, reservation_expires_at,
              (reservation_expires_at > CURRENT_TIMESTAMP) as is_active
       FROM tickets 
       WHERE campaign_id = $1 AND reserved_by = $2 AND status = 'reserved'
       ORDER BY number`,
      [campaignId, userId]
    );

    res.json({
      campaignId,
      reservedTickets: result.rows,
      count: result.rows.length,
      expiresIn: result.rows.length > 0 ? result.rows[0].reservation_expires_at : null
    });
  } catch (error) {
    console.error('Erro ao obter cotas reservadas:', error);
    res.status(500).json({ error: 'Erro ao obter cotas reservadas' });
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

export default router;
