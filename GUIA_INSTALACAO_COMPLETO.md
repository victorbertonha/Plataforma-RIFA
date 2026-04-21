# 🚀 GUIA DE INSTALAÇÃO - Solução Completa de Rifas

## 📋 Pré-requisitos

✅ Projeto já com Supabase configurado  
✅ Backend Node.js rodando  
✅ Frontend React pronto  
✅ Banco de dados PostgreSQL no Supabase  

---

## 🔧 PASSO 1: Criar as Tabelas no Supabase

### 1.1 Acessar Supabase SQL Editor

```
1. Abra https://supabase.com
2. Faça login em sua conta
3. Selecione seu projeto
4. Clique em "SQL Editor" (lado esquerdo)
5. Clique em "New query"
```

### 1.2 Copiar o Script SQL

**Arquivo**: `scripts/SUPABASE_SETUP_V2_COMPLETE.sql`

Copie TODO o conteúdo do arquivo.

### 1.3 Executar o Script

```
1. Cole o conteúdo no SQL Editor
2. Clique no botão "Run" (ou Ctrl+Enter)
3. Aguarde a execução (levará alguns segundos)
4. Você verá: "Success. No rows returned."
```

### 1.4 Verificar se foi Criado

No mesmo SQL Editor, execute estas queries uma a uma:

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Resultado esperado:
-- campaigns
-- cart_reservations
-- tickets
-- transactions
-- winners
-- (e outras)
```

✅ Se vir todas as tabelas, está tudo pronto!

---

## 💻 PASSO 2: Atualizar Backend

### 2.1 Arquivos Atualizados

Os seguintes arquivos já foram atualizados:

- ✅ `backend/src/routes/tickets.js` - Novos endpoints
- ✅ `src/services/api.ts` - Novos métodos API
- ✅ `src/context/CartContext.tsx` - Integração com backend

### 2.2 Testar o Backend

Abra um terminal na pasta do backend:

```bash
cd backend
npm start
```

Você verá:
```
Server running on port 5000
```

---

## 🧪 PASSO 3: Testar os Endpoints

### 3.1 Usando Postman ou cURL

#### **A. Obter Cotas Disponíveis**

```bash
curl http://localhost:5000/api/tickets/campaign/UUID_CAMPAIGN/available
```

**Resposta esperada**:
```json
{
  "available": [1, 2, 3, 4, 5, ...],
  "count": 50000,
  "totalAvailable": 50000
}
```

#### **B. Reservar Cotas (Carrinho)**

```bash
curl -X POST http://localhost:5000/api/tickets/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "campaignId": "UUID_CAMPAIGN",
    "numbers": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }'
```

**Resposta esperada**:
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

#### **C. Ver Cotas Reservadas**

```bash
curl http://localhost:5000/api/tickets/user/reserved/UUID_CAMPAIGN \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada**:
```json
{
  "campaignId": "uuid-mercedes",
  "reservedTickets": [
    {"id": "uuid-1", "number": 1, "status": "reserved", "is_active": true},
    {"id": "uuid-2", "number": 2, "status": "reserved", "is_active": true},
    ...
  ],
  "count": 10,
  "expiresAt": "2026-01-24T10:30:00Z"
}
```

#### **D. Confirmar Compra (Pagamento)**

```bash
curl -X POST http://localhost:5000/api/tickets/confirm-purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "campaignId": "UUID_CAMPAIGN",
    "paymentId": "pay_12345",
    "paymentMethod": "credit_card"
  }'
```

