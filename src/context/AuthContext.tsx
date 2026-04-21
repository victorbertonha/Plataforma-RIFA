import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (userData: Omit<User, 'id' | 'createdAt'>, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getUser: (email: string) => Promise<User | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Timeout de 5 segundos para evitar load infinito
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth initialization timeout')), 5000)
        );

        const authPromise = (async () => {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setUser(null);
          }
        })();

        await Promise.race([authPromise, timeoutPromise]);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            await loadUserProfile(session.user.id);
          } catch (error) {
            console.error('Error loading profile on auth state change:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Timeout de 3 segundos para query do profile
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), 3000)
      );

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        console.warn('Error loading profile:', error.message);
        // Se falhar ao carregar profile, limpar session
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          cpf: data.cpf,
          role: data.role || 'user',
          createdAt: data.created_at,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Se houver timeout ou outro erro, desconectar e limpar estado
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error signing out:', e);
      }
      setUser(null);
    }
  };

  const signup = async (
    userData: Omit<User, 'id' | 'createdAt'>,
    password: string
  ) => {
    try {
      // Create auth user - DO NOT auto-login by requiring email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            cpf: userData.cpf,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (profileError) throw profileError;

      // Note: Do NOT auto-login here. User must confirm email first.
      // The user will be logged in only after email confirmation
    } catch (error) {
      let message = 'Erro ao criar conta';
      
      if (error instanceof AuthError) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('rate limit')) {
          message = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
        } else if (errorMsg.includes('already registered')) {
          message = 'Este email já está cadastrado.';
        } else if (errorMsg.includes('invalid email')) {
          message = 'Email inválido.';
        } else if (errorMsg.includes('password')) {
          message = 'A senha não atende aos requisitos de segurança.';
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      throw new Error(message);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      await loadUserProfile(data.user.id);
    } catch (error) {
      const message = error instanceof AuthError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'Erro ao fazer login';
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao desconectar';
      throw new Error(message);
    }
  };

  const getUser = async (email: string): Promise<User | undefined> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found

      if (data) {
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          cpf: data.cpf,
          createdAt: data.created_at,
          role: data.role || 'user',
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signup,
        login,
        logout,
        getUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

