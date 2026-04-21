# ❓ FAQ - Supabase & Autenticação

## 🔐 Autenticação

### P: Como fazer login com Supabase?
**R:** Use a função `login()` do hook `useAuth`:

```typescript
const { login } = useAuth();

try {
  await login('seu@email.com', 'SuaSenha123');
  // Usuário logado com sucesso
} catch (error) {
  console.error('Erro:', error.message);
}
```

### P: Como criar uma nova conta?
**R:** Use a função `signup()`:

```typescript
const { signup } = useAuth();

try {
  await signup(
    {
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '(11) 99999-9999',
      cpf: '123.456.789-00'
    },
    'SenhaSegura123'
  );
} catch (error) {
  console.error('Erro:', error.message);
}
```

### P: Como fazer logout?
**R:** Use a função `logout()`:

```typescript
const { logout } = useAuth();

try {
  await logout();
  // Usuário desconectado
} catch (error) {
  console.error('Erro:', error.message);
}
```

### P: Como acessar dados do usuário logado?
**R:** Use `user` do hook:

```typescript
const { user } = useAuth();

console.log(user?.name);    // João Silva
console.log(user?.email);   // joao@example.com
console.log(user?.cpf);     // 123.456.789-00
```

## 🔐 Segurança & Senhas

### P: As senhas são seguras?
**R:** Sim! O Supabase:
- Criptografa as senhas com bcrypt
- Nunca as armazena em texto plano
- Gerencia tokens JWT automaticamente
- Usa HTTPS por padrão

### P: Posso recuperar/resetar a senha?
**R:** Sim, você pode implementar reset de senha. Consulte [Supabase Password Reset](https://supabase.com/docs/guides/auth/reset-password).

### P: Como ativar autenticação social?
**R:** Configure em Supabase Auth → Providers e implemente no seu app. Consulte [Supabase Social Auth](https://supabase.com/docs/guides/auth/social-login).

## 💾 Banco de Dados

### P: Onde são armazenados os dados do usuário?
**R:** Em duas tabelas:
- `auth.users` (gerenciada pelo Supabase)
- `profiles` (sua tabela customizada)

### P: Como os dados estão protegidos?
**R:** Com RLS (Row Level Security):
- Usuários só veem seus próprios dados
- Admin pode ver todos (com policy customizada)
- Impossível acessar dados de outra pessoa

### P: Posso adicionar mais campos ao perfil?
**R:** Sim! Altere a tabela `profiles`:

```sql
ALTER TABLE profiles ADD COLUMN telefone_comercial VARCHAR(20);
ALTER TABLE profiles ADD COLUMN data_nascimento DATE;
```

Depois atualize o TypeScript:

```typescript
export interface User {
  // ... campos existentes
  telefone_comercial?: string;
  data_nascimento?: string;
}
```

## 🌐 API & Requisições

### P: Como fazer requisições autenticadas?
**R:** Use `fetchAPI()` do `src/services/api.ts`:

```typescript
import { campaignsAPI } from '@/services/api';

// Automaticamente inclui token
const campaigns = await campaignsAPI.getAll();
```

### P: O token é incluído automaticamente?
**R:** Sim! A função `getToken()` obtém do Supabase automaticamente.

### P: O que fazer se receber erro 403?
**R:** Provavelmente é RLS. Verifique:
- Se o usuário está autenticado
- As políticas RLS na tabela

## 🔄 Sessão & Persistência

### P: A sessão persiste após recarregar a página?
**R:** Sim! Supabase mantém a sessão em localStorage.

### P: Por quanto tempo a sessão dura?
**R:** Por padrão, 7 dias. Configurável em Supabase.

### P: Como forçar logout após fechar o navegador?
**R:** Configure em Supabase → Auth → Session Settings.

## 🚨 Erros & Troubleshooting

### P: Erro "Missing Supabase env vars"
**R:** Verifique `.env.local`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### P: Erro "Invalid login credentials"
**R:** Email ou senha incorretos. Verifique:
- Email digitado corretamente
- Senha correta
- Conta existe

### P: Erro "Email already registered"
**R:** Email já está cadastrado. Use outro email.

### P: Erro 403 ao atualizar perfil
**R:** Verifique RLS. Você só pode atualizar seu próprio perfil.

### P: Usuário desaparece ao recarregar
**R:** Aguarde `isLoading` ser false:

```typescript
const { user, isLoading } = useAuth();

if (isLoading) return <div>Carregando...</div>;
// Agora sim está carregado
```

## 🧪 Testes

### P: Como testar autenticação?
**R:** Use dados de teste:
```
Email: test@example.com
Password: TestPassword123
```

### P: Como testar com múltiplos usuários?
**R:** Use diferentes emails:
```
user1@example.com
user2@example.com
user3@example.com
```

### P: Como testar RLS?
**R:** Faça login com usuários diferentes e verifique que não conseguem acessar dados um do outro.

## 📱 Mobile

### P: Funciona em mobile?
**R:** Sim! Supabase funciona em qualquer plataforma com JavaScript.

### P: Como fazer deep linking em mobile?
**R:** Configure URLs de callback em:
- Supabase → Auth Settings
- seu app mobile

## 🌍 Produção

### P: Como fazer deploy em produção?
**R:** 
1. Configure variáveis de ambiente seguras
2. Ative email verification
3. Configure CORS
4. Use HTTPS
5. Faça backup

### P: Como monitorar usuários em produção?
**R:** Use Supabase Dashboard:
- Authentication → Users
- SQL Editor para queries

### P: Como escalar para muitos usuários?
**R:** Supabase escalas automaticamente. Nenhuma configuração necessária.

## 💰 Custos

### P: Quanto custa Supabase?
**R:** Plano gratuito inclui:
- 500MB storage
- Queries ilimitadas
- 50,000 requisições/mês
- Suporte comunitário

Veja [Pricing](https://supabase.com/pricing).

## 🤝 Integração

### P: Como integrar com outros serviços?
**R:** Use Webhooks do Supabase:
- Slack
- Discord
- Twilio
- Custom HTTP

### P: Como integrar com payment (Stripe)?
**R:** Combine Supabase com Stripe API.

## 📚 Documentação

### P: Onde encontrar mais ajuda?
**R:** 
- [Supabase Docs](https://supabase.com/docs)
- [Discord Community](https://discord.supabase.io)
- [GitHub Issues](https://github.com/supabase/supabase)

### P: Como reportar um bug?
**R:** Crie issue em [github.com/supabase/supabase](https://github.com/supabase/supabase/issues)

## ✨ Dicas & Boas Práticas

### 1. Nunca Exponha a Chave
```typescript
// ❌ ERRADO
const key = 'sk_live_xxx'; // Key secreta

// ✅ CERTO
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### 2. Use TypeScript
```typescript
// ✅ CERTO
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

if (error) throw error;
// `data` tem tipos corretos
```

### 3. Sempre Verifique Autenticação
```typescript
// ✅ CERTO
if (!isAuthenticated) {
  redirect('/login');
}
```

### 4. Trate Erros Corretamente
```typescript
try {
  await login(email, password);
} catch (error) {
  // Tratar erro especifico
}
```

### 5. Use RLS em Produção
Sempre ative e configure RLS corretamente!

---

**Última atualização:** Janeiro 2026
**Versão:** 1.0

Não encontrou sua pergunta? Consulte a documentação ou abra uma issue!
