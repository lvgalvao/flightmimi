import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Target, Users, Armchair } from 'lucide-react';
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

    if (!origin || !destination) {
      setError('Selecione origem e destino');
      return;
    }
    if (!departDate) {
      setError('Selecione a data de ida');
      return;
    }
    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      setError('Informe um preco alvo valido');
      return;
    }

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

  const cabinLabels = {
    economy: 'Economica',
    premium_economy: 'Premium Economy',
    business: 'Business',
    first: 'Primeira Classe',
  };

  return (
    <div className="max-w-xl mx-auto">
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

      <div className="animate-fade-up stagger-1">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--color-ink)' }}>
          Nova jornada
        </h1>
        <p className="mb-8" style={{ color: 'var(--color-faded)' }}>
          Defina sua rota e o preco que voce espera pagar
        </p>
      </div>

      {error && (
        <div
          className="px-5 py-4 rounded-xl mb-6 text-sm font-medium animate-scale-in"
          style={{ background: '#fef2f2', color: '#b45555', border: '1px solid #fecaca' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Route */}
        <div className="card p-6 animate-fade-up stagger-2">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-4 h-4" style={{ color: 'var(--color-terracotta)' }} />
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-terracotta)', letterSpacing: '0.08em' }}>
              Rota
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink-soft)' }}>Origem</label>
              <AirportSearch value={origin} onChange={setOrigin} placeholder="De onde voce sai?" />
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-sand)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-faded)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink-soft)' }}>Destino</label>
              <AirportSearch value={destination} onChange={setDestination} placeholder="Para onde voce vai?" />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="card p-6 animate-fade-up stagger-3">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-4 h-4" style={{ color: 'var(--color-terracotta)' }} />
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-terracotta)', letterSpacing: '0.08em' }}>
              Datas
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink-soft)' }}>Ida</label>
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink-soft)' }}>Volta</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={departDate || new Date().toISOString().split('T')[0]}
                className="input-field"
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-faded)' }}>Vazio = somente ida</p>
            </div>
          </div>
        </div>

        {/* Price Target */}
        <div className="card p-6 animate-fade-up stagger-4">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4" style={{ color: 'var(--color-terracotta)' }} />
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-terracotta)', letterSpacing: '0.08em' }}>
              Preco Alvo
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display font-bold" style={{ color: 'var(--color-faded)' }}>R$</span>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="3.200"
              min="1"
              step="1"
              className="input-field pl-12 font-display text-xl font-bold"
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--color-faded)' }}>
            Total para {passengers} passageiro{passengers > 1 ? 's' : ''}. Voce sera notificado quando o preco atingir esse valor.
          </p>
        </div>

        {/* Options */}
        <div className="card p-6 animate-fade-up stagger-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Armchair className="w-3.5 h-3.5" style={{ color: 'var(--color-faded)' }} />
                <label className="text-sm font-medium" style={{ color: 'var(--color-ink-soft)' }}>Classe</label>
              </div>
              <select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)} className="input-field">
                {Object.entries(cabinLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-3.5 h-3.5" style={{ color: 'var(--color-faded)' }} />
                <label className="text-sm font-medium" style={{ color: 'var(--color-ink-soft)' }}>Passageiros</label>
              </div>
              <select
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="input-field"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="animate-fade-up stagger-6">
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-3 text-base py-4">
            {loading ? (
              <>
                <div className="w-5 h-5 spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                Buscando precos...
              </>
            ) : (
              'Criar Alerta'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
