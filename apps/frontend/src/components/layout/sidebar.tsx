import { Link, useLocation } from '@tanstack/react-router';
import {
  Squares2X2Icon,
  CheckIcon,
  RocketLaunchIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SimpleTooltip, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { APP_NAME } from '@/lib/constants';

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
          ? 'bg-brand-cyan/10 text-text-secondary-lum'
          : `
            text-text-secondary-lum
            hover:bg-bg-elevated-lum hover:text-text-primary-lum
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

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          `
            fixed top-0 left-0 z-40 flex h-screen flex-col
            border-r border-border-steel bg-bg-steel transition-all duration-300
          `,
          isOpen ? 'w-64' : 'w-16',
          className
        )}
      >
        {/* Logo */}
        <div
          className={`
            flex h-16 items-center justify-between border-b border-border-steel px-4
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
                mx-auto flex h-8 w-8 items-center justify-center rounded-lg
                bg-primary
              `}
            >
              <span className="text-text-button text-lg font-bold">C</span>
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
        <div className="space-y-1 border-t border-border p-3">
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
