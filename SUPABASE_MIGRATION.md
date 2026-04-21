# Guia de Migração para Supabase

Este guia descreve como migrar o sistema de autenticação anterior para usar Supabase.

## O que Mudou

### Antes (Sistema Local)
- Autenticação baseada em localStorage
- Senhas armazenadas em localStorage (inseguro)
- Sem backend de autenticação real
- Validações apenas no frontend

### Agora (Supabase)
- Autenticação gerenciada pelo Supabase Auth
- Senhas criptografadas e seguras
- Sessões gerenciadas automaticamente
- RLS (Row Level Security) para proteção de dados

## Estrutura do AuthContext

### Interface AuthContextType

```typescript
interface AuthContextType {
  user: User | null;                    // Usuário autenticado
  isLoading: boolean;                   // Estado de carregamento
  isAuthenticated: boolean;              // Se está autenticado
  signup: (userData, password) => void;  // Criar nova conta
  login: (email, password) => void;      // Fazer login
  logout: () => void;                    // Desconectar
  getUser: (email) => User | undefined;  // Buscar usuário
}
```

## Hooks de Uso

### Usar o Hook useAuth

```typescript
import { useAuth } from '@/context/AuthContext';

export function MyComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) return <div>Carregando...</div>;

  if (isAuthenticated) {
    return <button onClick={() => logout()}>Logout</button>;
  }

  return <button onClick={() => login('email@test.com', 'password')}>Login</button>;
}
```

## Funções Principais

### 1. Signup (Criar Conta)

```typescript
const { signup } = useAuth();

await signup(
  {
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 99999-9999',
    cpf: '000.000.000-00'
  },
  'SenhaSegura123!'
);
```

**O que acontece:**
1. Supabase Auth cria usuário em `auth.users`
2. App cria perfil em `profiles` com dados adicionais
3. Usuário é automaticamente logado
4. Perfil é carregado no contexto

### 2. Login (Fazer Login)

```typescript
const { login } = useAuth();

await login('joao@example.com', 'SenhaSegura123!');
```

**O que acontece:**
1. Supabase Auth valida credenciais
2. Token JWT é gerado automaticamente
3. Sessão é salva (persistida)
4. Perfil do usuário é carregado
5. Estado de autenticação é atualizado

### 3. Logout (Desconectar)

```typescript
const { logout } = useAuth();

await logout();
```

**O que acontece:**
1. Supabase revoga a sessão
2. Token é removido
3. Usuário é removido do contexto
4. localStorage é limpo

### 4. GetUser (Buscar Usuário)

```typescript
const { getUser } = useAuth();

const user = await getUser('joao@example.com');
console.log(user); // { id, name, email, phone, cpf, createdAt }
```

## Integração com Componentes

### Componente de Login

```typescript
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirecionar se já autenticado
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Componente Protegido (PrivateRoute)

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Carregando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

## Tratamento de Erros

Os erros agora vêm do Supabase com mensagens claras:

```typescript
try {
  await login(email, password);
} catch (error) {
  if (error.message === 'Invalid login credentials') {
    // Email ou senha inválidos
  } else if (error.message.includes('already registered')) {
    // Email já cadastrado
  } else {
    // Outro erro
  }
}
```

## Persistência de Sessão

A sessão do Supabase é automaticamente persistida e restaurada:

1. Ao fazer login, o token é armazenado localmente
2. Ao recarregar a página, a sessão é restaurada
3. Ao fazer logout, a sessão é destruída

**Não é necessário fazer nada!** O Supabase cuida disso.

## Verificação de Autenticação

### No Load do App

```typescript
export function App() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AppLayout /> : <LoginPage />;
}
```

### Em Componentes

```typescript
export function MyComponent() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <NotAuthenticatedMessage />;
  }

  return <div>Bem-vindo, {user?.name}!</div>;
}
```

## Próximas Features

### 1. Recuperação de Senha

```typescript
// Enviar link de reset
await supabase.auth.resetPasswordForEmail('email@example.com');

// Alterar senha com token
await supabase.auth.updateUser({
  password: 'novaSenha123!'
});
```

### 2. Atualizar Perfil

```typescript
// Adicionar ao AuthContext
const updateProfile = async (updates) => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);
  
  if (error) throw error;
  await loadUserProfile(user.id);
};
```

### 3. Autenticação Social

```typescript
// Google, GitHub, Discord, etc.
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```

## Troubleshooting

### Problema: "Missing Supabase env vars"
**Solução:** Adicione as variáveis em `.env.local`

### Problema: Usuário não persiste após reload
**Solução:** Aguarde o `isLoading` ser false antes de renderizar

### Problema: "Forbidden" ao atualizar perfil
**Solução:** Verifique as políticas RLS na tabela profiles

## Contato e Suporte

Para dúvidas sobre Supabase, visite:
- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Community](https://discord.supabase.io)
