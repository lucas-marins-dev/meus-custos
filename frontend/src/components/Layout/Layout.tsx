import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const MOBILE_BREAKPOINT = 760;

const primaryNavItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Receitas', path: '/rendas', icon: TrendingUp },
  { label: 'Despesas', path: '/despesas', icon: CreditCard },
  { label: 'Dívidas', path: '/dividas', icon: Landmark },
  { label: 'Assistente IA', path: '/chat-ia', icon: Bot },
];

const routeMetadata: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Visão geral',
    subtitle: 'Acompanhe seu saldo, maiores gastos e previsão financeira do mês',
  },
  '/rendas': {
    title: 'Receitas (rendas)',
    subtitle: 'Registre e acompanhe suas entradas por data de recebimento',
  },
  '/despesas': {
    title: 'Despesas (gastos)',
    subtitle: 'Gastos ocasionais e recorrentes por local e categoria',
  },
  '/dividas': {
    title: 'Dívidas',
    subtitle: 'Débitos, empréstimos e parcelamentos com acompanhamento de pagamentos',
  },
  '/chat-ia': {
    title: 'Assistente IA',
    subtitle: 'Consultor financeiro alimentado pelos seus dados',
  },
  '/perfil': {
    title: 'Meu perfil',
    subtitle: 'Informações vinculadas à sua conta',
  },
  '/usuarios': {
    title: 'Gestão de usuários',
    subtitle: 'Gerencie contas, permissões e acessos ao sistema',
  },
};

const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT;

