import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AirportSearch from '../components/AirportSearch';
import api from '../services/api';

export default function CreateAlert() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [cabinClass, setCabinClass] = useState('economy');
  const [passengers, setPassengers] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!origin || !destination) { setError('Selecione origem e destino'); return; }
    if (!departDate) { setError('Selecione a data de ida'); return; }
    if (!targetPrice || parseFloat(targetPrice) <= 0) { setError('Informe um preco alvo valido'); return; }

    setLoading(true);
    try {
      await api.createAlert({
        originEntityId: origin.skyId || origin.entityId,
        originName: origin.name,
        originDisplayCode: origin.displayCode,
        destEntityId: destination.skyId || destination.entityId,
        destName: destination.name,
        destDisplayCode: destination.displayCode,
        departDate,
        returnDate: returnDate || null,
        targetPrice: parseFloat(targetPrice),
        cabinClass,
        passengers,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar alerta');
    } finally {
      setLoading(false);
    }
  }

  const cabinLabels = { economy: 'Economica', premium_economy: 'Premium Economy', business: 'Business', first: 'Primeira Classe' };

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-6 sm:mb-8 text-sm font-medium transition-colors animate-fade-up" style={{ color: 'var(--color-muted)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-ink)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}>
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="animate-fade-up stagger-1">
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight mb-2" style={{ color: 'var(--color-ink)' }}>Nova jornada</h1>
        <p className="mb-6 sm:mb-8 text-sm sm:text-base" style={{ color: 'var(--color-muted)' }}>Defina sua rota e o preco que voce espera pagar</p>
      </div>

      {error && (
        <div className="px-4 sm:px-5 py-3 sm:py-4 rounded-xl mb-6 text-sm font-medium animate-scale-in" style={{ background: 'var(--color-red-soft)', color: 'var(--color-red)', border: '1px solid #fecaca' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <div className="card p-5 sm:p-6 animate-fade-up stagger-2">
          <span className="text-xs uppercase tracking-wider font-semibold block mb-4 sm:mb-5" style={{ color: 'var(--color-rose)', letterSpacing: '0.08em' }}>Rota</span>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink-soft)' }}>Origem</label>
              <AirportSearch value={origin} onChange={setOrigin} placeholder="De onde voce sai?" />
            </div>
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-rose-wash)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink-soft)' }}>Destino</label>
              <AirportSearch value={destination} onChange={setDestination} placeholder="Para onde voce vai?" />
            </div>
          </div>
        </div>

        <div className="card p-5 sm:p-6 animate-fade-up stagger-3">
          <span className="text-xs uppercase tracking-wider font-semibold block mb-4 sm:mb-5" style={{ color: 'var(--color-rose)', letterSpacing: '0.08em' }}>Datas</span>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink-soft)' }}>Ida</label>
              <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink-soft)' }}>Volta</label>
              <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} min={departDate || new Date().toISOString().split('T')[0]} className="input-field" />
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>Vazio = somente ida</p>
            </div>
          </div>
        </div>

        <div className="card p-5 sm:p-6 animate-fade-up stagger-4">
          <span className="text-xs uppercase tracking-wider font-semibold block mb-4 sm:mb-5" style={{ color: 'var(--color-rose)', letterSpacing: '0.08em' }}>Preco Alvo (R$)</span>
          <div>
            <input type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="3200" min="1" step="1" className="input-field font-display text-xl" />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>Total para {passengers} passageiro{passengers > 1 ? 's' : ''}. Voce sera notificado quando o preco atingir esse valor.</p>
        </div>

        <div className="card p-5 sm:p-6 animate-fade-up stagger-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-ink-soft)' }}>Classe</label>
              <select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)} className="input-field">
                {Object.entries(cabinLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-ink-soft)' }}>Passageiros</label>
              <select value={passengers} onChange={(e) => setPassengers(parseInt(e.target.value))} className="input-field">
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="animate-fade-up stagger-6 pb-4">
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-3 text-base py-4">
            {loading ? (<><div className="w-5 h-5 spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Buscando precos...</>) : 'Criar Alerta'}
          </button>
        </div>
      </form>
    </div>
  );
}
