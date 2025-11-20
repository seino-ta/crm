'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export function OwnerChart({ data }: { data: { owner: string; amount: number }[] }) {
  const formatAmount = (value: number) => `${value.toLocaleString('ja-JP')}円`;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 80, right: 16, top: 16, bottom: 16 }}>
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toLocaleString('ja-JP')}
          label={{ value: '金額(円)', position: 'insideBottomRight', offset: -10 }}
        />
        <YAxis dataKey="owner" type="category" width={160} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'rgba(16,185,129,0.08)' }} formatter={(value: number) => [formatAmount(value), '金額']} />
        <Bar dataKey="amount" fill="#059669" barSize={18} radius={6} />
      </BarChart>
    </ResponsiveContainer>
  );
}
