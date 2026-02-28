import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function PriceHistoryTable({ history }) {
  if (!history || history.length === 0) {
    return <p className="text-center py-8" style={{ color: 'var(--color-muted)' }}>Nenhuma checagem registrada</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-muted)', letterSpacing: '0.08em' }}>Data/Hora</th>
            <th className="text-right py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-muted)', letterSpacing: '0.08em' }}>Preco</th>
            <th className="text-right py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-muted)', letterSpacing: '0.08em' }}>Variacao</th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-muted)', letterSpacing: '0.08em' }}>Companhia</th>
            <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-muted)', letterSpacing: '0.08em' }}>Paradas</th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-muted)', letterSpacing: '0.08em' }}>Obs</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item, i) => {
            const prev = history[i + 1];
            let variation = null;
            if (prev && prev.price && item.price) {
              variation = ((item.price - prev.price) / prev.price) * 100;
            }
            return (
              <tr key={item.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.03}s`, borderBottom: '1px solid var(--color-border-light)' }}>
                <td className="py-3.5 px-4" style={{ color: 'var(--color-ink-soft)' }}>{formatDateTime(item.checked_at)}</td>
                <td className="py-3.5 px-4 text-right font-display" style={{ color: 'var(--color-ink)' }}>R$ {item.price?.toLocaleString('pt-BR')}</td>
                <td className="py-3.5 px-4 text-right">
                  {variation !== null ? (
                    <span className={`inline-flex items-center gap-1 font-semibold ${variation <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {variation <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                    </span>
                  ) : (
                    <Minus className="w-3 h-3 ml-auto" style={{ color: 'var(--color-border)' }} />
                  )}
                </td>
                <td className="py-3.5 px-4" style={{ color: 'var(--color-ink-soft)' }}>{item.cheapest_airline || '—'}</td>
                <td className="py-3.5 px-4 text-center" style={{ color: 'var(--color-ink-soft)' }}>{item.stops === 0 ? 'Direto' : item.stops != null ? `${item.stops}` : '—'}</td>
                <td className="py-3.5 px-4 text-xs" style={{ color: 'var(--color-muted)' }}>{item.raw_summary || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
