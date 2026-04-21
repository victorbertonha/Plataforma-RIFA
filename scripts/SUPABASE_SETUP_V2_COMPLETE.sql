-- ============================================================
-- RIFA PROJECT - SUPABASE SETUP SCRIPT V2
-- Schema com Tickets, Reservas e Pagamentos
-- ============================================================
-- Execute este script no SQL Editor do Supabase
-- Passo a passo:
-- 1. Abra supabase.com
-- 2. Vá para seu projeto
-- 3. SQL Editor
-- 4. Copie todo o conteúdo deste arquivo
-- 5. Cole no SQL Editor
-- 6. Execute (Play)
-- ============================================================

-- ============================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. TABELA: CAMPAIGNS (Rifas)
-- ============================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_numbers INTEGER NOT NULL,
  price_per_number DECIMAL(10,2) NOT NULL,
  prize_price DECIMAL(10,2) DEFAULT 0,
  image_url VARCHAR(500),
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. TABELA: TICKETS (Cotas Individuais)
-- ============================================================
-- Estados:
--   'available' = Disponível para compra
--   'reserved'  = Reservado no carrinho (24h válida)
--   'sold'      = Comprado e pago
--   'winner'    = Ganhou o prêmio
-- ============================================================

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'winner')),
  
  -- Campos de Compra (sold)
  bought_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bought_at TIMESTAMP WITH TIME ZONE,
  
  -- Campos de Reserva (reserved)
  reserved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_at TIMESTAMP WITH TIME ZONE,
  reservation_expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(campaign_id, number)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_status ON tickets(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_buyer ON tickets(campaign_id, bought_by);
CREATE INDEX IF NOT EXISTS idx_tickets_campaign_reserved ON tickets(campaign_id, reserved_by);
CREATE INDEX IF NOT EXISTS idx_tickets_reservation_expires ON tickets(reservation_expires_at) WHERE status = 'reserved';
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(campaign_id, number);

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. TABELA: CART_RESERVATIONS (Carrinho)
-- ============================================================
-- Rastreia reservas do carrinho do usuário
-- ============================================================

CREATE TABLE IF NOT EXISTS cart_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ticket_numbers INTEGER[] NOT NULL,
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_reservations_user ON cart_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_campaign ON cart_reservations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_expires ON cart_reservations(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cart_reservations_status ON cart_reservations(status);

DROP TRIGGER IF EXISTS update_cart_reservations_updated_at ON cart_reservations;
CREATE TRIGGER update_cart_reservations_updated_at BEFORE UPDATE ON cart_reservations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. TABELA: TRANSACTIONS (Histórico de Compras)
-- ============================================================
-- Estados:
--   'pending'   = Aguardando pagamento
--   'completed' = Pagamento confirmado
--   'failed'    = Pagamento falhou
--   'refunded'  = Reembolsado
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ticket_ids UUID[] NOT NULL,
  ticket_numbers INTEGER[] NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_campaign ON transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. TABELA: WINNERS (Ganhadores)
-- ============================================================

CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  winning_number INTEGER NOT NULL,
  prize VARCHAR(255),
  drawn_at TIMESTAMP WITH TIME ZONE NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_winners_campaign ON winners(campaign_id);
CREATE INDEX IF NOT EXISTS idx_winners_user ON winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_ticket ON winners(ticket_id);

DROP TRIGGER IF EXISTS update_winners_updated_at ON winners;
CREATE TRIGGER update_winners_updated_at BEFORE UPDATE ON winners
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. FUNÇÃO: Liberar Reservas Expiradas
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
    reservation_expires_at = NULL,
    updated_at = CURRENT_TIMESTAMP
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
-- 7. VIEWS: Relatórios e Consultas Otimizadas
-- ============================================================

-- View: Status da Campanha
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

-- View: Cotas do Usuário (compradas + reservadas)
DROP VIEW IF EXISTS user_tickets CASCADE;
CREATE VIEW user_tickets AS
SELECT 
  t.id,
  t.campaign_id,
  c.name as campaign_name,
  t.number,
  t.status,
  t.bought_by,
  t.bought_at,
  t.reserved_by,
  t.reserved_at,
  t.reservation_expires_at,
  (t.status = 'reserved' AND t.reservation_expires_at > CURRENT_TIMESTAMP) as is_reservation_active,
  (t.reservation_expires_at - CURRENT_TIMESTAMP) as time_until_expiration
FROM tickets t
JOIN campaigns c ON t.campaign_id = c.id
WHERE t.bought_by IS NOT NULL OR (t.reserved_by IS NOT NULL AND t.status = 'reserved');

-- View: Dashboard do Usuário
DROP VIEW IF EXISTS user_dashboard CASCADE;
CREATE VIEW user_dashboard AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT CASE WHEN t.status = 'sold' THEN t.campaign_id END) as campaigns_participated,
  COUNT(CASE WHEN t.status = 'sold' THEN 1 END) as total_tickets_bought,
  COUNT(CASE WHEN t.status = 'reserved' THEN 1 END) as total_reserved_tickets,
  SUM(CASE WHEN t.status = 'sold' THEN tr.total ELSE 0 END) as total_spent,
  COUNT(CASE WHEN w.id IS NOT NULL THEN 1 END) as total_wins
FROM auth.users u
LEFT JOIN tickets t ON u.id = t.bought_by OR u.id = t.reserved_by
LEFT JOIN transactions tr ON u.id = tr.user_id AND tr.status = 'completed'
LEFT JOIN winners w ON u.id = w.user_id
GROUP BY u.id, u.email;

-- ============================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. RLS POLICIES - CAMPAIGNS
-- ============================================================

DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON campaigns;
CREATE POLICY "Campaigns are viewable by everyone"
  ON campaigns FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can insert campaigns" ON campaigns;
CREATE POLICY "Only admins can insert campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE email ILIKE '%admin%')
  );

