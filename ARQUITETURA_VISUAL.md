# 🏗️ ARQUITETURA VISUAL - Solução de Rifas v2.0

## 📊 Fluxo de Dados Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Pages/Components                                        │   │
│  ├─ CampaignDetail   (vê cotas)                             │   │
│  ├─ Cart             (carrinho)                             │   │
│  ├─ Checkout         (confirma)                             │   │
│  └─ MyPurchases      (minhas cotas)                         │   │
│                                                              │   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CartContext (src/context/CartContext.tsx)              │   │
│  ├─ items[]                                                 │   │
│  ├─ syncWithBackend()  → POST /reserve                      │   │
│  ├─ confirmPurchase()  → POST /confirm-purchase             │   │
│  └─ cancelReservation()→ POST /cancel-reservation           │   │
│                                                              │   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Service (src/services/api.ts)                       │   │
│  ├─ ticketsAPI.reserve()                                    │   │
│  ├─ ticketsAPI.confirmPurchase()                            │   │
│  ├─ ticketsAPI.cancelReservation()                          │   │
│  ├─ ticketsAPI.getAvailable()                               │   │
│  ├─ ticketsAPI.getReserved()                                │   │
│  ├─ ticketsAPI.getPurchased()                               │   │
│  ├─ ticketsAPI.getStatus()                                  │   │
│  └─ ticketsAPI.getTransactions()                            │   │
│                                                              │   │
│  localStorage (carrinho local)                              │   │
└──────────────────────────────────────────────────────────────┘   │
                              ↕️ HTTP/JSON
                              ↕️ JWT Token
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  API Endpoints (backend/src/routes/tickets.js)          │    │
│  ├─ POST   /reserve                                         │    │
│  ├─ POST   /confirm-purchase                                │    │
│  ├─ POST   /cancel-reservation                              │    │
│  ├─ GET    /user/purchased/:campaignId                      │    │
│  ├─ GET    /user/reserved/:campaignId                       │    │
│  ├─ GET    /campaign/:id/available                          │    │
│  ├─ GET    /campaign/:id/status                             │    │
│  └─ GET    /user/transactions/:campaignId                   │    │
│                                                              │    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Middleware & Autenticação                               │    │
│  ├─ authenticateToken  (JWT verify)                         │    │
│  ├─ Validação de entrada                                    │    │
│  └─ Tratamento de erros                                     │    │
│                                                              │    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Transações ACID (pg client)                             │    │
│  ├─ BEGIN                                                    │    │
│  ├─ SELECT (locks implícitos)                               │    │
│  ├─ UPDATE/INSERT                                           │    │
│  └─ COMMIT / ROLLBACK                                       │    │
└──────────────────────────────────────────────────────────────────┘
                              ↕️ SQL
