import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  LogIn, 
  FolderKanban, 
  Calendar, 
  FileSpreadsheet, 
  Users,
  Building2,
  Sparkles
} from 'lucide-react';
import { TeamMember, UserRole } from '../types';

interface LoginViewProps {
  teamMembers: TeamMember[];
  onLogin: (user: TeamMember) => void;
  onRegisterMember: (newMember: Omit<TeamMember, 'id'>) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  teamMembers,
  onLogin,
  onRegisterMember,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPosition, setRegPosition] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('colaborador');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setErrorMessage('Por favor ingresa tu usuario o correo electrónico y tu contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user by email or by simple username (e.g. 'carlos' matches 'carlos.mendez@rawi.mx' or name 'Carlos')
      const matchedUser = teamMembers.find(member => {
        const emailMatch = member.email.toLowerCase() === cleanIdentifier;
        const usernameMatch = member.email.toLowerCase().startsWith(cleanIdentifier);
        const nameMatch = member.name.toLowerCase().includes(cleanIdentifier);
        return emailMatch || usernameMatch || nameMatch;
      });

      if (!matchedUser) {
        setErrorMessage('Usuario o correo no encontrado. Verifica tus credenciales o usa las cuentas de acceso rápido.');
        setIsLoading(false);
        return;
      }

      // Check password (fallback to 'admin123', 'cliente123', or 'equipo123')
      const expectedPassword = matchedUser.password || (matchedUser.role === 'admin' ? 'admin123' : (matchedUser.role === 'cliente' ? 'cliente123' : 'equipo123'));
      
      // Also allow flexible demo password '123456' or exact match
      if (cleanPassword !== expectedPassword && cleanPassword !== '123456' && cleanPassword !== 'admin') {
        setErrorMessage(`Contraseña incorrecta para ${matchedUser.name}. Usa: "${expectedPassword}" o el botón de acceso rápido.`);
        setIsLoading(false);
        return;
      }

      // Success
      setIsLoading(false);
      onLogin(matchedUser);
    }, 350);
  };

  const handleQuickLogin = (member: TeamMember) => {
    setIdentifier(member.email);
    setPassword(member.password || (member.role === 'admin' ? 'admin123' : (member.role === 'cliente' ? 'cliente123' : 'equipo123')));
    setErrorMessage(null);
    onLogin(member);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage('Completa los campos obligatorios (Nombre, Correo y Contraseña).');
      return;
    }

    // Check if email already exists
    if (teamMembers.some(m => m.email.toLowerCase() === regEmail.trim().toLowerCase())) {
      setErrorMessage('Ya existe una cuenta con este correo electrónico.');
      return;
    }

    const newMember: Omit<TeamMember, 'id'> = {
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      position: regPosition.trim() || (regRole === 'admin' ? 'Administrador del Sistema' : 'Ejecutivo de Ventas'),
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      phone: regPhone.trim() || '+52 55 0000 0000',
      activeColor: regRole === 'admin' ? 'amber' : 'blue',
      password: regPassword.trim(),
    };

    onRegisterMember(newMember);
    setRegSuccess(`¡Cuenta creada con éxito para ${regName}! Ya puedes iniciar sesión.`);
    setTimeout(() => {
      setIsRegisterMode(false);
      setIdentifier(regEmail.trim());
      setPassword(regPassword.trim());
      setRegSuccess(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#120A38] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Background ambient accents matching RAWI Indigo & Electric Cyan */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#271871]/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00F5D4]/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-white shadow-xl shadow-[#00F5D4]/10 mb-3 border-2 border-[#00F5D4]/40">
            <img
              src="/assets/aistudio/RAWI_Logo_PNG_8b0c4f46.png"
              alt="RAWI Marketing Digital"
              className="h-11 sm:h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            RAWI CRM
          </h1>
          <p className="mt-1 text-xs text-indigo-200/80 font-medium">
            RAWI: Marketing Digital • Portal de Gestión y Cotizaciones
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-[#1A104B]/90 backdrop-blur-md py-6 px-6 sm:px-8 shadow-2xl rounded-2xl border border-[#2E207A]">
          {/* Top mode switcher: Iniciar Sesión vs Registro */}
          <div className="flex rounded-xl bg-[#120A38]/90 p-1 mb-6 border border-[#2E207A] text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isRegisterMode
                  ? 'bg-[#271871] text-[#00F5D4] border border-[#00F5D4]/30 shadow-sm'
                  : 'text-indigo-200/70 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isRegisterMode
                  ? 'bg-[#271871] text-[#00F5D4] border border-[#00F5D4]/30 shadow-sm'
                  : 'text-indigo-200/70 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nuevo Colaborador</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Message */}
          {regSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{regSuccess}</div>
            </div>
          )}

          {!isRegisterMode ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Usuario o Correo Corporativo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-identifier-input"
                    type="text"
                    required
                    placeholder="ej: info@rawi.mx o carlos"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Admin: <code className="text-amber-300 font-mono">admin123</code> | Equipo: <code className="text-blue-300 font-mono">equipo123</code>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span className="text-slate-400">Recordar sesión activa</span>
                </label>
                <span className="text-[11px] text-blue-400 hover:underline cursor-pointer">
                  ¿Olvidaste tu clave?
                </span>
              </div>

              <button
                id="login-submit-button"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-[#00F5D4] hover:bg-[#00DFC0] disabled:opacity-50 text-[#120A38] rounded-xl text-xs font-extrabold shadow-lg shadow-[#00F5D4]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#120A38] border-t-transparent rounded-full animate-spin" />
                    Validando credenciales...
                  </span>
                ) : (
                  <>
                    <span>Ingresar al Sistema CRM</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Mariana Soto"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Correo Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="msoto@rawi.mx"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Cargo o Puesto
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Consultora Comercial"
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Rol de Acceso *
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="block w-full px-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="admin">Administrador (Acceso y Libertad Total)</option>
                    <option value="project_manager">Project Manager (Crear Proyectos y Tareas)</option>
                    <option value="colaborador">Colaborador (Únicamente Tareas Asignadas)</option>
                    <option value="cliente">Cliente (Progreso, Materiales, Observaciones y Pagos)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Contraseña de Acceso *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Cuenta y Activar</span>
              </button>
            </form>
          )}

          {/* Quick Access / Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Acceso Rápido con 1 Clic (4 Cargos Demostración)
              </span>
              <span className="text-[10px] text-slate-500">Selecciona para entrar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teamMembers.map((member) => {
                const getBadge = (role?: string) => {
                  switch (role) {
                    case 'admin':
                      return { text: 'ADMIN', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
                    case 'project_manager':
                      return { text: 'PM', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
                    case 'colaborador':
                    case 'team_member':
                      return { text: 'COLAB', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
                    case 'cliente':
                      return { text: 'CLIENTE', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
                    default:
                      return { text: 'COLAB', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
                  }
                };
                const badge = getBadge(member.role) || { text: 'COLAB', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };

                return (
                  <button
                    key={member.id}
                    id={`quick-login-${member.id}`}
                    type="button"
                    onClick={() => handleQuickLogin(member)}
                    className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/60 transition-all text-left flex items-center space-x-2.5 cursor-pointer group"
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                          {member.name.split(' ')[0]} {member.name.split(' ')[1] || ''}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-slate-400 truncate">
                          {member.position}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 ml-1 shrink-0">
                          {member.password || (member.role === 'admin' ? 'admin123' : (member.role === 'cliente' ? 'cliente123' : 'equipo123'))}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feature badges footer */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Proyectos por Cliente</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Google Calendar</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Permisos por Rol</span>
          </div>
        </div>
      </div>
    </div>
  );
};
