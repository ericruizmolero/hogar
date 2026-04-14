import { Link, useLocation } from 'react-router-dom';
import { Home, GitCompare, LogOut, Settings, Calculator, Phone, Archive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './Logo';

export function Navbar() {
  const { logout } = useAuth();
  const location = useLocation();

  const links: { to: string; icon: typeof Home; label: string; badge?: number }[] = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/contactar', icon: Phone, label: 'Contactar' },
    { to: '/compare', icon: GitCompare, label: 'Comparar' },
    { to: '/simulador', icon: Calculator, label: 'Simulador' },
    { to: '/archivados', icon: Archive, label: 'Archivados' },
    { to: '/settings', icon: Settings, label: 'Ajustes' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
      <div className="max-w-[85rem] mx-auto px-3 sm:px-6">
        {/* Mobile navbar */}
        <div className="flex sm:hidden items-center h-12">
          <Link to="/" className="text-[var(--color-text)] mr-auto">
            <LogoMark size={24} />
          </Link>
          <div className="flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`p-2 rounded-md transition-all relative ${
                  isActive(link.to)
                    ? 'text-[var(--color-text)]'
                    : 'text-[var(--color-text-tertiary)]'
                }`}
                title={link.label}
              >
                <link.icon size={18} strokeWidth={1.5} />
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--color-accent)] text-white text-[9px] font-medium min-w-[14px] h-3.5 flex items-center justify-center rounded-full px-0.5">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={logout}
              className="p-2 text-[var(--color-text-tertiary)]"
              title="Cerrar sesión"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Desktop navbar */}
        <div className="hidden sm:flex items-center justify-between h-14">
          <Link to="/" className="text-[var(--color-text)] hover:opacity-70 transition-opacity">
            <LogoMark size={28} />
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all relative
                  ${isActive(link.to)
                    ? 'bg-[var(--color-bg-active)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
                  }
                `}
              >
                <link.icon size={16} strokeWidth={1.5} />
                <span>{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--color-accent)] text-white text-[10px] font-medium min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="ml-3 pl-3 border-l border-[var(--color-border)]">
              <button
                onClick={logout}
                className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] rounded-md transition-all"
                title="Cerrar sesión"
              >
                <LogOut size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-px bg-[var(--color-border)]" />
    </nav>
  );
}
