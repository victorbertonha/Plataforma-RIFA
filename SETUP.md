# 🎯 Guia Completo - Setup do Projeto RIFA

Siga este guia passo a passo para configurar o projeto completo (frontend + backend + banco de dados).

## 📋 Pré-requisitos

- **Node.js 16+** - [Download](https://nodejs.org/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/)
- **Git** (opcional)
- **Visual Studio Code** (recomendado)

---

## 🗄️ PASSO 1: Configurar PostgreSQL

### Windows:
1. Instale o PostgreSQL do site oficial
2. Abra **pgAdmin** (ferramenta incluída na instalação) ou use **PowerShell**
3. No PowerShell, execute:
```powershell
psql -U postgres
# Digite a senha configurada na instalação
```

4. No console psql, execute:
```sql
CREATE DATABASE rifa_db;
\q  # Para sair
```

### Linux/Mac:
```bash
sudo -u postgres psql
# Digite sua senha

# No console psql:
CREATE DATABASE rifa_db;
\q
```

---

## 🚀 PASSO 2: Configurar Backend

```bash
# Abra um terminal na pasta do projeto
cd c:\Projeto-RIFA\backend

# 1. Instale as dependências
npm install

# 2. Copie o arquivo de exemplo de ambiente
copy .env.example .env

# 3. Edite o .env se necessário (geralmente não precisa se usou postgres/postgres)
# Abra c:\Projeto-RIFA\backend\.env com seu editor

# 4. Crie as tabelas no banco de dados
npm run migrate

# 5. Inicie o servidor
npm run dev
```

✅ O backend deve estar rodando em: **http://localhost:5000**

Deixe este terminal aberto!

---

## 🎨 PASSO 3: Configurar Frontend

```bash
# Abra um NOVO terminal na raiz do projeto
cd c:\Projeto-RIFA

# 1. Instale as dependências (se não tiver feito ainda)
npm install

# 2. Inicie o servidor de desenvolvimento
npm run dev
```

✅ O frontend deve estar rodando em: **http://localhost:8081**

---

## 👤 PASSO 4: Criar Usuário Root (Admin)

1. Acesse: **http://localhost:8081/cadastro**
2. Registre um novo usuário com as informações:
   - Nome: seu nome
   - Email: seu_email@example.com
   - Telefone: (opcional)
   - CPF: (opcional)
   - Senha: senha_segura

3. Agora você precisa transformar esse usuário em **root** no banco de dados

### Via pgAdmin:
1. Abra pgAdmin
2. Conecte ao servidor PostgreSQL
3. Navegue até: **Databases** → **rifa_db** → **Tables** → **users**
4. Clique com botão direito e escolha "Edit Top 100 Rows"
5. Procure pelo seu email e mude a coluna `role` de `user` para `root`

### Via Command Line (Mais rápido):
```bash
# Abra um novo terminal
psql -U postgres -d rifa_db

# No console psql:
UPDATE users SET role = 'root' WHERE email = 'seu_email@example.com';

# Verifique:
SELECT email, role FROM users;

# Saia:
\q
```

---

## ✅ Verificação Final

Agora você deve conseguir:

1. **Acessar o site**: http://localhost:8081
2. **Fazer login** com seu usuário
3. **Estar logado** (ver seu nome no header)
4. **Acessar painel admin** (criar campanhas, gerenciar usuários, etc)

---

## 🔍 Troubleshooting

### Erro: "connect ECONNREFUSED 127.0.0.1:5432"
**Problema**: PostgreSQL não está rodando

**Solução**:
- Windows: Services → Procure por "PostgreSQL" → Click direito → Start
- Linux: `sudo systemctl start postgresql`
- Mac: `brew services start postgresql`

### Erro: "database "rifa_db" does not exist"
**Problema**: Banco de dados não foi criado

**Solução**: Siga o PASSO 1 novamente

### Erro: "EADDRINUSE :::5000"
**Problema**: Porta 5000 já está em uso

**Solução**: Mude a porta no backend `.env`:
```
PORT=5001
```
E atualize no frontend `.env`:
```
VITE_API_URL=http://localhost:5001/api
```

### Frontend conecta ao backend mas sem dados
**Problema**: Token JWT expirado ou armazenamento corrompido

**Solução**: 
- Abra DevTools (F12) → Console
- Execute: `localStorage.clear()`
- Recarregue a página
- Faça login novamente

---

## 📁 Estrutura de Pastas

```
Projeto-RIFA/
├── backend/                    ← Servidor Node.js + Express
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── README.md
│   ├── scripts/
│   │   └── migrate.js         ← Script para criar tabelas
│   └── src/
│       ├── db.js              ← Conexão PostgreSQL
│       ├── auth.js            ← JWT e autenticação
│       ├── utils.js           ← Funções auxiliares
│       └── routes/            ← Endpoints da API
├── src/                        ← Frontend React + TypeScript
│   ├── App.tsx
│   ├── main.tsx
│   ├── services/
│   │   └── api.ts             ← Cliente HTTP para chamar API
│   ├── context/               ← Context API (será atualizado)
│   ├── pages/                 ← Páginas React
│   ├── components/            ← Componentes React
│   └── ...
├── .env                       ← Variáveis de ambiente (frontend)
├── package.json               ← Dependências frontend
├── vite.config.ts
└── ...
```

---

## 🔐 Segurança

**Importante**: Os arquivos `.env` contêm informações sensíveis (senhas, chaves JWT).

- ✅ **NÃO commitar** `.env` no Git (já está no `.gitignore`)
- ✅ **NUNCA** compartilhe a chave JWT_SECRET
- ✅ **USE senhas fortes** em produção
- ✅ **NUNCA** armazene senhas em plain text (já estão hashadas com bcrypt)

---

## 🚀 Próximos Passos

1. **Integração de Pagamentos**: Stripe ou PayPal
2. **Email**: Sistema de notificações por email
3. **Sorteio Automático**: Scheduler para sortear vencedores
4. **Deploy**: Publicar em produção (Heroku, AWS, DigitalOcean)
5. **Testes**: Adicionar testes automatizados

---

## 📞 Suporte

Alguma dúvida? Verifique:
- Backend README: `backend/README.md`
- Documentação das rotas da API (em breve)
- Logs do servidor (terminal onde rodou `npm run dev`)

---

**✨ Tudo pronto! Comece a criar suas campanhas e venda tickets! ✨**
