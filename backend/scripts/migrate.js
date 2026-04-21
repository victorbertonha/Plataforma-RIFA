import pool from '../src/db.js';

const schema = `
-- Enum para roles de usuário
CREATE TYPE user_role AS ENUM ('root', 'admin', 'user');

-- Enum para status de campanha
CREATE TYPE campaign_status AS ENUM ('draft', 'open', 'closed', 'finished');

-- Enum para status de ticket
CREATE TYPE ticket_status AS ENUM ('available', 'sold', 'winner');

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(40) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15),
  cpf VARCHAR(14) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de campanhas/rifas
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  category VARCHAR(50) NOT NULL,
  total_numbers INTEGER NOT NULL,
  prize_price DECIMAL(10,2) DEFAULT 0,
  price_per_number DECIMAL(10, 2) NOT NULL,
  status campaign_status DEFAULT 'draft',
  opens_at TIMESTAMP NOT NULL,
  closes_at TIMESTAMP NOT NULL,
  winner_id UUID REFERENCES users(id),
  winner_number INTEGER,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de tickets/números
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  status ticket_status DEFAULT 'available',
  bought_by UUID REFERENCES users(id),
  bought_at TIMESTAMP,
  UNIQUE(campaign_id, number)
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  ticket_ids UUID[] NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_opens_at ON campaigns(opens_at);
CREATE INDEX idx_campaigns_closes_at ON campaigns(closes_at);
CREATE INDEX idx_tickets_campaign_id ON tickets(campaign_id);
CREATE INDEX idx_tickets_bought_by ON tickets(bought_by);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_campaign_id ON transactions(campaign_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Iniciando migração do banco de dados...');
    await client.query(schema);
    console.log('✅ Banco de dados criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao migrar:', error);
    throw error;
  } finally {
    client.release();
  }
}

migrate().catch(console.error);
