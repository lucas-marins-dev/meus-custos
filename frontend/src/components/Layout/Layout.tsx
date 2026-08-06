import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Building2,
  Bot,
  Users,
  LogOut,
  Wallet,
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Receitas (Rendas)', path: '/rendas', icon: TrendingUp },
    { label: 'Despesas (Gastos)', path: '/despesas', icon: CreditCard },
    { label: 'Dívidas', path: '/dividas', icon: Building2 },
    { label: 'Assistente IA Gemini', path: '/chat-ia', icon: Bot },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Gestão de Usuários', path: '/usuarios', icon: Users });
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel flex flex-col justify-between p-4 border-r border-slate-800/80 fixed h-full z-20">
        <div>
          {/* Logo / Header */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/80">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-lg shadow-emerald-950/50">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">FinanControl</h1>
              <p className="text-xs text-slate-400 font-medium">Gestão de Custos</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-emerald-400 border border-slate-700">
                {user?.nome?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-slate-200 truncate">{user?.nome}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair da conta"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
