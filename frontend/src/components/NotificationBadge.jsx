import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NotificationBadge() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const { data } = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    }
  }

  async function handleClick(notif) {
    await api.markNotificationRead(notif.id);
    setIsOpen(false);
    loadNotifications();
    navigate(`/alerts/${notif.alert_id}`);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/60"
      >
        <Bell className="w-5 h-5" style={{ color: 'var(--color-ink-soft)' }} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold" style={{ background: 'var(--color-rose)' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 dropdown animate-scale-in z-50">
          <div className="p-4 font-display" style={{ color: 'var(--color-ink)', borderBottom: '1px solid var(--color-border-light)' }}>
            Notificacoes
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-sm text-center" style={{ color: 'var(--color-muted)' }}>Nenhuma notificacao</div>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} onClick={() => handleClick(n)} className="dropdown-item">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {n.origin_display_code || n.origin_name} → {n.dest_display_code || n.dest_name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-ink-soft)' }}>{n.message}</p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>{new Date(n.created_at).toLocaleString('pt-BR')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
