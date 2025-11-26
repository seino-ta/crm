import { defaultLocale, type Locale } from '@/lib/i18n/config';

type ScaleDefinition = {
  threshold: number;
  divisor: number;
  label: Record<Locale, string>;
};

const SCALES: ScaleDefinition[] = [
  { threshold: 1e8, divisor: 1e8, label: { ja: '億円', en: '100M JPY' } },
  { threshold: 1e6, divisor: 1e6, label: { ja: '百万円', en: '1M JPY' } },
  { threshold: 1e4, divisor: 1e4, label: { ja: '万円', en: '10k JPY' } },
];

const FALLBACK_SCALE: ScaleDefinition = { threshold: 0, divisor: 1, label: { ja: '円', en: 'JPY' } };

export function getCurrencyScale(maxValue: number, locale: Locale = defaultLocale) {
  const scale = SCALES.find((item) => maxValue >= item.threshold) ?? FALLBACK_SCALE;
  return {
    divisor: scale.divisor,
    label: scale.label[locale] ?? scale.label[defaultLocale],
  };
}
