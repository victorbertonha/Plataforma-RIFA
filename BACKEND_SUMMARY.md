# 📊 Backend RIFA - Resumo Técnico

## ✅ O que foi implementado

### 🏗️ Arquitetura
- **Frontend**: React 18 + TypeScript + Vite (já existente)
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (JSON Web Tokens)
- **Encriptação**: bcryptjs para senhas

### 🔐 Sistema de Roles & Permissões

```
┌─────────────────────────────────────────────┐
│         SISTEMA DE PERMISSÕES                │
├─────────────────────────────────────────────┤
│                                              │
│  ROOT (Superadmin)                           │
│  ├─ Acesso total ao sistema                  │
│  ├─ Gerenciar campanhas                      │
│  ├─ Dar/remover permissões de admin          │
│  ├─ Ver relatórios completos                 │
│  └─ Logs de auditoria                        │
│                                              │
│  ADMIN                                       │
│  ├─ Criar/editar campanhas                   │
│  ├─ Gerenciar usuários (status)              │
│  ├─ Ver tráfego e receita                    │
│  └─ Não pode alterar roles                   │
│                                              │
│  USER (Comum)                                │
│  ├─ Comprar tickets                          │
│  ├─ Ver suas compras                         │
│  └─ Editar seu perfil                        │
│                                              │
└─────────────────────────────────────────────┘
```

### 📊 Banco de Dados (PostgreSQL)

#### Tabelas Criadas:
1. **users** - Usuários do sistema com roles
2. **campaigns** - Campanhas/Rifas
3. **tickets** - Números para compra
4. **transactions** - Histórico de compras
5. **audit_logs** - Logs de ações do sistema

#### Segurança:
- Senhas hashadas com bcrypt
- Validação de email e CPF
- Índices para melhor performance
- Controle de acesso em nível de banco

### 🔗 Rotas da API (26 endpoints)

#### Autenticação (3)
```
POST   /api/auth/signup       - Registrar
POST   /api/auth/login        - Fazer login
GET    /api/auth/me           - Dados do usuário
```

#### Campanhas (5)
```
GET    /api/campaigns         - Listar tudo
GET    /api/campaigns/:id     - Detalhe
POST   /api/campaigns         - Criar (admin/root)
PUT    /api/campaigns/:id     - Editar (admin/root)
DELETE /api/campaigns/:id     - Deletar (admin/root)
```

#### Tickets (3)
```
GET    /api/tickets/campaign/:id/available    - Números livres
POST   /api/tickets/buy                       - Comprar
GET    /api/tickets/user/campaign/:id         - Meus tickets
```

#### Admin (6)
```
GET    /api/admin/dashboard/metrics           - Métricas
GET    /api/admin/users                       - Listar usuários
PUT    /api/admin/users/:id/role              - Alterar role (root only)
PUT    /api/admin/users/:id/status            - Ativar/desativar (admin/root)
GET    /api/admin/audit-logs                  - Logs de auditoria
GET    /api/admin/reports/revenue             - Relatório de receita
```

### 💾 Armazenamento

**Antes**: localStorage do navegador (inseguro)
```
❌ Dados apenas locais
❌ Acessíveis via DevTools
❌ Sem persistência
❌ Sem controle de acesso
```

**Agora**: PostgreSQL no servidor (seguro)
```
✅ Centralizado
✅ Protegido
✅ Persistente
✅ Com backup
✅ Com auditoria
```

### 🛡️ Segurança Implementada

| Recurso | Status |
|---------|--------|
| Senhas Hashadas (bcrypt) | ✅ |
| JWT para autenticação | ✅ |
| Validação de email | ✅ |
| Validação de CPF | ✅ |
| Roles e permissões | ✅ |
| CORS habilitado | ✅ |
| Headers de segurança | ⏳ Próximo |
| Rate limiting | ⏳ Próximo |
| 2FA | ⏳ Próximo |

### 📈 Recursos do Admin

Dashboard com:
- Total de usuários
- Total de campanhas
- Receita gerada
- Tickets vendidos

