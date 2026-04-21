import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User, Mail, Phone, CreditCard, Save, Edit2, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const MyAccount = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cpf: user?.cpf || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 11) return value;
    
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    } else if (cleaned.length <= 9) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
    }
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 11) return value;
    
    if (cleaned.length <= 2) {
      return cleaned.length > 0 ? `(${cleaned}` : '';
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    if (name === 'phone') {
      formattedValue = formatPhone(value);
    } else if (name === 'cpf') {
      formattedValue = formatCPF(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success('Dados atualizados com sucesso!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Senhas não correspondem');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success('Senha alterada com sucesso!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-20">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-8 -ml-2"
          asChild
        >
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            Minha Conta
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="p-6 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Informações Pessoais</h2>
                <Button
                  variant={isEditing ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      disabled={!isEditing}
                      maxLength="40"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      disabled
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      disabled={!isEditing}
                      placeholder="(11) 99999-9999"
                      maxLength="15"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* CPF */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPF</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleFormChange}
                      disabled
                      placeholder="999.999.999-99"
                      maxLength="14"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">O CPF não pode ser alterado</p>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="w-full btn-press glow-primary mt-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                )}
              </div>
            </div>

            {/* Change Password */}
            <div className="p-6 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Segurança</h2>
                <Button
                  variant={isChangingPassword ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isChangingPassword ? 'Cancelar' : 'Alterar Senha'}
                </Button>
              </div>

              {isChangingPassword && (
                <div className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Senha Atual</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        name="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        name="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirmar Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="w-full btn-press glow-primary mt-6"
                  >
                    {isSaving ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              )}

              {!isChangingPassword && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Sua conta está protegida com uma senha forte
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="p-6 rounded-2xl border border-border bg-card">
              <h3 className="font-bold mb-4">Informações da Conta</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Membro desde</p>
                  <p className="font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <p className="font-medium">Verificado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="p-6 rounded-2xl border border-border bg-card">
              <h3 className="font-bold mb-4">Links Rápidos</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/meus-pedidos">Meus Pedidos</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/carrinho">Carrinho</Link>
                </Button>
              </div>
            </div>

            {/* Logout */}
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              Sair da Conta
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyAccount;
