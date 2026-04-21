// Exemplos de Uso do AuthContext com Supabase

// ============================================================
// 1. COMPONENTE DE REDIRECIONAMENTO (ProtectedRoute)
// ============================================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div>Carregando...</div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Uso:
// <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />

// ============================================================
// 2. HEADER COM INFORMAÇÕES DO USUÁRIO
// ============================================================

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div>
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="w-4 h-4 mr-2" />
        Sair
      </Button>
    </div>
  );
}

// ============================================================
// 3. FORMULÁRIO DE ATUALIZAÇÃO DE PERFIL
// ============================================================

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function UpdateProfileForm() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nome</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Telefone</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}

// ============================================================
// 4. VERIFICAÇÃO DE AUTENTICAÇÃO NO MOUNT
// ============================================================

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function MyAccount() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar se não autenticado
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) return <div>Carregando perfil...</div>;

  if (!isAuthenticated) return null;

  return (
    <div>
      <h1>Bem-vindo, {user?.name}</h1>
      <div className="space-y-2">
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Telefone:</strong> {user?.phone}</p>
        <p><strong>CPF:</strong> {user?.cpf}</p>
        <p><strong>Membro desde:</strong> {new Date(user?.createdAt || '').toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  );
}

// ============================================================
// 5. CONTADOR DE USUÁRIOS ONLINE (REAL-TIME)
// ============================================================

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/realtime-js';

export function OnlineUsersCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let channel: RealtimeChannel;

    const initRealtimeSubscription = async () => {
      channel = supabase
        .channel('online-users')
        .on('presence', { event: 'sync' }, () => {
          // Implementar lógica de presença
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          console.log('User joined:', key);
          setCount((prev) => prev + 1);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('User left:', key);
          setCount((prev) => Math.max(0, prev - 1));
        })
        .subscribe();
    };

    initRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return <div>Usuários online: {count}</div>;
}

// ============================================================
// 6. BUSCAR USUÁRIO POR EMAIL
// ============================================================

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function UserSearchForm() {
  const { getUser } = useAuth();
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await getUser(email);
      if (user) {
        setUserData(user);
      } else {
        setUserData(null);
        alert('Usuário não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="email"
          placeholder="Email do usuário"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Buscando...' : 'Buscar'}
        </Button>
      </form>

      {userData && (
        <div className="p-4 border rounded-lg">
          <h3 className="font-bold mb-2">{userData.name}</h3>
          <p>Email: {userData.email}</p>
          <p>Telefone: {userData.phone}</p>
          <p>CPF: {userData.cpf}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 7. INTEGRAÇÃO EM ROUTER
// ============================================================

// app.tsx ou router.tsx
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Rotas protegidas */}
        <Route
          path="/my-account"
          element={
            <ProtectedRoute>
              <MyAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        {/* Rotas públicas */}
        <Route path="/" element={<Index />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
      </Routes>
    </AuthProvider>
  );
}

// ============================================================
// Exemplos de Uso Simples
// ============================================================

// Em qualquer componente:
// import { useAuth } from '@/context/AuthContext';

// export function MyComponent() {
//   const { user, isAuthenticated, login, logout } = useAuth();

//   return (
//     <div>
//       {isAuthenticated ? (
//         <>
//           <p>Bem-vindo, {user?.name}!</p>
//           <button onClick={() => logout()}>Sair</button>
//         </>
//       ) : (
//         <a href="/login">Fazer login</a>
//       )}
//     </div>
//   );
// }
