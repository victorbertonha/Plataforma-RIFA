# 🔐 Fluxo Seguro de Compra com Reservas (JOAO123 → Mercedes)

## 📊 Estados das Cotas

```
┌──────────────┐
│  available   │  ← Ninguém tocou
└──────────────┘
       ↓ (usuário clica "Comprar")
┌──────────────┐
│  reserved    │  ← Reservado no carrinho (24h)
└──────────────┘       Se sair do carrinho:
       ↓                ↻ volta para available
  (Pagar!)
┌──────────────┐
│    sold      │  ← Compra confirmada! É dele!
└──────────────┘
```

---

## 🎯 Cenário Completo: JOAO123 Compra 10 Cotas

### **ETAPA 1: JOAO Adiciona ao Carrinho**

**Ação**: Clica em "Comprar" para cotas 1-10 da Mercedes

**Frontend**:
```typescript
// Usuário clica "Comprar cotas 1-10"
await ticketsAPI.reserve('uuid-mercedes', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
```

**Backend**: `POST /tickets/reserve`
```javascript
{
  campaignId: 'uuid-mercedes',
  numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}
```

**O que acontece no banco**:

```sql
-- ANTES:
┌─────────┬────────┬─────────────────┐
│ number  │ status │    reserved_by  │
├─────────┼────────┼─────────────────┤
│    1    │avail   │    NULL         │
│    2    │avail   │    NULL         │
│   ...   │avail   │    NULL         │
│   10    │avail   │    NULL         │
└─────────┴────────┴─────────────────┘

-- DEPOIS (POST /reserve):
┌─────────┬──────────┬──────────────────────┬──────────────────────┐
│ number  │  status  │   reserved_by        │ reservation_expires  │
├─────────┼──────────┼──────────────────────┼──────────────────────┤
│    1    │reserved  │ uuid-joao123         │ 2026-01-24 10:30     │
│    2    │reserved  │ uuid-joao123         │ 2026-01-24 10:30     │
│   ...   │reserved  │ uuid-joao123         │ 2026-01-24 10:30     │
│   10    │reserved  │ uuid-joao123         │ 2026-01-24 10:30     │
│   11    │avail     │ NULL                 │ NULL                 │
└─────────┴──────────┴──────────────────────┴──────────────────────┘
```

**Response**:
```json
{
  "success": true,
  "reserved": {
    "campaignId": "uuid-mercedes",
    "numbers": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "count": 10,
    "expiresAt": "2026-01-24T10:30:00Z",
    "message": "✅ Cotas reservadas por 24h"
  }
}
```

✅ **Resultado**: Cotas RESERVADAS mas NÃO PAGAS

---

### **ETAPA 2: JOAO Vê o Carrinho**

**Frontend**:
```typescript
const reserved = await ticketsAPI.getReserved('uuid-mercedes');

// Mostra:
// 🛒 Carrinho (10 cotas)
// Cota #1 - Reservado até 24/01 10:30
// Cota #2 - Reservado até 24/01 10:30
// ...
// Cota #10 - Reservado até 24/01 10:30
// 
// ⚠️ Atenção: Sua reserva expira em 23h 59m
// 
// [Ir para Pagamento] [Remover do Carrinho]
```

**Status no banco**:
- Cotas 1-10: `status = 'reserved'` ✅
- Outras cotas: `status = 'available'` ✅
- Outra pessoa **NÃO CONSEGUE** comprar cotas 1-10

---

### **ETAPA 3A: JOAO PAGA ✅**

**Ação**: Clica em "Confirmar e Pagar"

**Frontend**:
```typescript
// Simular pagamento (pode ser Stripe, PIX, etc)
const paymentResult = await processPayment({
  amount: 101.00,
  method: 'credit_card'
});

if (paymentResult.success) {
  // Confirmar compra no backend
  await ticketsAPI.confirmPurchase({
    campaignId: 'uuid-mercedes',
    paymentId: paymentResult.transactionId,
    paymentMethod: 'credit_card'
  });
}
```

**Backend**: `POST /tickets/confirm-purchase`

**Validações**:
```
1. ✅ Reserva ainda existe?
2. ✅ Reserva não expirou?
3. ✅ Cotas ainda estão 'reserved' para este usuário?
4. ✅ Preço da campanha OK?
```

**Transação Atômica** (tudo ou nada):
```javascript
BEGIN;
  // 1. Verificar reserva ativa
  // 2. Verificar cotas ainda reservadas
  // 3. Buscar preço
  // 4. UPDATE: 'reserved' → 'sold'
  // 5. INSERT: transaction
  // 6. UPDATE: cart_reservations status = 'completed'
COMMIT;
```

**Estado Final no Banco**:

