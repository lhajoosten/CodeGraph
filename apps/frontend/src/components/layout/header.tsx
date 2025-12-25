import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Menu, Bell, Sun, Moon, LogOut, User, Settings } from 'lucide-react';
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

interface HeaderProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

function Header({ showMenuButton = false, onMenuClick, className }: HeaderProps) {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
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
          sticky top-0 z-30 flex h-16 items-center justify-between border-b
          border-border bg-background-2 px-4
          lg:px-6
        `,
        className
      )}
    >
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <IconButton
            variant="ghost"
            icon={<Menu />}
            aria-label="Toggle menu"
            onClick={onMenuClick}
            className="lg:hidden"
          />
        )}

        {/* Mobile logo - only show when sidebar is hidden */}
        <Link to="/" className={`
          flex items-center gap-2
          lg:hidden
        `}>
          <div className={`
            flex h-8 w-8 items-center justify-center rounded-lg bg-primary
          `}>
            <span className="text-lg font-bold text-text-button">C</span>
          </div>
          <span className="text-xl font-bold text-primary">{APP_NAME}</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <IconButton
          variant="ghost"
          icon={isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
        />

        {/* Notifications */}
        <IconButton
          variant="ghost"
          icon={<Bell className="h-5 w-5" />}
          aria-label="View notifications"
        />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`
              relative h-10 w-10 rounded-full p-0
            `}>
              <UserAvatar name={userName} size="default" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">{userName}</p>
                <p className="text-xs leading-none text-text-tertiary">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer" destructive>
              <LogOut className="mr-2 h-4 w-4" />
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
