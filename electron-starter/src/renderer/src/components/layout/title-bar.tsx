import { useEffect, type JSX, type ComponentType, type SVGProps } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Toolbar from '@radix-ui/react-toolbar'
import { useTranslation } from 'react-i18next'
import { toggleVariants } from '@lib/variants'
import { cn } from '@lib/cn'
import {
  useThemeStore,
  ensureThemeStoreInitialized,
  type ThemePreference,
} from '../../stores/theme'

type ThemeOption = {
  value: ThemePreference
  labelKey: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

export default function TitleBar(): JSX.Element {
  const { t } = useTranslation('common')
  const preference = useThemeStore((s) => s.preference)
  const setPreference = useThemeStore((s) => s.setPreference)

  useEffect(() => {
    ensureThemeStoreInitialized()
  }, [])

  const onChangeTheme = (next: ThemePreference): void => {
    setPreference(next)
  }

  const options: ThemeOption[] = [
    { value: 'system', labelKey: 'theme.system', Icon: Monitor },
    { value: 'light', labelKey: 'theme.light', Icon: Sun },
    { value: 'dark', labelKey: 'theme.dark', Icon: Moon },
  ]

  return (
    <div className="titlebar app-drag" role="banner">
      <div className="titlebar__left app-no-drag">
        <span className="titlebar__title">{t('app.title')}</span>
      </div>
      <div className="titlebar__right app-no-drag">
        <Toolbar.Root
          aria-label={t('toolbar.windowActions', { defaultValue: 'Window actions' })}
          className="inline-flex items-center gap-2"
        >
          <div
            role="radiogroup"
            aria-label={t('theme.label', { defaultValue: 'Theme' })}
            className="inline-flex items-center gap-1"
          >
            <Tooltip.Provider delayDuration={200} skipDelayDuration={0}>
              {options.map(({ value, labelKey, Icon }) => (
                <Tooltip.Root key={value}>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={preference === value}
                      aria-label={t(labelKey, { defaultValue: value })}
                      onClick={() => onChangeTheme(value)}
                      className={cn(
                        toggleVariants({
                          variant: 'subtle',
                          size: 'icon-sm',
                          selected: preference === value,
                        }),
                        'grid place-items-center',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content
                    sideOffset={6}
                    className="rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow"
                  >
                    {t(labelKey, { defaultValue: value })}
                  </Tooltip.Content>
                </Tooltip.Root>
              ))}
            </Tooltip.Provider>
          </div>
        </Toolbar.Root>
      </div>
    </div>
  )
}
