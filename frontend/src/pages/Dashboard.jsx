import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Heart, RefreshCw } from 'lucide-react';
import AlertCard from '../components/AlertCard';
import api from '../services/api';

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const { data } = await api.getAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeCount = alerts.filter((a) => a.status === 'active').length;

  return (
    <div>
      <div className="mb-8 sm:mb-10 animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight mb-2" style={{ color: 'var(--color-ink)' }}>
          Suas jornadas
        </h1>
        <p className="text-base sm:text-lg" style={{ color: 'var(--color-muted)' }}>
          {alerts.length === 0
            ? 'Comece monitorando seu primeiro voo'
            : `${activeCount} alerta${activeCount !== 1 ? 's' : ''} ativo${activeCount !== 1 ? 's' : ''} de ${alerts.length}`}
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6 sm:mb-8 animate-fade-up stagger-1">
        <button onClick={() => navigate('/create')} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Novo Alerta
        </button>
        <button onClick={loadAlerts} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 spinner" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20 sm:py-24 animate-fade-up stagger-2">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--color-rose-wash)' }}>
            <Heart className="w-10 h-10" style={{ color: 'var(--color-rose-light)' }} />
          </div>
          <h3 className="font-display text-2xl mb-3" style={{ color: 'var(--color-ink)' }}>Nenhuma jornada ainda</h3>
          <p className="mb-8 max-w-sm mx-auto" style={{ color: 'var(--color-muted)' }}>Crie seu primeiro alerta e acompanhe os precos do voo que voce sonha</p>
          <button onClick={() => navigate('/create')} className="btn-primary text-sm">Criar Primeiro Alerta</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
          {alerts.map((alert, i) => (
            <div key={alert.id} className={`animate-fade-up stagger-${Math.min(i + 2, 6)}`}>
              <AlertCard alert={alert} onRefresh={loadAlerts} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
