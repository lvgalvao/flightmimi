import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, Trash2, Edit3, Check, X, Users, Calendar } from 'lucide-react';
import PriceChart from '../components/PriceChart';
import PriceHistoryTable from '../components/PriceHistoryTable';
import api from '../services/api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatPrice(val) {
  if (!val) return '—';
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const cabinLabels = {
  economy: 'Economica',
  premium_economy: 'Premium',
  business: 'Business',
  first: 'Primeira',
};

export default function AlertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState('');

  useEffect(() => {
    loadDetail();
  }, [id]);

  async function loadDetail() {
    setLoading(true);
    try {
      const { data } = await api.getAlert(id);
      setAlert(data.alert);
      setPriceHistory(data.priceHistory || []);
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheck() {
    setChecking(true);
    try {
      await api.checkAlertNow(id);
      await loadDetail();
    } catch (err) {
      console.error('Check failed:', err);
    } finally {
      setChecking(false);
    }
  }

  async function handleExport() {
    try {
      const { data } = await api.exportAlertCSV(id);
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alert-${id}-history.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja deletar este alerta?')) return;
    await api.deleteAlert(id);
    navigate('/');
  }

  async function handleSaveTarget() {
    const price = parseFloat(newTarget);
    if (!price || price <= 0) return;
    await api.updateAlert(id, { target_price: price });
    setEditingTarget(false);
    await loadDetail();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 spinner" />
      </div>
    );
  }

  if (!alert) return null;

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 mb-8 text-sm font-medium transition-colors animate-fade-up"
        style={{ color: 'var(--color-faded)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-ink)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-faded)')}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Header */}
      <div className="mb-8 animate-fade-up stagger-1">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1" style={{ color: 'var(--color-ink)' }}>
          {alert.origin_display_code || alert.origin_name}
          <span className="mx-3" style={{ color: 'var(--color-faded)' }}>—</span>
          {alert.dest_display_code || alert.dest_name}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>
          {alert.origin_name} para {alert.dest_name}
        </p>
        <div className="flex items-center gap-5 mt-3 text-sm" style={{ color: 'var(--color-faded)' }}>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(alert.depart_date)}
            {alert.return_date ? ` — ${formatDate(alert.return_date)}` : ' (somente ida)'}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {alert.passengers} pax · {cabinLabels[alert.cabin_class] || alert.cabin_class}
          </span>
        </div>
      </div>

      {/* Price cards */}
      <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-up stagger-2">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--color-faded)', letterSpacing: '0.08em' }}>
            Atual
          </div>
          <div className="font-display text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
            {formatPrice(alert.current_price)}
          </div>
        </div>

        <div className="card p-5" style={{ borderColor: 'var(--color-terracotta-light)', background: 'rgba(224, 122, 95, 0.06)' }}>
          <div className="text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-terracotta)', letterSpacing: '0.08em' }}>
            Alvo
            {!editingTarget && (
              <button
                onClick={() => { setNewTarget(alert.target_price.toString()); setEditingTarget(true); }}
                style={{ color: 'var(--color-terracotta-light)' }}
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
          {editingTarget ? (
            <div className="flex items-center gap-2">
              <span className="font-display font-bold" style={{ color: 'var(--color-faded)' }}>R$</span>
              <input
                type="number"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="input-field font-display text-lg font-bold py-1 px-2 w-28"
                autoFocus
              />
              <button onClick={handleSaveTarget} className="text-green-700 hover:text-green-900">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setEditingTarget(false)} style={{ color: 'var(--color-faded)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="font-display text-2xl font-bold" style={{ color: 'var(--color-terracotta)' }}>
              {formatPrice(alert.target_price)}
            </div>
          )}
        </div>

        <div className="card p-5" style={{ borderColor: 'var(--color-sage-light)', background: 'rgba(94, 122, 106, 0.05)' }}>
          <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--color-sage)', letterSpacing: '0.08em' }}>
            Menor
          </div>
          <div className="font-display text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
            {formatPrice(alert.lowest_price)}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 mb-8 animate-fade-up stagger-3">
        <button onClick={handleCheck} disabled={checking} className="btn-primary flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          Verificar Agora
        </button>
        <button onClick={handleExport} className="btn-ghost flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" />
          CSV
        </button>
        <button
          onClick={handleDelete}
          className="btn-ghost flex items-center gap-2 text-sm ml-auto"
          style={{ color: '#b45555', borderColor: 'transparent' }}
        >
          <Trash2 className="w-4 h-4" />
          Deletar
        </button>
      </div>

      {/* Chart */}
      <div className="card p-6 mb-6 animate-fade-up stagger-4">
        <h2 className="font-display text-lg font-semibold mb-5" style={{ color: 'var(--color-ink)' }}>
          Evolucao do preco
        </h2>
        <PriceChart priceHistory={priceHistory} targetPrice={alert.target_price} />
      </div>

      {/* History table */}
      <div className="card p-6 animate-fade-up stagger-5">
        <h2 className="font-display text-lg font-semibold mb-5" style={{ color: 'var(--color-ink)' }}>
          Historico de checagens
        </h2>
        <PriceHistoryTable history={priceHistory} />
      </div>
    </div>
  );
}
