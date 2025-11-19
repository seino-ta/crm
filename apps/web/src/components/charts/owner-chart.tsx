'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export function OwnerChart({ data }: { data: { owner: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="owner" type="category" width={160} />
        <Tooltip cursor={{ fill: 'rgba(16,185,129,0.08)' }} />
        <Bar dataKey="amount" fill="#059669" barSize={18} radius={6} />
      </BarChart>
    </ResponsiveContainer>
  );
}
