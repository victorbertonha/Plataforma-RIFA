# ⚡ Quick Commands - RIFA

## 🚀 Iniciar o Projeto

### Primeira vez (Setup)
```bash
# 1. Criar banco PostgreSQL
psql -U postgres
CREATE DATABASE rifa_db;
\q

# 2. Backend setup
cd backend
npm install
npm run migrate
npm run dev

# 3. Frontend (novo terminal)
cd ..
npm install
npm run dev
```

### Próximas vezes (Rápido)
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
npm run dev
```

---

## 🧪 Testar a API

### Criar usuário (Signup)
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11987654321",
    "cpf": "12345678901",
    "password": "senha123",
    "confirmPassword": "senha123"
  }'
```

### Fazer login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
# Copia o token da resposta
```

### Ver dados do usuário (com token)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Listar campanhas (sem autenticação)
```bash
curl http://localhost:5000/api/campaigns
```

### Ver health check
```bash
curl http://localhost:5000/api/health
```

---

## 🗄️ Banco de Dados

### Conectar ao PostgreSQL
```bash
psql -U postgres -d rifa_db
```

### Queries úteis
```sql
-- Ver todos os usuários
SELECT email, role, created_at FROM users;

-- Dar permissão de admin
UPDATE users SET role = 'admin' WHERE email = 'seu_email@example.com';

-- Dar permissão de root
UPDATE users SET role = 'root' WHERE email = 'seu_email@example.com';

-- Ver campanhas
SELECT id, title, status, opens_at, closes_at FROM campaigns;

-- Ver tickets vendidos
SELECT COUNT(*) as vendidos FROM tickets WHERE status = 'sold';

-- Ver transações
SELECT user_id, campaign_id, total, created_at FROM transactions;

-- Ver logs de auditoria
SELECT user_id, action, entity_type, created_at FROM audit_logs LIMIT 20;
```

---

## 📁 Estrutura de Pastas (Navegação Rápida)

```
c:\Projeto-RIFA\
├── backend/              ← API Node.js
├── src/
│   ├── pages/           ← Páginas React
│   ├── components/      ← Componentes React
│   ├── services/        ← Cliente HTTP
│   ├── context/         ← Context API
│   └── ...
├── SETUP.md             ← Ler primeiro!
├── ARCHITECTURE.md      ← Diagramas
├── README_FINAL.md      ← Status final
└── ...
```

---

## 🔧 Erros Comuns e Soluções

### "ECONNREFUSED 127.0.0.1:5432"
PostgreSQL não está rodando
```bash
# Windows
# Services → PostgreSQL → Start

# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql
```

### "database rifa_db does not exist"
```bash
psql -U postgres
CREATE DATABASE rifa_db;
\q
```

### "EADDRINUSE :::5000"
Porta 5000 já em uso
```bash
# Mude a porta no backend .env:
PORT=5001

# E no frontend .env:
VITE_API_URL=http://localhost:5001/api
```

### "Token inválido"
Token JWT expirou ou localStorage corrompido
```javascript
// No DevTools console:
localStorage.clear()
// Recarregue e faça login novamente
```

---

## 📋 Checklist Diário

- [ ] Backend rodando em http://localhost:5000
- [ ] Frontend rodando em http://localhost:8081
- [ ] PostgreSQL está ativo
- [ ] Consigo fazer login
- [ ] Consigo ver campanhas
- [ ] Tokens aparecem no localStorage

---

## 🎯 URLs Importantes

| URL | Descrição |
|-----|-----------|
| http://localhost:8081 | Site principal |
| http://localhost:5000/api | Base da API |
| http://localhost:5000/api/health | Health check |
| http://localhost:8081/cadastro | Signup |
| http://localhost:8081/login | Login |
| http://localhost:8081/carrinho | Carrinho |
| http://localhost:8081/minha-conta | Meu perfil |
| http://localhost:8081/meus-pedidos | Meus pedidos |

---

## 💡 Dicas Rápidas

### Resetar tudo
```bash
# Excluir e recria o banco
psql -U postgres
DROP DATABASE rifa_db;
CREATE DATABASE rifa_db;
\q

cd backend
npm run migrate
```

### Ver logs do servidor
Os logs aparecem no terminal onde você rodou `npm run dev`
Procure por erros em vermelho

### Debug no navegador
1. Abra DevTools (F12)
2. Aba "Application" → "Local Storage"
3. Veja o token JWT armazenado
4. Console para erros

### Postman para testar API
1. Crie uma coleção chamada "RIFA"
2. Adicione requests para cada endpoint
3. Use {{token}} em headers Authorization

---

## 📱 Status do Projeto

| Feature | Status | Ação |
|---------|--------|------|
| Autenticação | ✅ | Pronto |
| CRUD Campanhas | ✅ | Pronto |
| Compra Tickets | ✅ | Pronto |
| Admin Dashboard | ⏳ | Criar UI |
| Sorteio Auto | ⏳ | Criar job |
| Pagamentos | ⏳ | Integrar |
| Email | ⏳ | Configurar |

---

## 🎓 Documentação

Leia esses arquivos em ordem:
1. **SETUP.md** - Como instalar
2. **ARCHITECTURE.md** - Como funciona
3. **backend/README.md** - Endpoints da API
4. **README_FINAL.md** - Próximos passos

---

**Dúvida? Verifique a documentação! 📖**
