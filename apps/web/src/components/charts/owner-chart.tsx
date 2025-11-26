'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

import { getCurrencyScale } from '@/lib/chart-scale';
import { defaultLocale, type Locale } from '@/lib/i18n/config';

type OwnerChartProps = {
  data: { owner: string; amount: number }[];
  locale?: Locale;
  unitHeader?: string;
  axisLabel?: string;
  tooltipLabel?: string;
};

export function OwnerChart({ data, locale = defaultLocale, unitHeader = 'Unit', axisLabel = 'Amount', tooltipLabel = 'Amount' }: OwnerChartProps) {
  const axisColor = 'var(--chart-axis-color)';
  const gridColor = 'var(--chart-grid-color)';
  const maxValue = data.reduce((max, item) => Math.max(max, item.amount), 0);
  const { divisor, label } = getCurrencyScale(maxValue, locale);
  const numberLocale = locale === 'ja' ? 'ja-JP' : 'en-US';
  const chartData = data.map((item) => ({
    owner: item.owner,
    value: Number((item.amount / divisor).toFixed(2)),
  }));

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 ">
        {unitHeader}: {label}
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 72, right: 16, top: 16, bottom: 16 }}>
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: axisColor, fontSize: 12 }}
            tickFormatter={(value) => value.toLocaleString(numberLocale)}
            label={{ value: `${axisLabel} (${label})`, position: 'insideBottomRight', offset: -10, style: { fill: axisColor, fontSize: 12 } }}
          />
          <YAxis dataKey="owner" type="category" width={160} tickLine={false} axisLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: 'rgba(16,185,129,0.08)' }}
            contentStyle={{ backgroundColor: 'var(--background)', borderColor: gridColor, color: 'var(--foreground)' }}
            formatter={(value: number) => [`${value.toLocaleString(numberLocale)}${label}`, tooltipLabel]}
          />
          <Bar dataKey="value" fill="#059669" barSize={18} radius={6} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
