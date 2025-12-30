import { Link, useLocation } from '@tanstack/react-router';
import {
  Squares2X2Icon,
  CheckIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellAlertIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SimpleTooltip, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { APP_NAME } from '@/lib/constants';
import { useFetchCurrentUser } from '@/hooks/api';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string | number;
}

const mainNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Squares2X2Icon },
  { href: '/tasks', label: 'Tasks', icon: CheckIcon },
  { href: '/agents', label: 'Agents', icon: RocketLaunchIcon },
  { href: '/metrics', label: 'Metrics', icon: ChartBarIcon },
  { href: '/webhooks', label: 'Webhooks', icon: BellAlertIcon },
];

const bottomNavItems: NavItem[] = [{ href: '/settings', label: 'Settings', icon: Cog6ToothIcon }];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

interface NavLinkProps {
  item: NavItem;
  isActive: (href: string) => boolean;
  isOpen: boolean;
}

function NavLink({ item, isActive, isOpen }: NavLinkProps) {
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
          ? 'text-text-secondary bg-brand-cyan/10'
          : `
            text-text-secondary
            hover:bg-surface hover:text-text-primary
          `
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {isOpen && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span
              className={`
                rounded-full bg-brand-cyan px-2 py-0.5 text-xs text-white
              `}
            >
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
}

function Sidebar({ isOpen, onToggle, className }: SidebarProps) {
  const location = useLocation();
  const { data: user } = useFetchCurrentUser();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  // Only show admin link for superusers
  const adminNavItem: NavItem | null = user?.is_superuser
    ? { href: '/admin', label: 'Admin', icon: ShieldCheckIcon }
    : null;

  return (
    <TooltipProvider>
      <aside
        className={cn(
          `
            border-border-primary bg-surface-secondary fixed top-0 left-0 z-40 flex
            h-screen flex-col border-r transition-all duration-300
          `,
          isOpen ? 'w-64' : 'w-16',
          className
        )}
      >
        {/* Logo */}
        <div
          className={`
            border-border-primary flex h-16 items-center justify-between border-b px-4
          `}
        >
          {isOpen ? (
            <Link to="/" className="flex items-center gap-2">
              <div
                className={`
                  flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan
                `}
              >
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold text-brand-cyan">{APP_NAME}</span>
            </Link>
          ) : (
            <Link
              to="/"
              className={`
                bg-primary mx-auto flex h-8 w-8 items-center justify-center
                rounded-lg
              `}
            >
              <span className="text-lg font-bold text-white">C</span>
            </Link>
          )}
        </div>

        {/* Main navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive} isOpen={isOpen} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-border space-y-1 border-t p-3">
          {adminNavItem && (
            <>
              <NavLink item={adminNavItem} isActive={isActive} isOpen={isOpen} />
              <Separator className="my-2" />
            </>
          )}

          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive} isOpen={isOpen} />
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
                <ChevronLeftIcon className="mr-2 h-4 w-4" />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export { Sidebar };
export type { SidebarProps, NavItem };
