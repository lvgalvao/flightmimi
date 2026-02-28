import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function SparklineChart({ prices }) {
  if (!prices || prices.length < 2) return null;

  const data = prices.map((p) => ({ price: p.price || p }));

  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="price" stroke="var(--color-blue-light)" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