**Resposta esperada**:
```json
{
  "success": true,
  "transaction": {
    "id": "uuid-trans-001",
    "user_id": "uuid-joao",
    "campaign_id": "uuid-mercedes",
    "ticket_ids": ["uuid-1", "uuid-2", ...],
    "ticket_numbers": [1, 2, 3, ..., 10],
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

#### **E. Ver Cotas Compradas**

```bash
curl http://localhost:5000/api/tickets/user/purchased/UUID_CAMPAIGN \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada**:
```json
{
  "campaignId": "uuid-mercedes",
  "purchasedTickets": [
    {"id": "uuid-1", "number": 1, "status": "sold", "bought_at": "2026-01-23T10:30:15Z"},
    {"id": "uuid-2", "number": 2, "status": "sold", "bought_at": "2026-01-23T10:30:15Z"},
    ...
  ],
  "count": 10
}
```

#### **F. Cancelar Reserva**

```bash
curl -X POST http://localhost:5000/api/tickets/cancel-reservation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "campaignId": "UUID_CAMPAIGN"
  }'
```

**Resposta esperada**:
```json
{
  "success": true,
  "count": 10,
  "message": "10 cotas liberadas. Voltaram para disponíveis."
}
```

#### **G. Status da Campanha**

```bash
curl http://localhost:5000/api/tickets/campaign/UUID_CAMPAIGN/status
```

**Resposta esperada**:
```json
{
  "id": "uuid-mercedes",
  "name": "Mercedes",
  "total_numbers": 50000,
  "available_count": 49990,
  "reserved_count": 10,
  "sold_count": 0,
  "winner_count": 0,
  "percentage_sold": 0.00,
  "percentage_reserved": 0.02
}
```

---

## 🎨 PASSO 4: Integrar no Frontend

### 4.1 Adicionar uma Campanha para Testes

No Supabase, vá para `campaigns` e insira uma linha:

```
name: "Mercedes 2026"
description: "Rifa de uma Mercedes Benz 2026"
total_numbers: 50000
price_per_number: 10.00
category: "Carros"
status: "active"
```

Copie o UUID gerado.

### 4.2 Criar Tickets Iniciais

Execute no SQL Editor do Supabase:

```sql
-- ATENÇÃO: Isso vai inserir 50.000 linhas. Pode demorar alguns minutos!
INSERT INTO tickets (campaign_id, number, status)
SELECT 
  'UUID_CAMPAIGN', -- Substitua pelo UUID copiado acima
  generate_series(1, 50000),
  'available'
ON CONFLICT DO NOTHING;
```

⏳ **Aviso**: Essa query pode levar **5-10 minutos** para 50.000 registros. Não feche o navegador!

### 4.3 Testar no Frontend

Abra o site:

```
http://localhost:5173
```

**Fluxo de Teste**:

```
1. ✅ Abra a página da campanha
2. ✅ Clique "Comprar 10 cotas"
3. ✅ Vá para o Carrinho
4. ✅ Veja as 10 cotas reservadas
5. ✅ Clique "Confirmar Pagamento"
   (simule o pagamento com ID: "pay_test_123")
6. ✅ Veja mensagem "✅ Compra realizada!"
7. ✅ Vá para "Minhas Compras" e veja suas cotas
```

---

## 🔐 PASSO 5: Variáveis de Ambiente

Certifique-se de ter estas variáveis no `.env` do backend:

```bash
# Backend .env
DB_HOST=seu-projeto.db.supabaseapi.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha_supabase
DB_SSL=true

API_PORT=5000
NODE_ENV=development
```

E no `.env` do frontend:

```bash
# Frontend .env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://seu-projeto.supabaseapi.com
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

---

## 📊 PASSO 6: Verificar Dados no Banco

### 6.1 Ver Campanhas

```sql
SELECT id, name, total_numbers, price_per_number FROM campaigns;
```

### 6.2 Ver Status de Cotas

```sql
SELECT 
  campaign_id,
  status,
  COUNT(*) as count
