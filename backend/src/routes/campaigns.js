import express from 'express';
import pool from '../db.js';
import { authenticateToken, requireRole } from '../auth.js';

const router = express.Router();

// Obter todas as campanhas (público)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, c.title, c.description, c.image_url, c.category,
        c.total_numbers, c.price_per_number, c.prize_price, c.status,
        c.opens_at, c.closes_at, c.winner_number, c.winner_id,
        COALESCE(COUNT(CASE WHEN t.status = 'sold' THEN 1 END), 0) as numbers_sold,
        u.name as winner_name
      FROM campaigns c
      LEFT JOIN tickets t ON c.id = t.campaign_id
      LEFT JOIN users u ON c.winner_id = u.id
      WHERE c.status IN ('open', 'finished')
      GROUP BY c.id, u.name
      ORDER BY c.opens_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter campanhas:', error);
    res.status(500).json({ error: 'Erro ao obter campanhas' });
  }
});

// Obter uma campanha por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        c.id, c.title, c.description, c.image_url, c.category,
        c.total_numbers, c.price_per_number, c.prize_price, c.status,
        c.opens_at, c.closes_at, c.winner_number, c.winner_id,
        COALESCE(COUNT(CASE WHEN t.status = 'sold' THEN 1 END), 0) as numbers_sold,
        u.name as winner_name
      FROM campaigns c
      LEFT JOIN tickets t ON c.id = t.campaign_id
      LEFT JOIN users u ON c.winner_id = u.id
      WHERE c.id = $1
      GROUP BY c.id, u.name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter campanha:', error);
    res.status(500).json({ error: 'Erro ao obter campanha' });
  }
});

// Criar nova campanha (admin/root)
router.post('/', authenticateToken, requireRole('admin', 'root'), async (req, res) => {
  const { title, description, imageUrl, category, totalNumbers, pricePerNumber, prizePrice, opensAt, closesAt } = req.body;

  if (!title || !category || !totalNumbers || !pricePerNumber || !opensAt || !closesAt) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO campaigns (title, description, image_url, category, total_numbers, price_per_number, prize_price, opens_at, closes_at, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [title, description || null, imageUrl || null, category, totalNumbers, pricePerNumber, prizePrice || 0, opensAt, closesAt, req.user.id, 'draft']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    res.status(500).json({ error: 'Erro ao criar campanha' });
  }
});

// Atualizar campanha (admin/root)
router.put('/:id', authenticateToken, requireRole('admin', 'root'), async (req, res) => {
  const { id } = req.params;
  const { title, description, imageUrl, category, totalNumbers, pricePerNumber, prizePrice, status, opensAt, closesAt } = req.body;

  try {
    const result = await pool.query(
      `UPDATE campaigns 
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url),
           category = COALESCE($5, category),
           total_numbers = COALESCE($6, total_numbers),
           price_per_number = COALESCE($7, price_per_number),
           prize_price = COALESCE($8, prize_price),
           status = COALESCE($9, status),
           opens_at = COALESCE($10, opens_at),
           closes_at = COALESCE($11, closes_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND created_by = $12
       RETURNING *`,
      [id, title, description, imageUrl, category, totalNumbers, pricePerNumber, prizePrice, status, opensAt, closesAt, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campanha não encontrada ou sem permissão' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error);
    res.status(500).json({ error: 'Erro ao atualizar campanha' });
  }
});

// Deletar campanha (admin/root)
router.delete('/:id', authenticateToken, requireRole('admin', 'root'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM campaigns WHERE id = $1 AND created_by = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campanha não encontrada ou sem permissão' });
    }

    res.json({ success: true, message: 'Campanha deletada' });
  } catch (error) {
    console.error('Erro ao deletar campanha:', error);
    res.status(500).json({ error: 'Erro ao deletar campanha' });
  }
});

export default router;
