# Supabase - Configuração Rápida

## ⚡ 5 Passos para Começar

### 1️⃣ Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub ou email
4. Clique em "New Project"
5. Preencha os dados:
   - Name: `projeto-rifa`
   - Database password: (crie uma senha forte)
   - Region: Escolha a região mais próxima

Aguarde a criação (pode levar alguns minutos)

### 2️⃣ Obter Credenciais

No painel do Supabase:
1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** (ex: https://xxxxx.supabase.co)
   - **anon public key** (a chave pública)

### 3️⃣ Configurar Variáveis de Ambiente

Crie arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

**⚠️ NÃO COMMIT ESSE ARQUIVO NO GIT**

### 4️⃣ Executar Script SQL

1. No painel Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo de `scripts/supabase-setup.sql`
4. Clique em **Run**

✅ Banco de dados configurado!

### 5️⃣ Testar

1. Instale dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse http://localhost:5173 e teste signup/login

## 🔐 Segurança

### Para Produção

1. **Variáveis de Ambiente Seguros:**
   - Use variáveis de ambiente seguras do seu host
   - Nunca commite `.env.local`

2. **Email Verification:**
   - Ative em Supabase → Authentication → Email Configuration
   - Configure o template de confirmação

3. **CORS:**
   - Configure em Supabase → Settings → API → CORS
   - Adicione seu domínio de produção

4. **RLS (Row Level Security):**
   - Sempre ative RLS em produção
   - Revise as políticas regularmente

## 📊 Monitoramento

### Ver Logs

```
Supabase → Logs → Network Requests
```

### Ver Usuários

```
Supabase → Authentication → Users
```

### Ver Dados

```
Supabase → SQL Editor ou Table Editor → profiles
```

## 🆘 Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Missing Supabase env vars" | Verifique `.env.local` |
| Erro 403 ao inserir perfil | Verifique RLS policies |
| Usuário desaparece ao reload | Aguarde `isLoading` ser false |
| Email já cadastrado | Use email diferente |

## 📚 Recursos

- [Docs Supabase](https://supabase.com/docs)
- [SQL Editor Guide](https://supabase.com/docs/guides/sql-editor)
- [Auth Guide](https://supabase.com/docs/guides/auth)
- [Discord Community](https://discord.supabase.io)

## 🚀 Próximos Passos

Depois de configurar:

1. ✅ Testar signup/login
2. ✅ Configurar email verificação
3. ✅ Implementar reset de senha
4. ✅ Adicionar autenticação social
5. ✅ Configurar 2FA

---

**Precisa de ajuda?** Leia `SUPABASE_SETUP.md` para mais detalhes.
