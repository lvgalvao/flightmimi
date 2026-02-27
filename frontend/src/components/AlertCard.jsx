import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, TrendingDown, TrendingUp, Pause, Trash2, Play, Bell, Users } from 'lucide-react';
import SparklineChart from './SparklineChart';
import api from '../services/api';

const STATUS_CONFIG = {
  active: { dot: 'var(--color-terracotta)', label: 'Monitorando', labelColor: 'var(--color-terracotta)' },
  triggered: { dot: 'var(--color-sage)', label: 'Preco atingido!', labelColor: 'var(--color-sage)' },
  paused: { dot: 'var(--color-faded)', label: 'Pausado', labelColor: 'var(--color-faded)' },
  expired: { dot: '#b45555', label: 'Expirado', labelColor: '#b45555' },
};

function formatPrice(val) {
  if (!val) return '—';
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function calcVariation(recentPrices) {
  if (!recentPrices || recentPrices.length < 2) return null;
  const latest = recentPrices[recentPrices.length - 1].price;
  const previous = recentPrices[recentPrices.length - 2].price;
  if (!previous) return null;
  return ((latest - previous) / previous) * 100;
}

export default function AlertCard({ alert, onRefresh }) {
  const navigate = useNavigate();
  const config = STATUS_CONFIG[alert.status] || STATUS_CONFIG.active;
  const variation = calcVariation(alert.recentPrices);

  async function handlePauseResume(e) {
    e.stopPropagation();
    const newStatus = alert.status === 'paused' || alert.status === 'triggered' ? 'active' : 'paused';
    await api.updateAlert(alert.id, { status: newStatus });
    onRefresh();
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja deletar este alerta?')) return;
    await api.deleteAlert(alert.id);
    onRefresh();
  }

  return (
    <div
      onClick={() => navigate(`/alerts/${alert.id}`)}
      className="card p-6 cursor-pointer group"
      style={alert.status === 'triggered' ? { borderColor: 'var(--color-sage)', background: 'var(--color-sage-light)' } : {}}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            {alert.origin_display_code || alert.origin_name}
            <span className="mx-2 text-sm" style={{ color: 'var(--color-faded)' }}>para</span>
            {alert.dest_display_code || alert.dest_name}
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-ink-soft)' }}>
            {alert.origin_name} — {alert.dest_name}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full" style={{ background: config.dot }} />
          <span className="text-xs font-medium" style={{ color: config.labelColor }}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 mb-5 text-sm" style={{ color: 'var(--color-faded)' }}>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(alert.depart_date)}
          {alert.return_date ? ` — ${formatDate(alert.return_date)}` : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {alert.passengers} pax
        </span>
      </div>

      {/* Prices */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-faded)', letterSpacing: '0.08em' }}>
            Atual
          </div>
          <div className="font-display text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
            {formatPrice(alert.current_price)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-faded)', letterSpacing: '0.08em' }}>
            Alvo
          </div>
          <div className="font-display text-2xl font-bold" style={{ color: 'var(--color-terracotta)' }}>
            {formatPrice(alert.target_price)}
          </div>
        </div>
        {variation !== null && (
          <div className="text-right">
            <div className={`flex items-center gap-1 text-sm font-medium ${variation <= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {variation <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {alert.recentPrices && alert.recentPrices.length >= 2 && (
        <div className="mb-4 -mx-1">
          <SparklineChart prices={alert.recentPrices} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--color-sand-dark)' }}>
        <div className="flex gap-2">
          {(alert.status === 'active' || alert.status === 'paused' || alert.status === 'triggered') && (
            <button onClick={handlePauseResume} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3">
              {alert.status === 'paused' || alert.status === 'triggered' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {alert.status === 'paused' || alert.status === 'triggered' ? 'Reativar' : 'Pausar'}
            </button>
          )}
          <button onClick={handleDelete} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3" style={{ color: '#b45555', borderColor: 'transparent' }}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: 'var(--color-faded)' }} />
      </div>
    </div>
  );
}
