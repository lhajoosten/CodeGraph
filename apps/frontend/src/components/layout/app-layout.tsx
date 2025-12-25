import * as React from 'react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

function AppLayout({ children, className }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebar-state', true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div className={`
        hidden
        lg:block
      `}>
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className={`
              fixed inset-0 z-40 bg-black/50
              lg:hidden
            `}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className={`
            fixed inset-y-0 left-0 z-50 w-64
            lg:hidden
          `}>
            <Sidebar isOpen={true} onToggle={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

      {/* Main content area */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        )}
      >
        <Header showMenuButton onMenuClick={toggleMobileMenu} />

        <main className={cn(`
          flex-1 p-4
          lg:p-6
        `, className)}>{children}</main>
      </div>
    </div>
  );
}

export { AppLayout };
export type { AppLayoutProps };
