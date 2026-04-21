-- Migration: adicionar coluna prize_price em campaigns e atualizar view campaign_status
-- Execute este arquivo no Supabase SQL Editor ou via psql quando o banco estiver disponível.

BEGIN;

-- 1) Adicionar coluna prize_price se não existir
ALTER TABLE IF EXISTS campaigns
  ADD COLUMN IF NOT EXISTS prize_price DECIMAL(10,2) DEFAULT 0;

-- 2) Atualizar view campaign_status (recriar)
DROP VIEW IF EXISTS campaign_status CASCADE;

CREATE VIEW campaign_status AS
SELECT 
  c.id,
  c.name,
  c.total_numbers,
  COUNT(CASE WHEN t.status = 'available' THEN 1 END) as available_count,
  COUNT(CASE WHEN t.status = 'reserved' THEN 1 END) as reserved_count,
  COUNT(CASE WHEN t.status = 'sold' THEN 1 END) as sold_count,
  COUNT(CASE WHEN t.status = 'winner' THEN 1 END) as winner_count,
  ROUND((COUNT(CASE WHEN t.status = 'sold' THEN 1 END) * 100.0 / 
    NULLIF(c.total_numbers, 0))::NUMERIC, 2) as percentage_sold,
  ROUND((COUNT(CASE WHEN t.status = 'reserved' THEN 1 END) * 100.0 / 
    NULLIF(c.total_numbers, 0))::NUMERIC, 2) as percentage_reserved,
  c.price_per_number,
  c.prize_price,
  (COUNT(CASE WHEN t.status = 'sold' THEN 1 END) * c.price_per_number) as revenue,
  c.status as campaign_status,
  c.created_at
FROM campaigns c
LEFT JOIN tickets t ON c.id = t.campaign_id
GROUP BY c.id, c.name, c.total_numbers, c.price_per_number, c.prize_price, c.status, c.created_at;

COMMIT;

-- Opcional: definir um usuário existente como admin (substitua o email)
-- UPDATE users SET role = 'admin' WHERE email = 'seu-email@example.com';