```sql
-- TICKETS:
┌─────────┬────────┬──────────────────────┬─────────────────────┐
│ number  │ status │    bought_by         │      bought_at      │
├─────────┼────────┼──────────────────────┼─────────────────────┤
│    1    │ sold   │ uuid-joao123         │ 2026-01-23 10:30:15 │
│    2    │ sold   │ uuid-joao123         │ 2026-01-23 10:30:15 │
│   ...   │ sold   │ uuid-joao123         │ 2026-01-23 10:30:15 │
│   10    │ sold   │ uuid-joao123         │ 2026-01-23 10:30:15 │
│   11    │avail   │ NULL                 │ NULL                │
└─────────┴────────┴──────────────────────┴─────────────────────┘

-- TRANSACTIONS:
┌──────────────────────────┬──────────────────────┬─────────┐
│         id               │        user_id       │ status  │
├──────────────────────────┼──────────────────────┼─────────┤
│ uuid-trans-2026-01-23-01 │ uuid-joao123         │complete │
└──────────────────────────┴──────────────────────┴─────────┘

-- CART_RESERVATIONS:
┌──────────────────────┬─────────────┐
│    transaction_id    │   status    │
├──────────────────────┼─────────────┤
│ uuid-trans-xxx       │ completed   │
└──────────────────────┴─────────────┘
```

**Response**:
```json
{
  "success": true,
  "transaction": {
    "id": "uuid-trans-2026-01-23-01",
    "user_id": "uuid-joao123",
    "campaign_id": "uuid-mercedes",
    "ticket_ids": ["uuid-001", "uuid-002", ..., "uuid-010"],
    "amount": 100.00,
    "tax": 1.00,
    "total": 101.00,
    "status": "completed",
    "payment_method": "credit_card",
    "created_at": "2026-01-23T10:30:15Z"
  },
  "message": "✅ 10 cotas compradas com sucesso!"
}
```

**Frontend**:
```typescript
// ✅ Mostrar confirmação
toast.success('Parabéns! Você comprou 10 cotas!');

// Limpar carrinho
clearCart();

// Ir para "Minhas Compras"
navigate('/my-purchases');
```

✅ **Resultado**: Cotas agora são de JOAO123 PERMANENTEMENTE!

---

### **ETAPA 3B: JOAO NÃO PAGA ❌ (Sai do carrinho)**

**Ação**: Fecha o navegador / clica "Remover do carrinho"

**Frontend**:
```typescript
// Usuário clica "Remover do Carrinho"
await ticketsAPI.cancelReservation('uuid-mercedes');
```

**Backend**: `POST /tickets/cancel-reservation`

**O que acontece**:
```sql
-- UPDATE tickets: volta para 'available'
UPDATE tickets 
SET status = 'available', reserved_by = NULL
WHERE campaign_id = 'uuid-mercedes' 
  AND number IN (1, 2, ..., 10);

-- DELETE: remove reserva do carrinho
DELETE FROM cart_reservations 
WHERE user_id = 'uuid-joao123' AND campaign_id = 'uuid-mercedes';
```

**Estado Final**:
```
Cotas 1-10: status = 'available' ✅ (outros podem comprar!)
JOAO não tem essas cotas
Nenhuma transação foi criada
```

❌ **Resultado**: Cotas liberadas! Outro usuário pode comprar!

---

### **ETAPA 4: Expiração Automática (24h)**

**Se JOAO reservou mas NÃO PAGOU e passaram 24h**:

**Sistema Automático** (pode ser um cron job):
```javascript
// A cada 1h, executar:
SELECT release_expired_reservations();

// Isso libera automaticamente:
UPDATE tickets
SET status = 'available', reserved_by = NULL
WHERE status = 'reserved' AND reservation_expires_at <= CURRENT_TIMESTAMP;
```

**Estado Final**:
```
Cotas 1-10: status = 'available' ✅
JOAO não tem essas cotas
Nenhuma transação foi criada
Outro usuário pode comprar!
```

---

## 📱 Resumo dos Endpoints

### **1. Reservar Cotas (Add ao Carrinho)**
```bash
POST /api/tickets/reserve
{
  "campaignId": "uuid-mercedes",
  "numbers": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

Status: 'available' → 'reserved'
Tempo: 24h de validade
```

### **2. Ver Cotas Reservadas (Carrinho)**
```bash
GET /api/tickets/user/campaign/:campaignId/reserved
Retorna: cotas 'reserved' do usuário
Inclui: tempo de expiração
```

### **3. Confirmar Pagamento**
```bash
POST /api/tickets/confirm-purchase
{
  "campaignId": "uuid-mercedes",
  "paymentId": "pay_xyz123",
  "paymentMethod": "credit_card"
}

Status: 'reserved' → 'sold'
Cria: transaction (histórico)
```

### **4. Cancelar Reserva (Sair do Carrinho)**
```bash
POST /api/tickets/cancel-reservation
{
  "campaignId": "uuid-mercedes"
}

Status: 'reserved' → 'available'
Deleta: reserva do carrinho
```

### **5. Ver Cotas Compradas (Permanentes)**
```bash
GET /api/tickets/user/campaign/:campaignId/purchased
Retorna: cotas 'sold' do usuário
Mostra: data de compra
```

