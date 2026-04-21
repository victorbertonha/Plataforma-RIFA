# Backend - RIFA Platform

Sistema backend para a plataforma de rifas online.

## Pré-requisitos

- Node.js 16+
- PostgreSQL 12+
- npm ou yarn

## Instalação

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar banco de dados

#### No Windows (PowerShell):

```powershell
# Instalar PostgreSQL se necessário
# Depois, criar o banco de dados:

psql -U postgres
# Digite sua senha do PostgreSQL

# No console psql:
CREATE DATABASE rifa_db;
```

#### No Linux/Mac:

```bash
sudo -u postgres psql

# No console psql:
CREATE DATABASE rifa_db;
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e ajuste conforme necessário:

```bash
cp .env.example .env
```

Edite o `.env`:
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rifa_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:8081
```

### 4. Executar migrations (criar tabelas)

```bash
npm run migrate
```

### 5. Iniciar o servidor

**Modo desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

O servidor estará disponível em `http://localhost:5000`

## Estrutura do Projeto

```
backend/
├── server.js                  # Arquivo principal
├── package.json
├── .env.example              # Exemplo de variáveis de ambiente
├── scripts/
│   └── migrate.js            # Script para criar tabelas no banco
└── src/
    ├── db.js                 # Conexão com PostgreSQL
    ├── auth.js               # Funções de JWT e autenticação
    ├── utils.js              # Funções utilitárias
    └── routes/
        ├── auth.js           # Rotas de login/signup
        ├── campaigns.js      # Rotas de campanhas
        ├── admin.js          # Rotas de administração
        └── tickets.js        # Rotas de compra de tickets
```

## Endpoints da API

### Autenticação
- `POST /api/auth/signup` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter dados do usuário autenticado

### Campanhas
- `GET /api/campaigns` - Listar todas as campanhas
- `GET /api/campaigns/:id` - Obter detalhes de uma campanha
- `POST /api/campaigns` - Criar nova campanha (admin/root)
- `PUT /api/campaigns/:id` - Atualizar campanha (admin/root)
- `DELETE /api/campaigns/:id` - Deletar campanha (admin/root)

### Tickets
- `GET /api/tickets/campaign/:campaignId/available` - Obter números disponíveis
- `POST /api/tickets/buy` - Comprar tickets
- `GET /api/tickets/user/campaign/:campaignId` - Obter tickets do usuário

### Admin
- `GET /api/admin/dashboard/metrics` - Obter métricas (admin/root)
- `GET /api/admin/users` - Listar usuários (admin/root)
- `PUT /api/admin/users/:id/role` - Alterar role (apenas root)
- `PUT /api/admin/users/:id/status` - Ativar/desativar usuário (admin/root)
- `GET /api/admin/audit-logs` - Ver logs de auditoria (admin/root)
- `GET /api/admin/reports/revenue` - Relatório de receita (admin/root)

## Autenticação

Todos os endpoints protegidos requerem um token JWT no header:

```bash
Authorization: Bearer seu_token_aqui
```

### Roles disponíveis:
- **root**: Acesso total ao sistema
- **admin**: Pode gerenciar campanhas e usuários
- **user**: Usuário comum (pode comprar tickets)

## Criando o primeiro usuário Root

Registre um usuário normal via signup, depois use um cliente SQL para alterar seu role:

```sql
UPDATE users SET role = 'root' WHERE email = 'seu_email@example.com';
```

Ou você pode criar um script de seed (solicitar implementação).

## Próximos Passos

- [ ] Integrar frontend com as rotas da API
- [ ] Implementar sorteio automático de vencedores
- [ ] Adicionar notificações por email
- [ ] Implementar pagamentos reais (Stripe/PayPal)
- [ ] Melhorar validações e tratamento de erros
- [ ] Adicionar testes automatizados
- [ ] Deploy em produção (Heroku, AWS, DigitalOcean, etc)

## Troubleshooting

### Erro: "connect ECONNREFUSED 127.0.0.1:5432"
O PostgreSQL não está rodando. Inicie o serviço:
- **Windows**: Services → PostgreSQL → Start
- **Linux**: `sudo systemctl start postgresql`
- **Mac**: `brew services start postgresql`

### Erro: "database "rifa_db" does not exist"
Execute novamente o comando de criar banco de dados via psql

### Token inválido ou expirado
Faça login novamente para obter um novo token

## Contato & Suporte

Dúvidas? Abra uma issue ou entre em contato!
