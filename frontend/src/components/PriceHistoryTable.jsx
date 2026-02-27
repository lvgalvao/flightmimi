import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function PriceHistoryTable({ history }) {
  if (!history || history.length === 0) {
    return (
      <p className="text-center py-8" style={{ color: 'var(--color-faded)' }}>
        Nenhuma checagem registrada
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-sand-dark)' }}>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-faded)', letterSpacing: '0.08em' }}>Data/Hora</th>
            <th className="text-right py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-faded)', letterSpacing: '0.08em' }}>Preco</th>
            <th className="text-right py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-faded)', letterSpacing: '0.08em' }}>Variacao</th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-faded)', letterSpacing: '0.08em' }}>Companhia</th>
            <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-faded)', letterSpacing: '0.08em' }}>Paradas</th>
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
              <tr
                key={item.id}
                className="animate-fade-up"
                style={{
                  animationDelay: `${i * 0.03}s`,
                  borderBottom: '1px solid var(--color-sand)',
                }}
              >
                <td className="py-3.5 px-4" style={{ color: 'var(--color-ink-soft)' }}>
                  {formatDateTime(item.checked_at)}
                </td>
                <td className="py-3.5 px-4 text-right font-display font-bold" style={{ color: 'var(--color-ink)' }}>
                  R$ {item.price?.toLocaleString('pt-BR')}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {variation !== null ? (
                    <span className={`inline-flex items-center gap-1 font-medium ${variation <= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {variation <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                    </span>
                  ) : (
                    <Minus className="w-3 h-3 ml-auto" style={{ color: 'var(--color-sand-dark)' }} />
                  )}
                </td>
                <td className="py-3.5 px-4" style={{ color: 'var(--color-ink-soft)' }}>
                  {item.cheapest_airline || '—'}
                </td>
                <td className="py-3.5 px-4 text-center" style={{ color: 'var(--color-ink-soft)' }}>
                  {item.stops === 0 ? 'Direto' : item.stops != null ? `${item.stops}` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
