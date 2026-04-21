-- ============================================================
-- Schema de Tickets com Estados e Reservas
-- ============================================================

-- Status dos Tickets:
-- 'available' = Disponível para compra
-- 'reserved'  = Reservado no carrinho do usuário (não pode ser vendido a outro)
-- 'sold'      = Comprado e pago (entregue ao usuário)
-- 'winner'    = Ganhou o prêmio

-- Tabela de Tickets (atualizada)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'winner')),
  bought_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bought_at TIMESTAMP WITH TIME ZONE,
  reserved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_at TIMESTAMP WITH TIME ZONE,
  reservation_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, number)
);

-- Índices para performance
CREATE INDEX idx_tickets_campaign_status ON tickets(campaign_id, status);
CREATE INDEX idx_tickets_campaign_buyer ON tickets(campaign_id, bought_by);
CREATE INDEX idx_tickets_campaign_reserved ON tickets(campaign_id, reserved_by);
CREATE INDEX idx_tickets_reservation_expires ON tickets(reservation_expires_at) WHERE status = 'reserved';

-- ============================================================
-- Tabela de Transações (compras confirmadas)
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ticket_ids UUID[] NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_campaign ON transactions(campaign_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================================
-- Tabela de Reservas (controle de carrinho)
-- ============================================================

CREATE TABLE IF NOT EXISTS cart_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ticket_numbers INTEGER[] NOT NULL,
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  transaction_id UUID REFERENCES transactions(id),
  UNIQUE(user_id, campaign_id)
);

CREATE INDEX idx_cart_reservations_user ON cart_reservations(user_id);
CREATE INDEX idx_cart_reservations_expires ON cart_reservations(expires_at) WHERE status = 'active';

-- ============================================================
-- Função: Liberar Reservas Expiradas
-- ============================================================

CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS void AS $$
BEGIN
  -- Atualizar status de reservas expiradas
  UPDATE cart_reservations
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at <= CURRENT_TIMESTAMP;

  -- Liberar tickets das reservas expiradas
  UPDATE tickets
  SET 
    status = 'available',
    reserved_by = NULL,
    reserved_at = NULL,
    reservation_expires_at = NULL
  WHERE status = 'reserved'
    AND reserved_by IN (
      SELECT user_id 
      FROM cart_reservations 
      WHERE status = 'expired'
    )
    AND reservation_expires_at <= CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Triggers para Atualizar Timestamps
-- ============================================================

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;

CREATE TRIGGER update_transactions_updated_at 
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Views para Relatórios
-- ============================================================

-- View: Status da Campanha
CREATE OR REPLACE VIEW campaign_status AS
SELECT 
  c.id,
  c.name,
  c.total_numbers,
  COUNT(CASE WHEN t.status = 'available' THEN 1 END) as available_count,
  COUNT(CASE WHEN t.status = 'reserved' THEN 1 END) as reserved_count,
  COUNT(CASE WHEN t.status = 'sold' THEN 1 END) as sold_count,
  COUNT(CASE WHEN t.status = 'winner' THEN 1 END) as winner_count,
  ROUND((COUNT(CASE WHEN t.status = 'sold' THEN 1 END) * 100.0 / c.total_numbers)::NUMERIC, 2) as percentage_sold
FROM campaigns c
LEFT JOIN tickets t ON c.id = t.campaign_id
GROUP BY c.id, c.name, c.total_numbers;

-- View: Cotas do Usuário
CREATE OR REPLACE VIEW user_tickets AS
SELECT 
  t.id,
  t.campaign_id,
  c.name as campaign_name,
  t.number,
  t.status,
  t.bought_at,
  t.reserved_at,
  t.reservation_expires_at,
  (t.reservation_expires_at > CURRENT_TIMESTAMP) as is_reservation_active
FROM tickets t
JOIN campaigns c ON t.campaign_id = c.id
WHERE t.bought_by IS NOT NULL OR t.reserved_by IS NOT NULL;

