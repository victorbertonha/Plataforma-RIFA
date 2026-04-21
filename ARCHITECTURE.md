# 🏛️ Arquitetura RIFA - Diagrama Completo

## 📐 Arquitetura Geral

```
┌────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Navegador)                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Frontend React 18 + TypeScript             │  │
│  │  - App.tsx (Rotas, Providers)                                │  │
│  │  - Pages (Home, Login, Signup, Cart, CampaignDetail, etc)   │  │
│  │  - Components (Header, Card, Modal, etc)                    │  │
│  │  - Context API (CartContext, AuthContext)                   │  │
│  │  - Services/api.ts (Cliente HTTP)                           │  │
│  │  - Rodando em: http://localhost:8081                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────────┘
                         │ HTTP/HTTPS com JWT Token
                         │ Content-Type: application/json
                         ↓
┌────────────────────────────────────────────────────────────────────┐
│                         SERVIDOR (Node.js)                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Express.js + rotas                        │  │
│  │  ├─ /api/auth       (Signup, Login, GetMe)                  │  │
│  │  ├─ /api/campaigns  (CRUD de campanhas)                     │  │
│  │  ├─ /api/tickets    (Compra, listar números)               │  │
│  │  ├─ /api/admin      (Métricas, usuários, permissões)       │  │
│  │  └─ /api/health     (Health check)                         │  │
│  │                                                              │  │
│  │  Middlewares:                                               │  │
│  │  - authenticateToken (verifica JWT)                         │  │
│  │  - requireRole (verifica permissões)                        │  │
│  │  - CORS (controla origin)                                   │  │
│  │                                                              │  │
│  │  Rodando em: http://localhost:5000                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────────┘
                         │ Conexão TCP/IP
                         ↓
┌────────────────────────────────────────────────────────────────────┐
│                      BANCO DE DADOS (PostgreSQL)                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Tabelas:                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │ users                 (autenticação)                    ││  │
│  │  │ ├─ id UUID PRIMARY KEY                                  ││  │
│  │  │ ├─ email VARCHAR UNIQUE                                 ││  │
│  │  │ ├─ password_hash VARCHAR                                ││  │
│  │  │ ├─ role ENUM (root, admin, user)                       ││  │
│  │  │ ├─ name VARCHAR(40)                                     ││  │
│  │  │ ├─ phone, cpf, is_active                                ││  │
│  │  │ └─ created_at, updated_at                               ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │ campaigns             (rifas/sorteios)                  ││  │
│  │  │ ├─ id UUID PRIMARY KEY                                  ││  │
│  │  │ ├─ title, description, image_url                        ││  │
│  │  │ ├─ category VARCHAR (eletronicos, carros, etc)         ││  │
│  │  │ ├─ total_numbers, price_per_number                      ││  │
│  │  │ ├─ status ENUM (draft, open, closed, finished)         ││  │
│  │  │ ├─ opens_at, closes_at TIMESTAMP                        ││  │
│  │  │ ├─ winner_id, winner_number                             ││  │
│  │  │ ├─ created_by (FK → users)                              ││  │
│  │  │ └─ created_at, updated_at                               ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │ tickets               (números para compra)            ││  │
│  │  │ ├─ id UUID PRIMARY KEY                                  ││  │
│  │  │ ├─ campaign_id (FK → campaigns)                         ││  │
│  │  │ ├─ number INTEGER                                       ││  │
│  │  │ ├─ status ENUM (available, sold, winner)               ││  │
│  │  │ ├─ bought_by (FK → users)                               ││  │
│  │  │ └─ bought_at TIMESTAMP                                  ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │ transactions          (histórico de compras)            ││  │
│  │  │ ├─ id UUID PRIMARY KEY                                  ││  │
│  │  │ ├─ user_id (FK → users)                                 ││  │
│  │  │ ├─ campaign_id (FK → campaigns)                         ││  │
│  │  │ ├─ ticket_ids UUID[] (quais números comprados)          ││  │
│  │  │ ├─ amount, tax, total DECIMAL                           ││  │
│  │  │ ├─ status VARCHAR (completed, pending, etc)             ││  │
│  │  │ └─ created_at                                           ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │ audit_logs            (segurança e auditoria)           ││  │
│  │  │ ├─ id UUID PRIMARY KEY                                  ││  │
│  │  │ ├─ user_id (FK → users)                                 ││  │
│  │  │ ├─ action VARCHAR                                       ││  │
│  │  │ ├─ entity_type VARCHAR (campaign, user, ticket)         ││  │
│  │  │ ├─ entity_id UUID                                       ││  │
│  │  │ ├─ details JSONB                                        ││  │
│  │  │ └─ created_at                                           ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  │                                                              │  │
│  │  Rodando em: localhost:5432                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Fluxo de Autenticação

```
┌─────────────────────────┐
│  1. Usuário clica em    │
│     "Cadastro"          │
└────────────┬────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  2. Frontend envia POST /api/auth/signup        │
│     {name, email, phone, cpf, password}         │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  3. Backend:                                    │
│     - Valida email e CPF                        │
│     - Verifica se email já existe               │
│     - Hash a senha com bcrypt                   │
│     - Insere na tabela 'users'                  │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  4. Backend gera JWT Token                      │
│     Payload: {id, email, role}                  │
│     Válido por 7 dias                           │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  5. Frontend recebe token e armazena:           │
│     localStorage.setItem('token', token)        │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  6. Próximas requisições:                       │
│     Header: Authorization: Bearer {token}       │
│     Backend verifica com verifyToken()          │
└────────────┬────────────────────────────────────┘
             ↓
     ✅ Autenticado!
