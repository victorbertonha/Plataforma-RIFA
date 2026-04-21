import express from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import pool from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// POST /api/payments/create-preference
// Cria uma preferência no Mercado Pago com todos os itens do carrinho do usuário
router.post('/create-preference', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  console.log('[MP] create-preference chamado para user:', userId);

  try {
    console.log('[MP] buscando reservas...');
    const reservations = await pool.query(
      `SELECT cr.campaign_id, cr.ticket_numbers, c.title, c.price_per_number
       FROM cart_reservations cr
       JOIN campaigns c ON c.id = cr.campaign_id
       WHERE cr.user_id = $1 AND cr.status = 'active' AND cr.expires_at > NOW()`,
      [userId]
    );

    if (reservations.rows.length === 0) {
      return res.status(400).json({
        error: 'Nenhuma reserva ativa encontrada. Adicione cotas ao carrinho primeiro.',
      });
    }

    const TAX_RATE = 0.01;
    const userEmail = req.user.email || 'cliente@rifa.com';

    const items = reservations.rows.map((r) => {
      const qty = r.ticket_numbers.length;
      const subtotal = parseFloat(r.price_per_number) * qty;
      const total = subtotal + subtotal * TAX_RATE;
      return {
        id: r.campaign_id,
        title: `${r.title} — ${qty} cota${qty > 1 ? 's' : ''}`,
        quantity: 1,
        unit_price: parseFloat(total.toFixed(2)),
        currency_id: 'BRL',
      };
    });

    console.log('[MP] reservas encontradas:', reservations.rows.length, '- chamando API do Mercado Pago...');
    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items,
        // Não pré-preencher email: evita conflito com conta vendedora no sandbox

        back_urls: {
          success: `${process.env.FRONTEND_URL}/pedido-confirmado`,
          failure: `${process.env.FRONTEND_URL}/carrinho`,
          pending: `${process.env.FRONTEND_URL}/pedido-pendente`,
        },
        notification_url: `${process.env.APP_URL}/api/payments/webhook`,
        metadata: { user_id: String(userId) },
      },
    });

    console.log('[MP] preferência criada:', result.id);
    res.json({
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      preference_id: result.id,
    });
  } catch (error) {
    console.error('Erro ao criar preferência MP:', error);
    res.status(500).json({ error: 'Erro ao iniciar pagamento' });
  }
});

// POST /api/payments/webhook
// Recebe notificações de pagamento do Mercado Pago
router.post('/webhook', async (req, res) => {
  // Responde imediatamente para o MP não retentar a notificação
  res.sendStatus(200);

  const { type, data } = req.body;
  if (type !== 'payment' || !data?.id) return;

  try {
    const paymentClient = new Payment(mp);
    const mpPayment = await paymentClient.get({ id: data.id });

    if (mpPayment.status !== 'approved') return;

    const userId = mpPayment.metadata?.user_id;
    if (!userId) {
      console.error('Webhook: user_id ausente nos metadados do pagamento', mpPayment.id);
      return;
    }

    const reservations = await pool.query(
      `SELECT cr.campaign_id, cr.ticket_numbers, c.price_per_number
       FROM cart_reservations cr
       JOIN campaigns c ON c.id = cr.campaign_id
       WHERE cr.user_id = $1 AND cr.status = 'active'`,
      [userId]
    );

    for (const reservation of reservations.rows) {
      const { campaign_id, ticket_numbers, price_per_number } = reservation;
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const stillReserved = await client.query(
          `SELECT COUNT(*) as count FROM tickets
           WHERE campaign_id = $1 AND number = ANY($2) AND status = 'reserved' AND reserved_by = $3`,
          [campaign_id, ticket_numbers, userId]
        );

        if (parseInt(stillReserved.rows[0].count) !== ticket_numbers.length) {
          await client.query('ROLLBACK');
          console.warn(`Webhook: tickets não reservados para user=${userId} campaign=${campaign_id}`);
          continue;
        }

        const amount = parseFloat(price_per_number) * ticket_numbers.length;
        const tax = amount * 0.01;
        const total = amount + tax;

        const soldResult = await client.query(
          `UPDATE tickets
           SET status = 'sold', bought_by = $1, bought_at = CURRENT_TIMESTAMP,
               reserved_by = NULL, reserved_at = NULL, reservation_expires_at = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE campaign_id = $2 AND number = ANY($3) AND status = 'reserved'
           RETURNING id`,
          [userId, campaign_id, ticket_numbers]
        );

        const ticketIds = soldResult.rows.map((r) => r.id);

        const transaction = await client.query(
          `INSERT INTO transactions
           (user_id, campaign_id, ticket_ids, ticket_numbers, amount, tax, total, status, payment_method, payment_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', 'mercadopago', $8)
           RETURNING id`,
          [userId, campaign_id, ticketIds, ticket_numbers, amount, tax, total, String(mpPayment.id)]
        );

        await client.query(
          `UPDATE cart_reservations
           SET status = 'completed', transaction_id = $1, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $2 AND campaign_id = $3`,
          [transaction.rows[0].id, userId, campaign_id]
        );

        await client.query('COMMIT');
        console.log(`Compra confirmada via MP: user=${userId}, campaign=${campaign_id}, payment=${mpPayment.id}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Erro ao confirmar compra via webhook (campaign=${campaign_id}):`, err);
      } finally {
        client.release();
      }
    }
  } catch (err) {
    console.error('Erro ao processar webhook MP:', err);
  }
});

export default router;