┌──────────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL + Supabase)                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Tabelas Principais                                      │    │
│  ├─ campaigns (rifas)                                       │    │
│  │  ├─ id, name, total_numbers, price_per_number           │    │
│  │  └─ status (active, inactive, completed)                │    │
│  │                                                          │    │
│  ├─ tickets (cotas individuais) [50.000+ linhas]           │    │
│  │  ├─ id, campaign_id, number                             │    │
│  │  ├─ status (available, reserved, sold, winner)          │    │
│  │  ├─ bought_by, bought_at (se sold)                      │    │
│  │  └─ reserved_by, reserved_at, expires_at (se reserved)  │    │
│  │                                                          │    │
│  ├─ cart_reservations (carrinho do usuário)                │    │
│  │  ├─ user_id, campaign_id                                │    │
│  │  ├─ ticket_numbers [1,2,3,...,10]                       │    │
│  │  ├─ expires_at (agora + 24h)                            │    │
│  │  └─ status (active, completed, expired)                 │    │
│  │                                                          │    │
│  ├─ transactions (histórico de compras)                    │    │
│  │  ├─ user_id, campaign_id, ticket_ids                    │    │
│  │  ├─ amount, tax, total                                  │    │
│  │  ├─ status (completed, failed, refunded)                │    │
│  │  └─ payment_method, payment_id                          │    │
│  │                                                          │    │
│  └─ winners (ganhadores)                                   │    │
│     ├─ campaign_id, ticket_id, user_id                    │    │
│     └─ winning_number, prize, drawn_at                    │    │
│                                                              │    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Índices (Performance)                                   │    │
│  ├─ idx_tickets_campaign_status → O(log n)                │    │
│  ├─ idx_tickets_campaign_buyer → O(log n)                 │    │
│  ├─ idx_tickets_reservation_expires → O(log n)            │    │
│  ├─ idx_cart_reservations_user → O(log n)                 │    │
│  └─ idx_transactions_user → O(log n)                      │    │
│                                                              │    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Views (Relatórios)                                      │    │
│  ├─ campaign_status → disponíveis, reservadas, vendidas    │    │
│  ├─ user_tickets → minhas cotas                            │    │
│  └─ user_dashboard → resumo de compras                     │    │
│                                                              │    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Funções PostgreSQL                                      │    │
│  ├─ update_updated_at_column() → triggers                  │    │
│  └─ release_expired_reservations() → libera expiradas      │    │
│                                                              │    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  RLS Policies                                            │    │
│  ├─ Usuários veem apenas suas cotas                        │    │
│  ├─ Apenas admins criam campanhas                          │    │
│  └─ Tickets públicos, detalhes privados                    │    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Estado das Cotas (Máquina de Estados)

```
                           ┌─────────────┐
                           │  DISPONÍVEL │
                           │ (available) │
                           └──────┬──────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
                    ↓                            ↓
            ┌──────────────┐          ┌──────────────────┐
            │  EXPIRAÇÃO   │          │   RESERVADO      │
            │  (1 semana)  │          │  (reserved)      │
            │              │          │                  │
            │ • Sem vendas │          │ • No carrinho    │
            │ • Remover da │          │ • 24h válida     │
            │   campanha   │          │ • Aguarda pago   │
            └──────────────┘          └────────┬─────────┘
                                               │
                          ┌────────────────────┴───────────────┐
                          │                                    │
                          ↓ (24h expira)                       ↓ (paga)
            ┌─────────────────────┐             ┌─────────────────────┐
            │    LIBERADO AUTO    │             │  SOLD/COMPRADO      │
            │ (volta available)   │             │  (sold)             │
            └──────────┬──────────┘             │                     │
                       │                        │ • Permanente        │
                       ↓                        │ • Do usuário forever│
          ┌──────────────────────┐             │ • No histórico      │
          │ Volta para DISPONÍVEL│             └────────┬────────────┘
          │ Outro pode comprar   │                      │
          └──────────────────────┘                      ↓
                                            ┌──────────────────────┐
                                            │  WINNER (opcional)   │
                                            │  (winner)            │
                                            │                      │
                                            │ • Ganhou sorteio     │
                                            │ • Pode reclamar      │
                                            └──────────────────────┘
```

---

## 🎯 Fluxo de Compra Completo

