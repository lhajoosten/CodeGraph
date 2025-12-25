import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  CheckSquare,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SimpleTooltip, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { APP_NAME } from '@/lib/constants';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

const mainNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/agents', label: 'Agents', icon: Bot },
];

const bottomNavItems: NavItem[] = [{ href: '/settings', label: 'Settings', icon: Settings }];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

function Sidebar({ isOpen, onToggle, className }: SidebarProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const content = (
      <Link
        to={item.href}
        className={cn(
          `
            flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
            transition-colors
          `,
          active
            ? 'bg-primary/10 text-text-sidebar'
            : `
              text-text-secondary
              hover:bg-secondary hover:text-text-primary
            `
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {isOpen && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className={`
                rounded-full bg-primary px-2 py-0.5 text-xs text-text-button
              `}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (!isOpen) {
      return (
        <SimpleTooltip content={item.label} side="right">
          {content}
        </SimpleTooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          `
            fixed top-0 left-0 z-40 flex h-screen flex-col border-r
            border-border bg-sidebar transition-all duration-300
          `,
          isOpen ? 'w-64' : 'w-16',
          className
        )}
      >
        {/* Logo */}
        <div className={`
          flex h-16 items-center justify-between border-b border-border px-4
        `}>
          {isOpen ? (
            <Link to="/" className="flex items-center gap-2">
              <div className={`
                flex h-8 w-8 items-center justify-center rounded-lg bg-primary
              `}>
                <span className="text-lg font-bold text-text-button">C</span>
              </div>
              <span className="text-xl font-bold text-primary">{APP_NAME}</span>
            </Link>
          ) : (
            <Link
              to="/"
              className={`
                mx-auto flex h-8 w-8 items-center justify-center rounded-lg
                bg-primary
              `}
            >
              <span className="text-lg font-bold text-text-button">C</span>
            </Link>
          )}
        </div>

        {/* Main navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="space-y-1 border-t border-border p-3">
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          <Separator className="my-2" />

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size={isOpen ? 'default' : 'icon'}
            onClick={onToggle}
            className={cn('w-full', !isOpen && 'h-10 w-10')}
          >
            {isOpen ? (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export { Sidebar };
export type { SidebarProps, NavItem };
