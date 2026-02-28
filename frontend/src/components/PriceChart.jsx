import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Area, ComposedChart } from 'recharts';

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="dropdown p-4 text-sm" style={{ minWidth: '160px' }}>
      <p className="font-display text-lg" style={{ color: 'var(--color-ink)' }}>
        R$ {item.price?.toLocaleString('pt-BR')}
      </p>
      {item.cheapest_airline && <p className="mt-1" style={{ color: 'var(--color-ink-soft)' }}>{item.cheapest_airline}</p>}
      {item.stops !== null && item.stops !== undefined && (
        <p style={{ color: 'var(--color-muted)' }}>{item.stops === 0 ? 'Voo direto' : `${item.stops} parada(s)`}</p>
      )}
      <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>{formatDateTime(item.checked_at)}</p>
    </div>
  );
}

export default function PriceChart({ priceHistory, targetPrice }) {
  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--color-blue-wash)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <p style={{ color: 'var(--color-muted)' }}>Nenhum dado de preco ainda</p>
      </div>
    );
  }

  const data = [...priceHistory].reverse().map((h) => ({ ...h, label: formatDateTime(h.checked_at) }));
  const prices = data.map((d) => d.price).filter(Boolean);
  const minPrice = Math.min(...prices, targetPrice) * 0.95;
  const maxPrice = Math.max(...prices, targetPrice) * 1.05;

  return (
    <div className="animate-fade-in">
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-blue-light)" stopOpacity={0.12} />
              <stop offset="95%" stopColor="var(--color-blue-light)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
          <YAxis domain={[minPrice, maxPrice]} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11, fill: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={targetPrice} stroke="var(--color-green)" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `Alvo R$${targetPrice.toLocaleString('pt-BR')}`, fill: 'var(--color-green)', fontSize: 11, fontFamily: 'Plus Jakarta Sans', fontWeight: 600 }} />
          <Area type="monotone" dataKey="price" fill="url(#priceGradient)" stroke="none" />
          <Line type="monotone" dataKey="price" stroke="var(--color-blue)" strokeWidth={2.5} dot={{ r: 4, fill: 'white', stroke: 'var(--color-blue)', strokeWidth: 2 }} activeDot={{ r: 6, fill: 'var(--color-blue)', stroke: 'white', strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
