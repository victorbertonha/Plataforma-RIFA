# 🚀 COMECE AQUI - Guia Rápido

## 👋 Bem-vindo!

Você acabou de migrar seu projeto para usar **Supabase** como plataforma de gerenciamento de usuários!

Este arquivo vai te guiar pelos primeiros passos.

## ⚡ Começar em 10 Minutos

### 1️⃣ Criar Projeto Supabase (3 min)

```
1. Abra https://supabase.com
2. Clique "Start your project"
3. Faça login (GitHub ou email)
4. Clique "New Project"
5. Preencha:
   - Name: projeto-rifa
   - Password: SenhaForte123!
   - Region: sua região
6. Clique "Create new project"
7. Aguarde inicialização (pode levar 2-3 min)
```

### 2️⃣ Pegar as Credenciais (2 min)

```
1. No painel Supabase, vá em: Settings → API
2. COPIE:
   - Project URL (ex: https://xxxxx.supabase.co)
   - anon public key (a chave pública)
3. Guarde em um lugar seguro
```

### 3️⃣ Configurar seu Projeto (2 min)

```
1. Na raiz do projeto, crie arquivo: .env.local
2. Adicione:

VITE_SUPABASE_URL=COLE_A_URL_AQUI
VITE_SUPABASE_ANON_KEY=COLE_A_CHAVE_AQUI

3. Salve o arquivo
```

⚠️ **IMPORTANTE**: Não commite `.env.local` no Git!

### 4️⃣ Criar Banco de Dados (2 min)

```
1. No Supabase, vá em: SQL Editor
2. Clique: "New Query"
3. Abra o arquivo: scripts/supabase-setup.sql
4. Copie TODO o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique: "Run"
7. Aguarde completar
```

✅ Pronto! Seu banco está criado.

### 5️⃣ Testar (1 min)

```bash
# Na pasta do projeto, rode:
npm run dev

# Abra: http://localhost:5173
```

## 🧪 Testar a Autenticação

### Criar Conta

1. Clique em "Criar nova conta"
2. Preencha:
   - Nome: João Silva
   - Email: joao@example.com
   - Telefone: (11) 99999-9999
   - CPF: 000.000.000-00
   - Senha: Senha123!
3. Clique "Criar Conta"
4. ✅ Se funcionou, você vai para home!

### Fazer Login

1. Clique em "Entrar"
2. Preencha:
   - Email: joao@example.com
   - Senha: Senha123!
3. Clique "Entrar"
4. ✅ Se funcionou, você vai para home!

### Verificar no Supabase

1. Abra painel Supabase
2. Vá em: Authentication → Users
3. Você vai ver seu usuário criado!
4. Vá em: SQL Editor → profiles
5. Você vai ver seus dados!

## 📚 Próxima Leitura

Agora leia, **nessa ordem**:

1. **SUPABASE_QUICK_START.md** (5 min)
   - Visão geral rápida
   
2. **SUPABASE_FAQ.md** (10 min)
   - Responde dúvidas comuns

3. **AUTH_CONTEXT_EXAMPLES.tsx** (15 min)
   - Veja exemplos de código

4. **SUPABASE_SETUP.md** (quando precisar)
   - Referência completa

5. **IMPLEMENTATION_CHECKLIST.md** (para produção)
   - Checklist antes de deploy

## 🎯 Suas Próximas Ações

### Hoje
- [ ] Criar conta Supabase
- [ ] Pegar credenciais
- [ ] Configurar .env.local
- [ ] Executar script SQL
- [ ] Testar signup/login

### Esta Semana
- [ ] Ler documentação completa
- [ ] Testar com múltiplos usuários
- [ ] Revisar exemplos de código
- [ ] Adicionar autenticação em outras páginas

### Este Mês
- [ ] Implementar reset de senha
- [ ] Ativar email verification
- [ ] Configurar para produção
- [ ] Fazer deploy

## ❓ Dúvidas Rápidas?

### "Deu erro ao criar conta"
→ Leia `SUPABASE_FAQ.md` - seção "Erros & Troubleshooting"

### "Como usar em meu componente?"
→ Veja `AUTH_CONTEXT_EXAMPLES.tsx`

### "Como fazer [X]?"
→ Consulte `SUPABASE_FAQ.md`

### "Preciso de ajuda?"
→ Veja "Suporte" em `SUPABASE_FAQ.md`

## 🔐 Segurança Básica

✅ **FAÇA**:
- Use `.env.local` para credenciais
- Teste tudo antes de produção
- Revise RLS policies

❌ **NÃO FAÇA**:
- Commite `.env.local`
- Coloque credenciais em código
- Deixe RLS desativado
- Use senhas fracas

## 📞 Stack Técnico

O que você tem agora:

```
🔐 Autenticação
├── Supabase Auth (gerenciado)
├── Senhas seguras (bcrypt)
├── Tokens JWT (automáticos)
└── Sessão persistente

💾 Banco de Dados
├── PostgreSQL (Supabase)
├── Tabela profiles
├── RLS (Row Level Security)
└── Índices para performance

🎨 Frontend
├── React Hook useAuth()
├── TypeScript tipos
├── Componentes prontos
└── Exemplos de uso

📚 Documentação
├── 7 guias completos
├── Exemplos de código
├── FAQ detalhado
└── Checklist
```

## ✨ O Que Mudou no Seu Projeto?

### Antes ❌
- Autenticação em localStorage
- Senhas não-criptografadas
- Sem backend real
- Sem segurança de dados

### Agora ✅
- Autenticação no Supabase
- Senhas com bcrypt
- Backend profissional
- RLS e segurança garantida

## 🎉 Pronto?

Siga estes 5 passos e em 10 minutos você terá:
- ✅ Autenticação funcionando
- ✅ Usuários no banco de dados
- ✅ Login/Signup funcionando
- ✅ Sessão persistente
- ✅ Tudo seguro

**Vamos lá!** 🚀

---

**Primeira vez?** Comece com os 5 passos acima.

**Já fez os 5 passos?** Leia `SUPABASE_QUICK_START.md`

**Encontrou problema?** Consulte `SUPABASE_FAQ.md`

Happy coding! 💻