### **6. Status da Campanha**
```bash
GET /api/tickets/campaign/:campaignId/status
{
  "available_count": 49990,
  "reserved_count": 10,
  "sold_count": 0,
  "percentage_sold": 0.0
}
```

---

## 🛡️ Proteções Implementadas

| Cenário | Proteção | Como |
|---------|----------|------|
| Outro usuário tenta comprar cota já reservada | ❌ Erro 400 | Verifica `status = 'available'` |
| JOAO tenta pagar sem reservar | ❌ Erro 404 | Busca `cart_reservations` ativo |
| JOAO tenta pagar com reserva expirada | ❌ Erro 400 | Compara `expires_at` com NOW |
| Alguém tenta comprar cota que outro vendeu | ❌ Impossível | Transação atômica (ACID) |
| JOAO não paga em 24h | ✅ Libera automática | `release_expired_reservations()` |
| Dois usuários compram ao mesmo tempo | ✅ Um falha | PostgreSQL impede conflitos |

---

## 📊 Fluxo Visual Completo

```
                    JOAO123
                       │
                       ↓
          ┌────────────────────────────┐
          │  Clica "Comprar 10 cotas"  │
          └────────────────┬───────────┘
                           ↓
          ┌────────────────────────────┐
          │  POST /tickets/reserve     │
          │  numbers: [1..10]          │
          └────────────┬───────────────┘
                       ↓
        ┌──────────────────────────────┐
        │  Verifica: disponíveis? ✅   │
        │  UPDATE: status='reserved'   │
        │  INSERT: cart_reservations   │
        └────────────┬─────────────────┘
                     ↓
        ┌──────────────────────────┐
        │  ✅ Cotas Reservadas!    │
        │  (24h válida)            │
        └────────┬──────────────────┘
                 │
    ┌────────────┴─────────────┐
    ↓                          ↓
┌──────────┐           ┌────────────┐
│  PAGA ✅ │           │ NÃO PAGA ❌│
└────┬─────┘           └──────┬─────┘
     ↓                        ↓
  POST                    POST
  /confirm-purchase       /cancel-reservation
     ↓                        ↓
┌─────────────┐        ┌──────────────┐
│status:sold  │        │status:avail  │
│bought_by:ok │        │reserved:null │
│transaction  │        │sem transação │
└──────┬──────┘        └──────┬───────┘
       ↓                       ↓
   ✅ JOAO                ✅ OUTRO
   TEM 10               PODE COMPRAR
   COTAS!

OU (após 24h sem pagar)
       │
       ↓
release_expired_reservations()
       ↓
status: reserved → available
       ↓
✅ OUTRO PODE COMPRAR
```

---

## 🔄 Exemplo de Transações SQL

### **Reserva de Cotas**
```sql
BEGIN;
  -- 1. Liberar reservas expiradas deste usuário
  UPDATE tickets SET status = 'available' ...;
  
  -- 2. Verificar disponibilidade
  SELECT COUNT(*) FROM tickets WHERE status = 'available' ...;
  
  -- 3. Reservar
  UPDATE tickets SET status = 'reserved', reserved_by = $1 ...;
  
  -- 4. Registrar no carrinho
  INSERT INTO cart_reservations ...;
COMMIT;
```

### **Confirmar Compra**
```sql
BEGIN;
  -- 1. Verificar reserva
  SELECT * FROM cart_reservations WHERE status = 'active' ...;
  
  -- 2. Verificar ainda reservadas
  SELECT COUNT(*) FROM tickets WHERE status = 'reserved' ...;
  
  -- 3. Converter para sold
  UPDATE tickets SET status = 'sold', bought_by = $1 ...;
  
  -- 4. Criar transaction
  INSERT INTO transactions ...;
  
  -- 5. Marcar reserva completa
  UPDATE cart_reservations SET status = 'completed' ...;
COMMIT;
```

---

## 🎯 Resultado Final

```
📊 STATUS DA CAMPANHA MERCEDES:
├─ Total: 50.000 cotas
├─ Disponíveis: 49.990
├─ Reservadas: 10 (JOAO123 - 24h de prazo)
├─ Vendidas: 0
└─ Ganhador: -

👤 JOAO123:
├─ Cotas compradas: 0 (ainda em reserva)
├─ Cotas reservadas: 10 (#1-#10)
├─ Reserva expira em: 24h
└─ Status: Aguardando pagamento
```

---

## ✨ Diferenciais

1. **🔒 Seguro**: Cotas nunca vendem duas vezes
2. **⏱️ Justo**: Reserva por 24h (tempo para pagar)
3. **♻️ Automático**: Libera cotas expiradas automaticamente
4. **📊 Rastreável**: Histórico completo de transações
5. **⚡ Rápido**: Índices otimizados para 50.000 cotas
6. **🛡️ Atômico**: Tudo ou nada (ACID)