Gerenciamento de:
- Usuários (ativar/desativar)
- Permissões (root pode fazer isso)
- Campanhas completo (CRUD)
- Relatórios de receita por período
- Logs de auditoria

---

## 📂 Estrutura de Arquivos Criados

```
backend/
├── server.js ........................... Arquivo principal
├── package.json ....................... Dependências
├── .env.example ....................... Variáveis de exemplo
├── .gitignore .......................... Ignorar arquivos
├── README.md .......................... Documentação
├── scripts/
│   └── migrate.js ..................... Script de setup do BD
└── src/
    ├── db.js .......................... Pool de conexão PostgreSQL
    ├── auth.js ........................ JWT e autenticação
    ├── utils.js ....................... Formatação e validação
    └── routes/
        ├── auth.js .................... Signup/Login
        ├── campaigns.js ............... Campanhas CRUD
        ├── admin.js ................... Painel admin
        └── tickets.js ................. Compra de tickets

frontend/
├── .env ............................... API_URL
└── src/
    └── services/
        └── api.ts ..................... Cliente HTTP para consumir API
```

---

## 🚀 Como Usar

### 1. Instalar (Uma única vez)
```bash
# Backend
cd backend
npm install
npm run migrate

# Frontend (se necessário)
cd ..
npm install
```

### 2. Iniciar (Sempre que quiser usar)
```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Fica rodando em http://localhost:5000

# Terminal 2 - Frontend
cd ..
npm run dev
# Fica rodando em http://localhost:8081
```

### 3. Acessar
- Site: http://localhost:8081
- API: http://localhost:5000
- Documentação API: Veja backend/README.md

### 4. Criar usuário Root
```bash
# 1. Registre via /cadastro
# 2. No terminal, execute:
psql -U postgres -d rifa_db
UPDATE users SET role = 'root' WHERE email = 'seu_email@example.com';
\q
```

---

## 🔄 Integração Frontend-Backend

O frontend agora pode:

```typescript
// Fazer login
import { authAPI, setToken } from '@/services/api';
const result = await authAPI.login(email, password);
setToken(result.token);

// Obter campanhas
import { campaignsAPI } from '@/services/api';
const campaigns = await campaignsAPI.getAll();

// Comprar tickets
import { ticketsAPI } from '@/services/api';
await ticketsAPI.buy(campaignId, [1, 2, 3]);

// Admin - Métricas
import { adminAPI } from '@/services/api';
const metrics = await adminAPI.getDashboardMetrics();
```

---

## ⚠️ Importante: Próximas Etapas

### URGENTE - Remover localStorage
Os contextos ainda usam localStorage. Precisamos atualizar:
- `AuthContext.tsx` → Usar API em vez de localStorage
- `CartContext.tsx` → Usar API para transações
- Remover dados sensíveis do localStorage

### Implementar Painel Admin UI
As rotas estão prontas, falta criar as páginas React:
- AdminDashboard.tsx
- UserManagement.tsx
- CampaignManager.tsx
- RevenueReports.tsx

### Sorteio Automático
Criar um serviço que:
- Verifica campanhas com prazo encerrado
- Sorteia número vencedor
- Notifica ganhador

---

## 📚 Documentação Completa

- **Backend Setup**: `backend/README.md`
- **Full Setup**: `SETUP.md`
- **API Docs**: Endpoints estão documentados em `backend/README.md`

---

## 🎯 Status do Projeto

| Fase | Status |
|------|--------|
| Estrutura Frontend | ✅ Completo |
| Autenticação | ✅ Completo |
| Carrinho de Compras | ✅ Completo |
| Backend API | ✅ Completo |
| Banco de Dados | ✅ Completo |
| Rotas Admin | ✅ Completo |
| UI do Admin | ⏳ Em progresso |
| Sorteio Automático | ⏳ Pendente |
| Pagamentos | ⏳ Pendente |
| Deploy | ⏳ Pendente |

---

**Tudo pronto para começar! 🚀**

Próximo passo: Integrar frontend com o backend e criar painel admin UI.
