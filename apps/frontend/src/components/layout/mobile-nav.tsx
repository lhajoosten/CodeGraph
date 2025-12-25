import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, CheckSquare, Bot, Settings, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface MobileNavProps {
  className?: string;
}

function MobileNav({ className }: MobileNavProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around',
        'border-t border-border bg-background-2 px-4 py-2',
        'lg:hidden', // Only show on mobile
        className
      )}
    >
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              `
                flex flex-col items-center gap-1 px-3 py-2 text-xs
                transition-colors
              `,
              active ? 'text-primary' : `
                text-text-secondary
                hover:text-text-primary
              `
            )}
          >
            <item.icon className={cn('h-5 w-5', active && 'text-primary')} />
            <span className={cn('font-medium', active && 'text-primary')}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export { MobileNav };
export type { MobileNavProps };
