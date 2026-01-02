import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  PaintBrushIcon,
  ShieldCheckIcon,
  UserIcon,
  LinkIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { useHasMounted } from '@/hooks/common';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { PasswordChangeForm } from '@/components/settings/password-change-form';
import { EmailChangeForm } from '@/components/settings/email-change-form';
import { TwoFactorSettings } from '@/components/settings/two-factor-settings';
import { ConnectedAccounts } from '@/components/settings/connected-accounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const Route = createLazyFileRoute('/_protected/settings/')({
  component: SettingsPage,
});

type TabId = 'appearance' | 'security' | 'account' | 'connections';

interface Tab {
  id: TabId;
  labelKey: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'appearance',
    labelKey: 'tabs.appearance',
    icon: <PaintBrushIcon className="h-5 w-5" />,
  },
  {
    id: 'security',
    labelKey: 'tabs.security',
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  },
  {
    id: 'account',
    labelKey: 'tabs.account',
    icon: <UserIcon className="h-5 w-5" />,
  },
  {
    id: 'connections',
    labelKey: 'tabs.connections',
    icon: <LinkIcon className="h-5 w-5" />,
  },
];

function SettingsPage() {
  const { t } = useTranslationNamespace('settings');
  const [activeTab, setActiveTab] = useState<TabId>('appearance');
  const hasMounted = useHasMounted();

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header with gradient and orbs */}
      <div className="noise relative overflow-hidden border-b border-border-primary bg-surface">
        {/* Animated background orbs */}
        <div className="orb orb-teal orb-animated pointer-events-none absolute -top-16 -right-16 h-48 w-48 opacity-15" />
        <div className="orb orb-cyan animate-drift-reverse pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 opacity-10" />

        <div className="relative mx-auto max-w-5xl px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Icon with gradient */}
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand-teal-400 to-brand-cyan shadow-lg',
                  hasMounted ? 'animate-slide-up' : 'opacity-0'
                )}
              >
                <Cog6ToothIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1
                  className={cn(
                    'text-2xl font-bold text-text-primary',
                    hasMounted ? 'stagger-1 animate-slide-up' : 'opacity-0'
                  )}
                >
                  <span className="text-gradient-animated">{t('page.title')}</span>
                </h1>
                <p
                  className={cn(
                    'mt-1 text-sm text-text-secondary',
                    hasMounted ? 'stagger-2 animate-slide-up' : 'opacity-0'
                  )}
                >
                  {t('page.subtitle')}
                </p>
              </div>
            </div>
            <Link
              to="/"
              className={cn(
                'group flex items-center gap-2 rounded-lg border border-border-primary',
                'glass-subtle px-4 py-2 text-sm font-medium text-text-secondary',
                'transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:bg-surface hover:text-text-primary hover:shadow-md',
                hasMounted ? 'stagger-3 animate-slide-up' : 'opacity-0'
              )}
            >
              <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              {t('common.cancel')}
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sidebar Navigation - Enhanced */}
          <div
            className={cn(
              'w-full md:w-56 lg:w-64',
              hasMounted ? 'stagger-4 animate-slide-up' : 'opacity-0'
            )}
          >
            <nav className="glass-subtle space-y-1 rounded-xl p-2">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-lg px-4 py-3',
                    'text-left text-sm font-medium transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-linear-to-r from-brand-teal-500/20 to-brand-cyan/10 text-brand-teal shadow-sm'
                      : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                  )}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <span
                    className={cn(
                      'transition-transform',
                      activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'
                    )}
                  >
                    {tab.icon}
                  </span>
                  {t(tab.labelKey)}
                  {/* Active indicator */}
                  {activeTab === tab.id && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-brand-teal shadow-sm" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'appearance' && <AppearanceSettings />}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('security.password.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PasswordChangeForm />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('security.twoFactor.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TwoFactorSettings />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('account.email.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmailChangeForm />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'connections' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('connections.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConnectedAccounts />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
