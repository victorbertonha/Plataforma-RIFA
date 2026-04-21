# ⚡ QUICK START - 5 MINUTOS

## 🚀 Para Implementar AGORA

### PASSO 1️⃣: SQL Supabase (2 min)

1. Abra **Supabase** → seu projeto
2. Clique **SQL Editor** → **New Query**
3. Copie TUDO de: **`scripts/SUPABASE_SETUP_V2_COMPLETE.sql`**
4. Cole no editor
5. Click **Run** (play)
6. ✅ Pronto!

```
⏱️ Tempo: 30 segundos
Status: Done. 0 rows affected.
```

---

### PASSO 2️⃣: Backend (1 min)

1. Substitua: **`backend/src/routes/tickets.js`**
2. Com novo arquivo (já pronto)
3. Terminal: `cd backend && npm start`
4. ✅ Ver: `Server running on port 5000`

```bash
npm start
# Output:
# Server running on port 5000
# ✅ Pronto para requisições
```

---

### PASSO 3️⃣: Frontend (1 min)

1. Substitua: **`src/services/api.ts`**
2. Substitua: **`src/context/CartContext.tsx`**
3. Terminal: `npm run dev`
4. ✅ Abra: `http://localhost:5173`

```bash
npm run dev
# ✅ Ready in 1234ms
```

---

### PASSO 4️⃣: Testar (1 min)

1. **Crie uma campanha** no Supabase
   ```sql
   INSERT INTO campaigns 
   (name, total_numbers, price_per_number) 
   VALUES ('Mercedes', 50000, 10.00);
   ```

2. **Copie o UUID** gerado

3. **Crie 50.000 cotas** (demora 5-10 min):
   ```sql
   INSERT INTO tickets (campaign_id, number, status)
   SELECT 'UUID_AQUI', generate_series(1, 50000), 'available';
   ```

4. **Teste no site**:
   - Clique "Comprar 10 cotas"
   - Vá ao carrinho
   - Veja as cotas reservadas
   - Clique "Confirmar Pagamento"
   - ✅ Pronto! Cotas compradas

---

## 📋 Checklist Rápido

```
✅ SQL executado
✅ Backend rodando
✅ Frontend rodando
✅ Campanha criada
✅ 50.000 cotas inseridas
✅ Fluxo funcionando
```

---

## 🎯 Estados das Cotas

```
🟢 available  = Pode comprar
🟡 reserved   = No carrinho (24h)
🔴 sold       = Comprado!
```

---

## 🔗 URLs Principais

```
Frontend:     http://localhost:5173
Backend:      http://localhost:5000
Supabase:     https://supabase.com
API Base:     http://localhost:5000/api
```

---

## 📱 Endpoints Principais

```bash
# Ver cotas disponíveis
GET /api/tickets/campaign/{campaignId}/available

# Reservar (adicionar ao carrinho)
POST /api/tickets/reserve
{ "campaignId": "...", "numbers": [1,2,3,4,5] }

# Confirmar pagamento (finalizar compra)
POST /api/tickets/confirm-purchase
{ "campaignId": "...", "paymentId": "pay_123", "paymentMethod": "card" }

# Ver minhas cotas compradas
GET /api/tickets/user/purchased/{campaignId}

# Ver minhas cotas reservadas
GET /api/tickets/user/reserved/{campaignId}

# Ver status da campanha
GET /api/tickets/campaign/{campaignId}/status
```

---

## 💡 Dicas

1. **Erro "cotas não disponíveis"?**
   - Alguém comprou enquanto você tentava
   - Tente novamente com outros números

2. **Reserva expirou?**
   - Ficou 24h sem confirmar pagamento
   - Adicione novamente ao carrinho

3. **50.000 cotas demorando?**
   - Normal, aguarde 5-10 minutos
   - Não feche o Supabase

4. **Quer testar com menos cotas?**
   - Substitua `50000` por `100` no INSERT
   - Mais rápido para testes

---

## 📚 Documentação Completa

1. **Entender o fluxo?** → `FLUXO_RESERVA_PAGAMENTO.md`
2. **Guia detalhado?** → `GUIA_INSTALACAO_COMPLETO.md`
3. **Resumo executivo?** → `RESUMO_IMPLEMENTACAO.md`
4. **Exemplo prático?** → `FLUXO_COMPRA_COTAS.md`
5. **Resumo da entrega?** → `ENTREGA_FINAL.md`

---

## ✨ Pronto!

Você tem uma solução profissional de rifas funcionando em **5 minutos**!

**Próximos passos** (opcional):
- Integrar Stripe/PIX para pagamento real
- Enviar email de confirmação
- Criar dashboard admin
- Sistema de sorteio

**Dúvidas?** Consulte os guias acima!

🎉 **Sucesso!**