FROM tickets
GROUP BY campaign_id, status;
```

**Esperado**:
```
campaign_id        | status    | count
uuid-mercedes      | available | 49990
uuid-mercedes      | reserved  | 10
uuid-mercedes      | sold      | 0
```

### 6.3 Ver Transações

```sql
SELECT id, user_id, ticket_numbers, total, status, created_at 
FROM transactions 
ORDER BY created_at DESC;
```

### 6.4 Ver Reservas do Carrinho

```sql
SELECT user_id, campaign_id, ticket_numbers, expires_at, status 
FROM cart_reservations 
WHERE status = 'active';
```

---

## ⏰ PASSO 7: Liberar Reservas Expiradas (Automático)

### 7.1 Como Funciona

A função `release_expired_reservations()` é chamada:
- ✅ Toda vez que alguém pede cotas disponíveis
- ✅ Você pode criar um cron job para executar a cada hora

### 7.2 Executar Manualmente

Se quiser testar agora:

```sql
SELECT release_expired_reservations();
```

### 7.3 Criar Cron Job (Opcional)

Para executar automaticamente a cada hora, use o serviço de crons do Supabase:

```sql
SELECT cron.schedule(
  'release-expired-reservations',
  '0 * * * *',  -- A cada hora
  'SELECT release_expired_reservations()'
);
```

---

## 🐛 Troubleshooting

### Problema: "Tabelas não foram criadas"

**Solução**:
1. Verifique se o script SQL foi executado completamente
2. Procure por erros na aba "Logs" do SQL Editor
3. Execute novamente uma parte de cada vez

### Problema: "Erro ao inserir 50.000 cotas"

**Solução**:
1. A query é lenta, aguarde pacientemente
2. Se deu timeout, execute em lotes:
```sql
INSERT INTO tickets (campaign_id, number, status)
SELECT 'UUID', generate_series(1, 10000), 'available';

INSERT INTO tickets (campaign_id, number, status)
SELECT 'UUID', generate_series(10001, 20000), 'available';
-- ... etc
```

### Problema: "Erro 401 Unauthorized"

**Solução**:
1. JWT token expirado
2. Faça login novamente no frontend
3. Verifique se o token está sendo enviado no header

### Problema: "Cotas não aparecem no carrinho"

**Solução**:
1. Verifique se `syncWithBackend()` foi chamado
2. Confirme se a resposta do POST `/reserve` tem sucesso
3. Veja console do navegador para erros

---

## ✅ Checklist Final

- [ ] Script SQL executado no Supabase
- [ ] Todas as 5 tabelas criadas
- [ ] Índices e views funcionando
- [ ] Backend rodando sem erros
- [ ] Frontend conectado à API
- [ ] Uma campanha criada com 50.000 tickets
- [ ] Endpoints testados com Postman/cURL
- [ ] Fluxo completo testado (reserva → pagamento → compra)
- [ ] Dados visíveis no Supabase
- [ ] CartContext integrando com backend

---

## 🎉 Pronto!

Sua solução está completa e funcionando. Você tem:

✅ **Estados de Cotas**: available → reserved → sold  
✅ **Carrinho com Reserva**: 24h de validade  
✅ **Pagamento Confirmado**: Cotas são do usuário permanently  
✅ **Liberação Automática**: Após 24h sem pagamento  
✅ **Segurança ACID**: Transações atômicas  
✅ **Performance**: Índices para 50.000+ cotas  
✅ **Rastreamento**: Histórico completo de transações  

---

## 📞 Dúvidas Frequentes

**P: Posso escolher números específicos?**  
R: Sim! Modifique o `CartContext` para let user choose.

**P: Como integrar com Stripe/PIX?**  
R: Altere o `confirmPurchase` para validar com a API do pagamento antes de chamar o backend.

**P: Posso estender para 1.000.000 de cotas?**  
R: Sim, os índices e queries são otimizadas para qualquer volume.

**P: Como fazer sorteio do ganhador?**  
R: Crie um endpoint que escolha randomicamente uma cota com `status = 'sold'` e atualize para `status = 'winner'`.

---

**Implementação concluída em**: 23 de janeiro de 2026  
**Última atualização**: Versão 2.0 com Reservas e Pagamentos
