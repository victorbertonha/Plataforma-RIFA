import React, { useEffect, useState } from 'react';
import { adminAPI } from '@/services/api';
import { Users } from 'lucide-react';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-12">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
        <p className="text-muted-foreground mt-3">Carregando usuários...</p>
      </div>
    );

  return (
    <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
      <div className="px-6 py-4 bg-secondary/40 border-b border-border/30 flex items-center gap-3">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Usuários Registrados</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30 bg-secondary/20">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nome</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Telefone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">CPF</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Registrado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {users.map((u, idx) => (
              <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{u.name || '—'}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{u.email || '—'}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{u.phone || '—'}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{u.cpf || '—'}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-secondary/20 border-t border-border/30 text-sm text-muted-foreground">
        Total: <span className="text-primary font-semibold">{users.length}</span> usuário{users.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default UsersList;
