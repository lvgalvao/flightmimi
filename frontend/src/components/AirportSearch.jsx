import { useState, useRef, useEffect } from 'react';
import { Search, Plane, Building2 } from 'lucide-react';
import api from '../services/api';

export default function AirportSearch({ value, onChange, placeholder }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.searchAirports(val);
        const items = data?.data || [];
        setResults(items);
        setIsOpen(items.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(item) {
    const flightParams = item.navigation?.relevantFlightParams;
    const selected = {
      entityId: flightParams?.entityId || item.navigation?.entityId || item.entityId,
      skyId: flightParams?.skyId || item.presentation?.skyId || '',
      name: item.presentation?.suggestionTitle || item.navigation?.localizedName || item.name,
      displayCode: flightParams?.skyId || '',
      entityType: item.navigation?.entityType || 'AIRPORT',
    };
    onChange(selected);
    setQuery(selected.name + (selected.displayCode ? ` (${selected.displayCode})` : ''));
    setIsOpen(false);
  }

  function displayItem(item) {
    const title = item.presentation?.suggestionTitle || item.name || '';
    const subtitle = item.presentation?.subtitle || item.city || item.country || '';
    const type = item.navigation?.entityType || item.entityType || 'AIRPORT';
    const isCity = type === 'CITY';
    return { title, subtitle, isCity };
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder || 'Digite cidade ou aeroporto...'}
          className="input-field pl-11"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 spinner" />
          </div>
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-50 w-full mt-2 dropdown animate-scale-in max-h-64 overflow-y-auto">
          {results.map((item, i) => {
            const { title, subtitle, isCity } = displayItem(item);
            return (
              <li key={i} onClick={() => handleSelect(item)} className="dropdown-item flex items-center gap-3">
                {isCity ? (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-blue-wash)' }}>
                    <Building2 className="w-4 h-4" style={{ color: 'var(--color-sky)' }} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-blue-wash)' }}>
                    <Plane className="w-4 h-4" style={{ color: 'var(--color-blue)' }} />
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--color-ink)' }}>{title}</div>
                  {subtitle && <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{subtitle}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
