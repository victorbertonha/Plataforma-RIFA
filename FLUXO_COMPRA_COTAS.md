# 🎯 Fluxo Prático: Compra de Cotas na Rifa Mercedes

## Cenário Simulado
- **Usuário**: JOAO123
- **Rifa**: Mercedes (50.000 cotas no total)
- **Compra**: 10 cotas
- **Preço por cota**: R$ 10,00 (exemplo)

---

## 📊 Estrutura de Dados no Banco

### 1️⃣ Tabela `campaigns` - Informações da Rifa
```
id: uuid-mercedes-2026
name: "Mercedes"
total_numbers: 50000
price_per_number: 10.00
status: "active"
created_at: 2026-01-01
```

### 2️⃣ Tabela `tickets` - Cotas Individuais (50.000 registros)
```
Antes da compra:
┌─────┬──────────────────┬────────┬──────────┬──────────┬──────────────┐
│ id  │ campaign_id      │ number │ status   │ bought_by│ bought_at    │
├─────┼──────────────────┼────────┼──────────┼──────────┼──────────────┤
│ 001 │ uuid-mercedes    │   001  │available │   NULL   │   NULL       │
│ 002 │ uuid-mercedes    │   002  │available │   NULL   │   NULL       │
│ ... │ uuid-mercedes    │  ...   │available │   NULL   │   NULL       │
│ 010 │ uuid-mercedes    │   010  │available │   NULL   │   NULL       │ ← JOAO quer essas
│ ... │ uuid-mercedes    │  ...   │available │   NULL   │   NULL       │
│50k  │ uuid-mercedes    │  50000 │available │   NULL   │   NULL       │
└─────┴──────────────────┴────────┴──────────┴──────────┴──────────────┘

Depois da compra (números 1-10 por JOAO123):
┌─────┬──────────────────┬────────┬────────┬──────────────────────┬──────────────────┐
│ id  │ campaign_id      │ number │ status │ bought_by            │ bought_at        │
├─────┼──────────────────┼────────┼────────┼──────────────────────┼──────────────────┤
│ 001 │ uuid-mercedes    │   001  │ SOLD   │ uuid-joao123         │ 2026-01-23 10:30 │ ← JOAO
│ 002 │ uuid-mercedes    │   002  │ SOLD   │ uuid-joao123         │ 2026-01-23 10:30 │ ← JOAO
│ 003 │ uuid-mercedes    │   003  │ SOLD   │ uuid-joao123         │ 2026-01-23 10:30 │ ← JOAO
│ ... │ uuid-mercedes    │  ...   │ SOLD   │ uuid-joao123         │ 2026-01-23 10:30 │ ← JOAO (até 010)
│ 011 │ uuid-mercedes    │   011  │available│   NULL               │   NULL           │
│ ... │ uuid-mercedes    │  ...   │available│   NULL               │   NULL           │
└─────┴──────────────────┴────────┴────────┴──────────────────────┴──────────────────┘
```

### 3️⃣ Tabela `transactions` - Registro de Compra
```
id: uuid-trans-001
user_id: uuid-joao123
campaign_id: uuid-mercedes
ticket_ids: [uuid-001, uuid-002, ..., uuid-010]
amount: 100.00 (10 cotas × R$ 10)
tax: 1.00 (1%)
total: 101.00
status: "completed"
created_at: 2026-01-23 10:30
```

---

## 🔄 Fluxo de Compra (Passo a Passo)

### **PASSO 1: Frontend - Usuário seleciona cotas**
```typescript
// Usuario clica para comprar cotas 1-10 da Mercedes
const selectedNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const campaignId = "uuid-mercedes-2026";

// Chamada à API
const response = await ticketsAPI.buy(campaignId, selectedNumbers);
```

### **PASSO 2: Backend - Validação Atômica**
```javascript
// Backend recebe: 
// {
//   campaignId: "uuid-mercedes-2026",
//   numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
//   userId: "uuid-joao123" (vem do JWT token)
// }

// TRANSAÇÃO INICIADA (BEGIN)
// ├─ Verificar: Todos os 10 números estão "available"?
// ├─ Se SIM: Continua
// ├─ Se NÃO: ROLLBACK (erro)
// │
// ├─ Buscar preço por cota: R$ 10,00
// │
// ├─ Calcular:
// │  ├─ amount = 10 × 10 = R$ 100,00
// │  ├─ tax = 100 × 1% = R$ 1,00
// │  └─ total = R$ 101,00
// │
// ├─ UPDATE tickets SET status='sold', bought_by='uuid-joao123'
// │   WHERE campaign_id='uuid-mercedes' AND number IN (1..10)
// │
// ├─ INSERT INTO transactions (...)
// │
// └─ COMMIT (salvar tudo)
```

