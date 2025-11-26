'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

import { defaultLocale, type Locale } from '@/lib/i18n/config';

type PipelinePoint = Record<string, number | string> & { stage: string };

type PipelineChartProps = {
  data: PipelinePoint[];
  unitLabel?: string;
  valueKey?: string;
  locale?: Locale;
  valueLabel?: string;
};

export function PipelineChart({ data, unitLabel, valueKey = 'value', locale = defaultLocale, valueLabel }: PipelineChartProps) {
  const axisColor = 'var(--chart-axis-color)';
  const gridColor = 'var(--chart-grid-color)';
  const numberLocale = locale === 'ja' ? 'ja-JP' : 'en-US';
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 8, right: 12, top: 10, bottom: 5 }}>
        <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: axisColor, fontSize: 12 }}
          tickFormatter={(value) => value.toLocaleString(numberLocale)}
          label={
            unitLabel
              ? {
                  value: unitLabel,
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  style: { fill: axisColor, fontSize: 12 },
                }
              : undefined
          }
        />
        <Tooltip
          cursor={{ fill: 'rgba(59,130,246,0.08)' }}
          contentStyle={{ backgroundColor: 'var(--background)', borderColor: gridColor, color: 'var(--foreground)' }}
          formatter={(value: number) => [`${value.toLocaleString(numberLocale)}${unitLabel ?? ''}`, valueLabel ?? 'Value']}
        />
        <Bar dataKey={valueKey} fill="#2563eb" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