```
User (JOAO123)
    │
    └─→ Browse (GET /campaign/uuid/available)
    │   └─→ Vê 50.000 cotas disponíveis
    │
    └─→ Add to Cart
    │   ├─ addToCart() [local]
    │   └─ localStorage.setItem('cart')
    │
    └─→ View Cart (Page)
    │   └─ Show items com input quantity
    │
    └─→ Checkout Button
    │   │
    │   └─→ syncWithBackend()
    │       │
    │       ├─ POST /reserve
    │       │  └─ Backend:
    │       │     ├─ release_expired_reservations()
    │       │     ├─ SELECT available tickets
    │       │     ├─ UPDATE status='reserved'
    │       │     └─ INSERT cart_reservations
    │       │
    │       └─ Response:
    │          ├─ expiresAt: 2026-01-24 10:30
    │          └─ ✅ Cotas reservadas por 24h
    │
    └─→ Payment Processing (Stripe/PIX)
    │   ├─ createPaymentIntent()
    │   ├─ paymentId: "pay_123abc"
    │   └─ Status: COMPLETED
    │
    └─→ Confirm Purchase
        │
        └─→ confirmPurchase(campaignId, paymentId, method)
            │
            ├─ POST /confirm-purchase
            │  └─ Backend:
            │     ├─ BEGIN
            │     ├─ SELECT cart_reservations (active)
            │     ├─ Verify reservation NOT expired
            │     ├─ Verify tickets still reserved
            │     ├─ UPDATE tickets status='sold'
            │     ├─ INSERT transactions
            │     ├─ UPDATE cart_reservations status='completed'
            │     └─ COMMIT
            │
            └─ Response:
               ├─ transaction: {...}
               ├─ ticket_numbers: [1,2,3,...,10]
               └─ ✅ Compra finalizada!

    └─→ My Purchases (Page)
        │
        └─→ GET /user/purchased/:campaignId
            └─ Mostra 10 cotas (status='sold')
```

---

## 🛡️ Camadas de Segurança

```
┌─────────────────────────────────────────────────────┐
│ 1️⃣ FRONTEND SECURITY                               │
│ ├─ localStorage encryption (future)                │
│ ├─ HTTPS only                                      │
│ ├─ Input validation (client-side)                  │
│ └─ CSRF tokens (future)                            │
└─────────────────────────────────────────────────────┘
            ↓ HTTPS + JWT Token
┌─────────────────────────────────────────────────────┐
│ 2️⃣ API SECURITY (Backend)                          │
│ ├─ JWT Authentication                              │
│ ├─ Input Validation                                │
│ ├─ Rate Limiting (future)                          │
│ └─ CORS Policy                                     │
└─────────────────────────────────────────────────────┘
            ↓ Parameterized Queries
┌─────────────────────────────────────────────────────┐
│ 3️⃣ DATABASE SECURITY (PostgreSQL)                  │
│ ├─ ACID Transactions                               │
│ ├─ Row Level Security (RLS)                        │
│ ├─ Locks (SELECT FOR UPDATE)                       │
│ ├─ Parameterized Queries (pg driver)               │
│ └─ Constraints (UNIQUE, CHECK)                     │
└─────────────────────────────────────────────────────┘
            ↓ Supabase Hosting
┌─────────────────────────────────────────────────────┐
│ 4️⃣ INFRASTRUCTURE SECURITY                         │
│ ├─ SSL/TLS Encryption                              │
│ ├─ Firewalls                                       │
│ ├─ DDoS Protection                                 │
│ └─ Automated Backups                               │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Estrutura do Banco de Dados

```
campaigns (rifas)
├─ id (UUID)
├─ name
├─ total_numbers
├─ price_per_number
└─ status
   │
   └─┐
     │
     └─→ tickets (50.000+ cotas)
        ├─ id (UUID)
        ├─ campaign_id (FK)
        ├─ number (1-50000)
        ├─ status (available|reserved|sold|winner)
        ├─ bought_by (FK → auth.users)
        ├─ bought_at
        ├─ reserved_by (FK → auth.users)
        ├─ reserved_at
        └─ reservation_expires_at
           │
           ├─→ cart_reservations (carrinho)
           │  ├─ id (UUID)
           │  ├─ user_id (FK)
           │  ├─ campaign_id (FK)
           │  ├─ ticket_numbers (array)
           │  ├─ expires_at
           │  ├─ status
           │  └─ transaction_id (FK)
           │
           └─→ transactions (histórico)
              ├─ id (UUID)
              ├─ user_id (FK)
              ├─ campaign_id (FK)
              ├─ ticket_ids (array)
              ├─ ticket_numbers (array)
              ├─ amount
              ├─ tax
              ├─ total
              ├─ status
              ├─ payment_method
              └─ payment_id
                 │
                 └─→ winners (ganhadores)
                    ├─ id (UUID)
                    ├─ campaign_id (FK)
                    ├─ ticket_id (FK)
                    ├─ user_id (FK)
                    └─ winning_number