### **PASSO 3: Frontend - Exibição das Cotas**
```typescript
// Depois da compra bem-sucedida, o frontend chama:
const minhasCotas = await ticketsAPI.getUserTickets("uuid-mercedes-2026");

// Resposta:
// [
//   { number: 1, status: 'sold' },
//   { number: 2, status: 'sold' },
//   { number: 3, status: 'sold' },
//   ...
//   { number: 10, status: 'sold' }
// ]

// Exibir na tela:
console.log("🎟️ Suas cotas compradas:");
minhasCotas.forEach(cota => {
  console.log(`Cota #${cota.number} - Status: ${cota.status}`);
});
```

---

## 🛡️ Proteção contra Condições de Corrida

**Problema**: E se 2 pessoas tentarem comprar a mesma cota 001?

**Solução**: Transações ACID do PostgreSQL
```
Tempo  │ Usuário A           │ Usuário B
─────────────────────────────────────────────
T1     │ BEGIN               │ 
T2     │ Verifica cota 001   │ BEGIN
       │ (status=available)  │ 
T3     │                     │ Verifica cota 001
       │                     │ (status=available) 
T4     │ UPDATE cota 001     │ 
       │ SET status='sold'   │ 
T5     │ COMMIT              │
T6     │ ✅ SUCESSO          │ UPDATE cota 001
       │                     │ (falha! status='sold')
T7     │                     │ ROLLBACK
       │                     │ ❌ ERRO
```

---

## 📱 Endpoints da API

### **1. Listar Cotas Disponíveis**
```bash
GET /api/tickets/campaign/uuid-mercedes-2026/available

Resposta (primeiras 100):
[
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, ... 50000
]

Total: 49.990 cotas ainda disponíveis (50.000 - 10 vendidas)
```

### **2. Comprar Cotas**
```bash
POST /api/tickets/buy
Authorization: Bearer {jwt-joao123}

Body:
{
  "campaignId": "uuid-mercedes-2026",
  "numbers": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

Resposta:
{
  "success": true,
  "transaction": {
    "id": "uuid-trans-001",
    "user_id": "uuid-joao123",
    "campaign_id": "uuid-mercedes-2026",
    "ticket_ids": ["uuid-001", "uuid-002", ..., "uuid-010"],
    "amount": 100.00,
    "tax": 1.00,
    "total": 101.00,
    "status": "completed",
    "created_at": "2026-01-23T10:30:00Z"
  }
}
```

### **3. Ver Minhas Cotas Compradas**
```bash
GET /api/tickets/user/campaign/uuid-mercedes-2026
Authorization: Bearer {jwt-joao123}

Resposta:
[
  { "number": 1, "status": "sold" },
  { "number": 2, "status": "sold" },
  { "number": 3, "status": "sold" },
  { "number": 4, "status": "sold" },
  { "number": 5, "status": "sold" },
  { "number": 6, "status": "sold" },
  { "number": 7, "status": "sold" },
  { "number": 8, "status": "sold" },
  { "number": 9, "status": "sold" },
  { "number": 10, "status": "sold" }
]
```

---

## 🎯 Queries SQL Principais

### **Query 1: Contar Cotas Disponíveis**
```sql
SELECT COUNT(*) as available_count 
FROM tickets 
WHERE campaign_id = 'uuid-mercedes-2026' 
  AND status = 'available';

-- Resultado: 49.990
```

### **Query 2: Contar Cotas Vendidas**
```sql
SELECT COUNT(*) as sold_count 
FROM tickets 
WHERE campaign_id = 'uuid-mercedes-2026' 
  AND status = 'sold';

-- Resultado: 10
```

### **Query 3: Porcentagem Vendida**
```sql
SELECT 
  ROUND(
    (COUNT(CASE WHEN status = 'sold' THEN 1 END) * 100.0 / 50000)::NUMERIC, 
    2
  ) as percentage_sold
FROM tickets 
WHERE campaign_id = 'uuid-mercedes-2026';

-- Resultado: 0.02% (10 de 50.000)
```

### **Query 4: Ganho Total da Rifa**
```sql
SELECT 
  SUM(total) as total_revenue
FROM transactions 
WHERE campaign_id = 'uuid-mercedes-2026' 
  AND status = 'completed';

-- Resultado: R$ 101,00 (1 compra de JOAO)
```

### **Query 5: Cotas do JOAO123**
```sql
SELECT 
  number, 
  status,
  bought_at
FROM tickets 
WHERE campaign_id = 'uuid-mercedes-2026' 
  AND bought_by = 'uuid-joao123'
ORDER BY number;

-- Resultado: 10 linhas (números 1-10)
```

---

## 💾 Estado Final do Banco

```
📊 CAMPAIGNS:
├─ Mercedes (50.000 cotas)
│  ├─ Preço: R$ 10,00/cota
│  └─ Status: active

📋 TICKETS:
├─ Total: 50.000
├─ Disponíveis: 49.990 ✅
└─ Vendidas: 10 (JOAO123)

💳 TRANSACTIONS:
└─ Compra de JOAO123: R$ 101,00 ✅

👤 USUARIOS:
└─ JOAO123
   ├─ Cotas compradas: 10
   ├─ Valor gasto: R$ 101,00
   └─ Cotas: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10
```

---

## 🔐 Validações Automáticas

✅ **O sistema garante automaticamente:**
1. Não pode comprar cota já vendida
2. Não pode comprar cota inexistente
3. Não pode comprar sem ser autenticado
4. Toda compra cria um registro de transação
5. Toda cota vendida tem `bought_by` preenchido
6. `bought_at` registra o momento exato da compra
7. Status muda de `available` → `sold` atomicamente

