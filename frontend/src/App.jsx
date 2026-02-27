import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Compass } from 'lucide-react';
import NotificationBadge from './components/NotificationBadge';
import Dashboard from './pages/Dashboard';
import CreateAlert from './pages/CreateAlert';
import AlertDetail from './pages/AlertDetail';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: 'rgba(245, 240, 232, 0.85)' }}>
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45 duration-500" style={{ background: 'var(--color-terracotta)' }}>
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight" style={{ color: 'var(--color-ink)' }}>
                A Outra Jornada
              </span>
            </a>
            <NotificationBadge />
          </div>
          <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, var(--color-sand-dark), transparent)' }} />
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateAlert />} />
            <Route path="/alerts/:id" element={<AlertDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
