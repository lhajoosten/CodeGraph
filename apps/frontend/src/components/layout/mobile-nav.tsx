import { Link, useLocation } from '@tanstack/react-router';
import {
  Squares2X2Icon,
  CheckIcon,
  RocketLaunchIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Squares2X2Icon },
  { href: '/tasks', label: 'Tasks', icon: CheckIcon },
  { href: '/agents', label: 'Agents', icon: RocketLaunchIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
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
        'border-border bg-background-2 border-t px-4 py-2',
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
              active
                ? 'text-primary'
                : `
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