```

---

## 👥 Fluxo de Permissões

```
┌────────────────────────┐
│  Token JWT válido?     │
└────────┬───────────────┘
         │
    ┌────┴─────┐
    NO         SIM
    │          │
    ▼          ▼
  401      ┌────────────────────┐
        │  Usuário é:          │
        │  - root?             │
        │  - admin?            │
        │  - user?             │
        └────────┬─────────────┘
                 │
   ┌─────────────┼─────────────┐
   ▼             ▼             ▼
 ROOT          ADMIN         USER
   │             │             │
   │ Pode:       │ Pode:       │ Pode:
   │             │             │
   ├─ Tudo      ├─ Gerenciar  ├─ Comprar
   │             │  campanhas  │  tickets
   ├─ Dar role   │             │
   │  a admin    ├─ Gerenciar  ├─ Ver seus
   │             │  usuários   │  pedidos
   ├─ Ver tudo   │             │
   │             ├─ Ver        ├─ Editar
   └─ Deletar    │  relatórios │  perfil
      contas     │
                 └─ Não pode
                    alterar
                    roles
```

---

## 💳 Fluxo de Compra

```
┌─────────────────────────────────────────┐
│  1. Usuário em CampaignDetail           │
│     Seleciona números (ex: 1, 2, 3)     │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  2. Frontend chama:                     │
│     ticketsAPI.buy(campaignId, [1,2,3])│
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  3. Backend começa transação (BEGIN)    │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  4. Verifica se números estão livres    │
│     WHERE status = 'available'          │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      NÃO           SIM
      │             │
      ▼             ▼
   ROLLBACK    ┌──────────────────┐
   ERROR       │ 5. Atualiza      │
               │    tickets:      │
               │ UPDATE tickets   │
               │ SET status =     │
               │  'sold',         │
               │  bought_by = $id │
               └────────┬─────────┘
                        ▼
               ┌──────────────────┐
               │ 6. Cria          │
               │    transação     │
               │ INSERT           │
               │ transactions     │
               │ {amount, tax,    │
               │  total}          │
               └────────┬─────────┘
                        ▼
               ┌──────────────────┐
               │ 7. COMMIT        │
               │    (salva tudo)  │
               └────────┬─────────┘
                        ▼
               ✅ Compra confirmada!
```

---

## 📊 Fluxo de Sorteia Automático (Futuro)

```
┌──────────────────────────────────┐
│  Cron Job a cada minuto          │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│  Procura campanhas               │
│  WHERE closes_at < NOW()         │
│  AND status = 'open'             │
└────────────┬─────────────────────┘
             ▼
    ┌────────────────┐
    │ Tem campanha?  │
    └────────┬───────┘
             │
        ┌────┴────┐
       NÃO         SIM
        │          │
        ▼          ▼
      WAIT    ┌─────────────────┐
              │ 1. Busca todos  │
              │    números sold │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │ 2. Gera número  │
              │    aleatório    │
              │    (winner)     │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │ 3. UPDATE       │
              │    campaigns    │
              │    SET          │
              │    winner_id,   │
              │    winner_number│
              │    status=finish│
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │ 4. UPDATE       │
              │    tickets      │
              │    SET status=  │
              │    'winner'     │
              │    WHERE number │
              │    = winner_num │
              └────────┬────────┘
                       ▼
              🎉 Sorteio realizado!
              Notificar ganhador
```

---

## 🛡️ Camadas de Segurança

```
┌─────────────────────────────────────────┐
│  Camada 1: Navegador                    │
│  ├─ Token em localStorage                │
│  ├─ HTTPS (recomendado)                  │
│  └─ XSS Protection (React)               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Camada 2: Rede                         │
│  ├─ CORS configurado                     │
│  ├─ Content-Type: application/json       │
│  └─ Header validation                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Camada 3: Express Middleware           │
│  ├─ authenticateToken (JWT verify)       │
│  ├─ requireRole (permission check)       │
│  └─ Input validation                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Camada 4: Banco de Dados               │
│  ├─ Senhas em bcrypt hash                │
│  ├─ SQL Injection Prevention (pg module) │
│  ├─ Email/CPF únicos (UNIQUE constraint) │
│  └─ Foreign keys (integridade)           │
└─────────────────────────────────────────┘
```

---

## 📈 Escalabilidade Futura

```
┌──────────────────┐
│  Fase 1: Atual   │     Pronto para
│  - Single Server │     escalar para:
│  - PostgreSQL    │
└──────────────────┘
          ↓
┌──────────────────────────────┐
│  Fase 2: Load Balancer       │
│  - Múltiplos servidores      │
│  - Nginx reverse proxy       │
│  - Redis cache               │
└──────────────────────────────┘
          ↓
┌──────────────────────────────┐
│  Fase 3: Microserviços       │
│  - API separada              │
│  - Auth service              │
│  - Payment service           │
│  - Notification service      │
└──────────────────────────────┘
          ↓
┌──────────────────────────────┐
│  Fase 4: Cloud Scale         │
│  - Kubernetes                │
│  - Auto-scaling              │
│  - CDN para mídia            │
│  - Database replication      │
└──────────────────────────────┘
```

---

**Seu sistema está pronto para começar! 🚀**
