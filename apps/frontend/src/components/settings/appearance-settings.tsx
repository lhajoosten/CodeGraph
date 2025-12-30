/**
 * Appearance settings component.
 * Allows users to configure theme (light/dark/system) and language preferences.
 */

import { useTranslationNamespace } from '@/hooks/useTranslation';
import { useThemeStore, type Theme } from '@/stores/theme-store';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface ThemeOptionProps {
  value: Theme;
  current: Theme;
  onChange: (theme: Theme) => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}

function ThemeOption({ value, current, onChange, icon, label, description }: ThemeOptionProps) {
  const isSelected = current === value;

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        'relative flex w-full items-start gap-4 rounded-lg border-2 p-4 text-left transition-all',
        isSelected
          ? 'border-brand-teal bg-brand-teal/10'
          : 'border-border-default-lum hover:border-brand-teal/50 hover:bg-bg-tertiary-lum'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          isSelected ? 'bg-brand-teal text-white' : 'bg-bg-steel text-text-secondary-lum'
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-text-primary-lum font-medium">{label}</div>
        <div className="text-text-secondary-lum mt-1 text-sm">{description}</div>
      </div>
      {isSelected && (
        <div className="bg-brand-teal absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full">
          <CheckIcon className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}

export function AppearanceSettings() {
  const { t } = useTranslationNamespace('settings');
  const { theme, setTheme } = useThemeStore();

  const themeOptions: Array<{
    value: Theme;
    icon: React.ReactNode;
    labelKey: string;
    descriptionKey: string;
  }> = [
    {
      value: 'light',
      icon: <SunIcon className="h-5 w-5" />,
      labelKey: 'appearance.theme.light',
      descriptionKey: 'appearance.theme.lightDescription',
    },
    {
      value: 'dark',
      icon: <MoonIcon className="h-5 w-5" />,
      labelKey: 'appearance.theme.dark',
      descriptionKey: 'appearance.theme.darkDescription',
    },
    {
      value: 'system',
      icon: <ComputerDesktopIcon className="h-5 w-5" />,
      labelKey: 'appearance.theme.system',
      descriptionKey: 'appearance.theme.systemDescription',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('appearance.theme.title')}</CardTitle>
          <CardDescription>{t('appearance.theme.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {themeOptions.map((option) => (
            <ThemeOption
              key={option.value}
              value={option.value}
              current={theme}
              onChange={setTheme}
              icon={option.icon}
              label={t(option.labelKey)}
              description={t(option.descriptionKey)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('appearance.language.title')}</CardTitle>
          <CardDescription>{t('appearance.language.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher />
        </CardContent>
      </Card>
    </div>
  );
}
