'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

type PipelinePoint = Record<string, number | string> & { stage: string };

type PipelineChartProps = {
  data: PipelinePoint[];
  unitLabel?: string;
  valueKey?: string;
};

export function PipelineChart({ data, unitLabel, valueKey = 'value' }: PipelineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 8, right: 12, top: 10, bottom: 5 }}>
        <XAxis dataKey="stage" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(value) => value.toLocaleString()}
          label={unitLabel ? { value: unitLabel, angle: -90, position: 'insideLeft', offset: 10 } : undefined}
        />
        <Tooltip
          cursor={{ fill: 'rgba(59,130,246,0.08)' }}
          formatter={(value: number) => [`${value.toLocaleString()}${unitLabel ?? ''}`, '金額']}
        />
        <Bar dataKey={valueKey} fill="#2563eb" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
