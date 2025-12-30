import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  PaintBrushIcon,
  ShieldCheckIcon,
  UserIcon,
  LinkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useTranslationNamespace } from '@/hooks/useTranslation';
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

  return (
    <div className="bg-bg-primary-lum min-h-screen">
      {/* Header */}
      <div className="border-border-steel bg-bg-elevated-lum border-b">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-text-primary-lum text-2xl font-bold">{t('page.title')}</h1>
              <p className="text-text-secondary-lum mt-1 text-sm">{t('page.subtitle')}</p>
            </div>
            <Link
              to="/"
              className={cn(
                'border-border-steel flex items-center gap-2 rounded-lg border',
                'bg-bg-elevated-lum text-text-secondary-lum px-4 py-2 text-sm font-medium',
                'hover:bg-bg-steel hover:text-text-primary-lum transition'
              )}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {t('common.cancel')}
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-56 lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-4 py-3',
                    'text-left text-sm font-medium transition',
                    activeTab === tab.id
                      ? 'bg-brand-teal/10 text-brand-teal'
                      : 'text-text-secondary-lum hover:bg-bg-elevated-lum hover:text-text-primary-lum'
                  )}
                >
                  {tab.icon}
                  {t(tab.labelKey)}
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