auth.users
├─ id (UUID)
├─ email
└─ ... (Supabase Auth)
```

---

## ⚡ Performance Stack

```
Query Pattern:
├─ 50.000 linhas (tickets)
├─ 10.000+ linhas (transactions)
└─ 1.000+ linhas (cart_reservations)

Índices Implementados:
├─ B-Tree sobre campaign_id, status
│  └─ Busca: O(log n) ≈ 5ms para 50.000
├─ B-Tree sobre user_id
│  └─ Relatório: O(log n) ≈ 2ms
└─ B-Tree sobre expires_at
   └─ Limpeza: O(log n) ≈ 3ms

Views Pré-calculadas:
├─ campaign_status → Evita COUNT pesado
├─ user_tickets → Evita JOINs complexos
└─ user_dashboard → Agregação rápida

Benchmarks (estim.):
├─ GET /available: 5-10ms
├─ POST /reserve: 50-100ms (transação)
├─ GET /status: 2-5ms (view)
└─ GET /purchased: 5-10ms
```

---

## 🔐 Fluxo de Segurança

```
POST /reserve
├─1. Verify JWT ✅
├─2. Parse input ✅
├─3. Validate (numbers exist, positive) ✅
├─4. BEGIN transaction
├─5. Lock table (implicit)
├─6. SELECT count(available)
├─7. Verify count == requested ✅
├─8. UPDATE status='reserved' (atomic)
├─9. INSERT cart_reservations
├─10. COMMIT
└─11. Response 201 with expiresAt

Proteção contra:
├─ SQL Injection → Parameterized queries
├─ Race Condition → ACID + locks
├─ Replay Attack → JWT expiration
├─ Unauth Access → JWT verify
└─ Invalid Data → Input validation
```

---

## 📱 API Contract

```
POST /reserve
├─ Body: { campaignId, numbers[] }
├─ Auth: JWT required
├─ Response 201:
│  └─ { success, reserved: { campaignId, numbers, expiresAt } }
└─ Response 400: { error: "números não disponíveis" }

POST /confirm-purchase
├─ Body: { campaignId, paymentId, paymentMethod }
├─ Auth: JWT required
├─ Response 201:
│  └─ { success, transaction: {...} }
└─ Response 400: { error: "reserva expirada" }

GET /user/purchased/:campaignId
├─ Auth: JWT required
├─ Response 200:
│  └─ { campaignId, purchasedTickets: [...], count }
└─ Response 404: { error: "não encontrado" }

GET /campaign/:campaignId/status
├─ Auth: Optional
├─ Response 200:
│  └─ { available_count, reserved_count, sold_count, ... }
└─ Response 404: { error: "campanha não encontrada" }
```

---

## 🎯 Resumo Visual

```
┌──────────────────────────────────────────────────────┐
│   USUÁRIO                                            │
│   └─ Carrinho (localStorage)                         │
│      └─ syncWithBackend()                            │
│         └─ POST /reserve → Cotas Reservadas (24h)   │
│            └─ confirmPurchase()                      │
│               └─ POST /confirm-purchase → Cotas Sold │
│                  └─ Aparece em "Minhas Compras"      │
│                                                       │
│   SEGURANÇA: ACID + RLS + JWT + Locks                │
│   PERFORMANCE: Índices + Views + O(log n)            │
│   ESCALABILIDADE: Suporta 1M+ cotas                  │
└──────────────────────────────────────────────────────┘
```

---

✨ **Arquitetura completa, segura e escalável!**
