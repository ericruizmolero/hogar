import { Link, useLocation } from 'react-router-dom';
import { Home, GitCompare, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../hooks/useReminders';
import { LogoFull } from './Logo';

export function Navbar() {
  const { logout, user } = useAuth();
  const { pendingReminders } = useReminders();
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Propiedades' },
    { to: '/compare', icon: GitCompare, label: 'Comparar' },
    { to: '/reminders', icon: Bell, label: 'Recordatorios', badge: pendingReminders.length },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
      <div className="max-w-[85rem] mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link
            to="/"
            className="text-[var(--color-text)] hover:opacity-70 transition-opacity"
          >
            <LogoFull />
          </Link>

          <div className="flex items-center gap-0.5">
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
                <span className="hidden sm:inline">{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--color-accent)] text-white text-[10px] font-medium min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="ml-3 pl-3 border-l border-[var(--color-border)] flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-tertiary)] hidden sm:inline max-w-[120px] truncate">
                {user?.email}
              </span>
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