export const Layout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpenRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  const [loggingOut, setLoggingOut] = useState(false);

  const normalizedPathname = location.pathname === '/' ? '/' : location.pathname.replace(/\/+$/, '');
  const metadata = routeMetadata[normalizedPathname] || routeMetadata['/'];
  const isAssistant = normalizedPathname === '/chat-ia';
  const initial = user?.nome?.trim().charAt(0).toUpperCase() || 'U';

  const currentMonth = useMemo(() => {
    const now = new Date();
    const month = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now);
    return `${month.charAt(0).toUpperCase()}${month.slice(1)} / ${now.getFullYear()}`;
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const updateViewport = () => {
      setIsMobile(mediaQuery.matches);
      if (!mediaQuery.matches) setDrawerOpen(false);
    };

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    document.querySelector<HTMLElement>('.workspace')?.scrollTo({ top: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile || !drawerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [drawerOpen, isMobile]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return undefined;

    if (!isMobile) {
      sidebar.removeAttribute('inert');
      drawerWasOpenRef.current = false;
      return undefined;
    }

    if (drawerOpen) {
      sidebar.removeAttribute('inert');
      drawerWasOpenRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        sidebar.querySelector<HTMLButtonElement>('.sidebar__drawer-close')?.focus();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    sidebar.setAttribute('inert', '');
    if (drawerWasOpenRef.current) {
      drawerWasOpenRef.current = false;
      const frame = window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }

    return undefined;
  }, [drawerOpen, isMobile]);

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // AuthContext clears the local session even if the server logout endpoint fails.
    } finally {
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar__nav-link${isActive ? ' sidebar__nav-link--active active' : ''}`;

  return (
    <div
      className={`app-shell${collapsed ? ' app-shell--collapsed' : ''}${isAssistant ? ' app-shell--assistant' : ''}`}
      data-collapsed={collapsed}
      data-drawer-open={drawerOpen}
      data-theme={theme}
    >
      <aside
        ref={sidebarRef}
        className={`sidebar${drawerOpen ? ' sidebar--open' : ''}`}
        aria-hidden={isMobile && !drawerOpen ? true : undefined}
        aria-label="Navegação principal"
        onClick={(event) => {
          if (!isMobile && event.target === event.currentTarget) setCollapsed((current) => !current);
        }}
      >
        <div className="sidebar__brand-row">
          <NavLink
            to="/"
            end
            className="sidebar__brand brand"
            onClick={closeDrawer}
            aria-label="Ir para o Dashboard"
            title="Ir para o Dashboard"
          >
            <img className="sidebar__logo brand-logo-mark" src="/logo-meus-custos.svg" alt="" />
            <span className="sidebar__wordmark brand-wordmark" aria-hidden="true">
              <span>meus</span>
              <span>custos</span>
            </span>
          </NavLink>
          <button
            type="button"
            className="sidebar__drawer-close"
            onClick={closeDrawer}
            aria-label="Fechar menu"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <span className="sidebar__section-label nav-label">Financeiro</span>
        <nav className="sidebar__nav" aria-label="Área financeira">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={navLinkClass}
                onClick={closeDrawer}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {isAdmin ? (
          <div className="sidebar__admin">
            <span className="sidebar__section-label nav-label">Administração</span>
            <nav className="sidebar__nav" aria-label="Administração">
              <NavLink
                to="/usuarios"
                className={navLinkClass}
                onClick={closeDrawer}
                title={collapsed && !isMobile ? 'Gestão de usuários' : undefined}
              >
                <Users aria-hidden="true" />
                <span>Gestão de usuários</span>
              </NavLink>
            </nav>
          </div>
        ) : null}

        <div className="sidebar__footer sidebar-footer">
          <button
            type="button"
            className="sidebar__theme-toggle appearance-control"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
          </button>

          <div className={`sidebar__profile profile-card${normalizedPathname === '/perfil' ? ' active profile-card--active' : ''}`}>
            <NavLink
              to="/perfil"
              className="sidebar__profile-main profile-main profile-card__main"
              onClick={closeDrawer}
              aria-label="Abrir meu perfil"
              title={collapsed && !isMobile ? 'Meu perfil' : undefined}
            >
              <span className="sidebar__avatar avatar profile-card__avatar" aria-hidden="true">
                {initial}
              </span>
              <span className="sidebar__profile-copy profile-copy profile-card__copy">
                <strong>{user?.nome}</strong>
                <small>MEU PERFIL</small>
              </span>
            </NavLink>
            <button
              type="button"
              className="sidebar__logout profile-signout profile-card__logout"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label={loggingOut ? 'Saindo da conta' : 'Sair da conta'}
              title="Sair da conta"
            >
              <LogOut aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {drawerOpen ? (
        <button
          type="button"
          className="sidebar-backdrop backdrop"
          onClick={closeDrawer}
          aria-label="Fechar menu"
        />
      ) : null}

      <section className={`workspace${isAssistant ? ' assistant-workspace workspace--assistant' : ''}`}>
        <header className="topbar">
          <div className="topbar__desktop topbar-copy">
            <button
              type="button"
              className="topbar__sidebar-toggle toggle sidebar-toggle"
              onClick={() => setCollapsed((current) => !current)}
              aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            >
              <Menu aria-hidden="true" />
            </button>
            <div className="topbar__copy">
              <h1>{metadata.title}</h1>
              <p>{metadata.subtitle}</p>
            </div>
          </div>

          <NavLink
            to="/"
            end
            className="topbar__mobile-brand mobile-topbar-brand mobile-brand"
            onClick={closeDrawer}
            aria-label="Ir para o Dashboard"
          >
            <img src="/logo-meus-custos.svg" alt="" />
            <span className="brand-wordmark" aria-hidden="true">
              <span>meus</span>
              <span>custos</span>
            </span>
          </NavLink>

          <div className="topbar__actions top-actions">
            <span className="topbar__month month month-badge">{currentMonth}</span>
            <button
              ref={mobileMenuButtonRef}
              type="button"
              className="topbar__mobile-menu mobile-sidebar-toggle toggle sidebar-toggle topbar__mobile-toggle"
              onClick={() => setDrawerOpen((current) => !current)}
              aria-label={drawerOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={drawerOpen}
            >
              <Menu aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className={`workspace__main${isAssistant ? ' assistant-main' : ''}`}>
          <Outlet />
        </main>
      </section>
    </div>
  );
};