-- ============================================================
-- 10. RLS POLICIES - TICKETS
-- ============================================================

DROP POLICY IF EXISTS "Tickets are viewable by everyone" ON tickets;
CREATE POLICY "Tickets are viewable by everyone"
  ON tickets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
CREATE POLICY "Users can view their own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = bought_by OR auth.uid() = reserved_by);

-- ============================================================
-- 11. RLS POLICIES - CART_RESERVATIONS
-- ============================================================

DROP POLICY IF EXISTS "Users can view own reservations" ON cart_reservations;
CREATE POLICY "Users can view own reservations"
  ON cart_reservations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own reservations" ON cart_reservations;
CREATE POLICY "Users can manage own reservations"
  ON cart_reservations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 12. RLS POLICIES - TRANSACTIONS
-- ============================================================

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 13. RLS POLICIES - WINNERS
-- ============================================================

DROP POLICY IF EXISTS "Winners are viewable by everyone" ON winners;
CREATE POLICY "Winners are viewable by everyone"
  ON winners FOR SELECT
  USING (true);

-- ============================================================
-- 14. SAMPLE DATA (OPCIONAL - descomente se quiser testar)
-- ============================================================

-- INSERT INTO campaigns (name, description, total_numbers, price_per_number, category, status)
-- VALUES 
--   ('Mercedes 2026', 'Rifa de uma Mercedes Benz 2026', 50000, 10.00, 'Carros', 'active'),
--   ('iPhone 15 Pro', 'Rifa de um iPhone 15 Pro Max', 1000, 50.00, 'Eletrônicos', 'active'),
--   ('Moto G15', 'Rifa de uma Moto G15', 2000, 25.00, 'Eletrônicos', 'active');

-- ============================================================
-- 15. VERIFY SETUP
-- ============================================================

-- Execute essas queries para verificar se tudo foi criado:
-- SELECT * FROM information_schema.tables WHERE table_name IN ('campaigns', 'tickets', 'cart_reservations', 'transactions', 'winners');
-- SELECT * FROM pg_indexes WHERE tablename = 'tickets';
-- SELECT * FROM pg_policies WHERE tablename IN ('campaigns', 'tickets', 'cart_reservations', 'transactions', 'winners');

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
