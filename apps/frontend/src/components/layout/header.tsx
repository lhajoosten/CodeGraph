import { Link, useNavigate } from '@tanstack/react-router';
import {
  Bars3Icon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftOnRectangleIcon,
  UserIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/ui/avatar';
import { useCurrentUser, useLogout } from '@/hooks';
import { APP_NAME } from '@/lib/constants';
import { useThemeStore } from '@/stores/theme-store';

interface HeaderProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

function Header({ showMenuButton = false, onMenuClick, className }: HeaderProps) {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const { resolvedTheme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logoutMutation.mutate(
      {},
      {
        onSuccess: () => {
          navigate({ to: '/login', search: { redirect: '/' } });
        },
      }
    );
  };

  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <header
      className={cn(
        `
          border-border bg-background-2 sticky top-0 z-30 flex h-16 items-center
          justify-between border-b px-4
          lg:px-6
        `,
        className
      )}
    >
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <IconButton
            variant="ghost"
            icon={<Bars3Icon />}
            aria-label="Toggle menu"
            onClick={onMenuClick}
            className="lg:hidden"
          />
        )}

        {/* Mobile logo - only show when sidebar is hidden */}
        <Link
          to="/"
          className={`
            flex items-center gap-2
            lg:hidden
          `}
        >
          <div
            className={`
              flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan
            `}
          >
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <span className="text-xl font-bold text-brand-cyan">{APP_NAME}</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <IconButton
          variant="ghost"
          icon={
            resolvedTheme === 'dark' ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )
          }
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
        />

        {/* Notifications */}
        <IconButton
          variant="ghost"
          icon={<BellIcon className="h-5 w-5" />}
          aria-label="View notifications"
        />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`
              relative h-10 w-10 rounded-full p-0
            `}
            >
              <UserAvatar name={userName} size="default" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">{userName}</p>
                <p className="text-text-muted text-xs leading-none">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <Cog6ToothIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer" destructive>
              <ArrowLeftOnRectangleIcon className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { Header };
export type { HeaderProps };
