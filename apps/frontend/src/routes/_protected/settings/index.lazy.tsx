import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { PasswordChangeForm } from '@/components/settings/password-change-form';
import { EmailChangeForm } from '@/components/settings/email-change-form';
import { TwoFactorSettings } from '@/components/settings/two-factor-settings';
import { ConnectedAccounts } from '@/components/settings/connected-accounts';

export const Route = createLazyFileRoute('/_protected/settings/')({
  component: SettingsPage,
});

type TabId = 'security' | 'account' | 'connections';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'security',
    label: 'Security',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
  },
  {
    id: 'account',
    label: 'Account',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    id: 'connections',
    label: 'Connected Accounts',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  },
];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('security');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your account settings and preferences
              </p>
            </div>
            <Link
              to="/"
              className={`
                flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm
                font-medium text-gray-700 transition
                hover:bg-gray-200
              `}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div
          className={`
            flex flex-col gap-8
            md:flex-row
          `}
        >
          {/* Sidebar Navigation */}
          <div
            className={`
              w-full
              md:w-64
            `}
          >
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex w-full items-center gap-3 rounded-lg px-4 py-3
                    text-left text-sm font-medium transition
                    ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : `
                          text-gray-600
                          hover:bg-gray-100 hover:text-gray-900
                        `
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">Change Password</h2>
                  <PasswordChangeForm />
                </div>
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Two-Factor Authentication
                  </h2>
                  <TwoFactorSettings />
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">Change Email</h2>
                  <EmailChangeForm />
                </div>
              </div>
            )}

            {activeTab === 'connections' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">Connected Accounts</h2>
                  <ConnectedAccounts />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
