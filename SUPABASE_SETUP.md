# Configuração do Supabase

Este documento descreve como configurar o Supabase para gerenciamento de usuários no projeto.

## Pré-requisitos

1. Criar uma conta em [Supabase](https://supabase.com)
2. Criar um novo projeto
3. Obter as credenciais (URL e Anon Key)

## Setup do Banco de Dados

### 1. Criar Tabela de Perfis (Profiles)

Execute o seguinte SQL na seção "SQL Editor" do Supabase:

```sql
-- Criar tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Configurar Row Level Security (RLS)

Execute os seguintes comandos para configurar segurança de linha:

```sql
-- Ativar RLS na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ler seu próprio perfil
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política: Admin pode ler todos os perfis (opcional)
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email IN ('admin@example.com')
    )
  );
```

## Configuração de Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

Obtenha essas credenciais em:
- Supabase Dashboard → Project Settings → API

## Autenticação por Email

O Supabase está configurado para autenticar usuários usando email e senha.

### Email Confirmação (Opcional)

Se quiser ativar confirmação de email:

1. Vá em Authentication → Email Templates
2. Customize os templates de email
3. Ative "Confirm email" nas configurações de autenticação

### Redefinição de Senha

Para permitir redefinição de senha, configure no Supabase:
1. Authentication → Email Templates → Reset Password
2. Configure a URL de callback: `https://seu-dominio.com/reset-password`

## Estrutura de Dados

### Tabela: profiles

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Referência ao usuário em auth.users |
| email | VARCHAR(255) | Email único do usuário |
| name | VARCHAR(255) | Nome completo |
| phone | VARCHAR(20) | Telefone |
| cpf | VARCHAR(14) | CPF único |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

## Fluxo de Autenticação

1. **Signup**: 
   - Usuário cria conta com email e senha
   - Supabase Auth cria usuário em `auth.users`
   - App cria perfil em `profiles` com dados adicionais

2. **Login**:
   - Supabase Auth verifica credenciais
   - App carrega perfil do usuário da tabela `profiles`
   - Token JWT é armazenado automaticamente

3. **Logout**:
   - Supabase Auth revoga a sessão
   - App limpa o estado de autenticação

## Backups e Segurança

- Supabase realiza backups automáticos diários
- Configure backups adicionais em Project Settings → Backups
- Dados sensíveis (CPF) devem ser tratados com cuidado
- Use HTTPS em produção
- Revise as políticas RLS regularmente

## Troubleshooting

### Erro: "Missing Supabase env vars"
- Verifique se as variáveis estão definidas em `.env.local`
- Confirme que os valores estão corretos

### Usuários não conseguem fazer login
- Verifique se as credenciais foram salvas corretamente no Supabase
- Confirme que a tabela `profiles` foi criada

### Erro 403 (Forbidden)
- Verifique as políticas RLS na tabela
- Confirme que o usuário autenticado tem permissão

## Próximos Passos

1. Implementar recuperação de senha
2. Adicionar autenticação social (Google, GitHub)
3. Implementar 2FA (Two-Factor Authentication)
4. Adicionar gerenciamento de sessões
5. Implementar logs de auditoria
