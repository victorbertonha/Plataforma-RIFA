// Script de setup: cria tabelas e popula campanhas do frontend
import pool from '../src/db.js';

const schema = `
-- Remover objetos dependentes antes de recriar
DROP VIEW IF EXISTS campaign_status CASCADE;
DROP VIEW IF EXISTS user_tickets CASCADE;
DROP VIEW IF EXISTS user_dashboard CASCADE;
DROP TABLE IF EXISTS winners CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS cart_reservations CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;

-- Campanhas (id como VARCHAR/slug para compatibilidade com frontend)
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  total_numbers INTEGER NOT NULL DEFAULT 0,
  price_per_number DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets com suporte a reservas
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  reserved_by UUID,
  reserved_at TIMESTAMP,
  reservation_expires_at TIMESTAMP,
  bought_by UUID,
  bought_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, number)
);

-- Reservas do carrinho
CREATE TABLE IF NOT EXISTS cart_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ticket_numbers INTEGER[] NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  transaction_id UUID,
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, campaign_id)
);

-- Transações de pagamento
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ticket_ids UUID[] NOT NULL DEFAULT '{}',
  ticket_numbers INTEGER[] NOT NULL DEFAULT '{}',
  amount DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_status ON tickets(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_reserved_by ON tickets(reserved_by);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_user ON cart_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

-- Função para liberar reservas expiradas
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS void AS $$
BEGIN
  UPDATE tickets
  SET status = 'available',
      reserved_by = NULL,
      reserved_at = NULL,
      reservation_expires_at = NULL,
      updated_at = CURRENT_TIMESTAMP
  WHERE status = 'reserved' AND reservation_expires_at <= CURRENT_TIMESTAMP;

  UPDATE cart_reservations
  SET status = 'expired', updated_at = CURRENT_TIMESTAMP
  WHERE status = 'active' AND expires_at <= CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- View de status das campanhas
CREATE OR REPLACE VIEW campaign_status AS
SELECT
  c.id,
  c.title,
  c.status,
  c.total_numbers,
  COUNT(CASE WHEN t.status = 'available' THEN 1 END) AS available_count,
  COUNT(CASE WHEN t.status = 'reserved' THEN 1 END) AS reserved_count,
  COUNT(CASE WHEN t.status = 'sold' THEN 1 END) AS sold_count
FROM campaigns c
LEFT JOIN tickets t ON t.campaign_id = c.id
GROUP BY c.id, c.title, c.status, c.total_numbers;
`;

const campaigns = [
  { id: 'mercedes-amg-c63',      title: 'Mercedes-AMG C63 S Coupé',           category: 'carros',     totalNumbers: 50000,  pricePerNumber: 2.49 },
  { id: 'porsche-911-gt3',        title: 'Porsche 911 GT3 2023',               category: 'carros',     totalNumbers: 30000,  pricePerNumber: 4.99 },
  { id: 'bmw-m4-competition',     title: 'BMW M4 Competition',                 category: 'carros',     totalNumbers: 60000,  pricePerNumber: 1.99 },
  { id: 'iphone-16-pro-max',      title: 'iPhone 16 Pro Max 1TB',              category: 'eletronicos',totalNumbers: 15000,  pricePerNumber: 0.99 },
  { id: 'kit-gamer-ultimate',     title: 'Kit Gamer Ultimate RTX 4090',        category: 'eletronicos',totalNumbers: 20000,  pricePerNumber: 1.49 },
  { id: 'ford-mustang-gt',        title: 'Ford Mustang GT 5.0 V8',            category: 'carros',     totalNumbers: 45000,  pricePerNumber: 1.79 },
  { id: 'macbook-pro-m3',         title: 'MacBook Pro 16" M3 Max',            category: 'eletronicos',totalNumbers: 10000,  pricePerNumber: 1.99, finished: true },
  { id: 'kit-milionario',         title: 'Kit Milionário: Golf GTI + iPhone + R$50k', category: 'kits', totalNumbers: 80000, pricePerNumber: 2.99 },
  { id: 'audi-rs6-avant',         title: 'Audi RS6 Avant 2024',               category: 'carros',     totalNumbers: 35000,  pricePerNumber: 3.49, finished: true },
  { id: 'playstation-5-pro-kit',  title: 'PlayStation 5 Pro + 50 Jogos',      category: 'eletronicos',totalNumbers: 25000,  pricePerNumber: 0.79 },
  { id: 'lamborghini-huracan',    title: 'Lamborghini Huracán EVO',            category: 'carros',     totalNumbers: 100000, pricePerNumber: 9.99 },
  { id: 'kit-casa-inteligente',   title: 'Kit Casa Inteligente Completo',      category: 'kits',       totalNumbers: 12000,  pricePerNumber: 0.49 },
];

const TICKETS_PER_CAMPAIGN = 1000; // cotas disponíveis inseridas por campanha ativa

async function setup() {
  const client = await pool.connect();
  try {
    console.log('Criando schema...');
    await client.query(schema);
    console.log('✅ Schema criado');

    console.log('Populando campanhas...');
    for (const c of campaigns) {
      await client.query(
        `INSERT INTO campaigns (id, title, category, total_numbers, price_per_number, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           price_per_number = EXCLUDED.price_per_number,
           status = EXCLUDED.status`,
        [c.id, c.title, c.category, c.totalNumbers, c.pricePerNumber, c.finished ? 'finished' : 'open']
      );

      if (!c.finished) {
        // Insere cotas disponíveis usando generate_series
        await client.query(
          `INSERT INTO tickets (campaign_id, number, status)
           SELECT $1, generate_series(1, $2), 'available'
           ON CONFLICT (campaign_id, number) DO NOTHING`,
          [c.id, TICKETS_PER_CAMPAIGN]
        );
        console.log(`  ✓ ${c.id}: ${TICKETS_PER_CAMPAIGN} cotas`);
      } else {
        console.log(`  ✓ ${c.id}: encerrada`);
      }
    }

    console.log('\n✅ Setup concluído! Banco pronto para uso.');
  } catch (err) {
    console.error('❌ Erro no setup:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

setup().catch(() => process.exit(1));
