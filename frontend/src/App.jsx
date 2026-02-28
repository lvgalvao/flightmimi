import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Heart } from 'lucide-react';
import NotificationBadge from './components/NotificationBadge';
import Dashboard from './pages/Dashboard';
import CreateAlert from './pages/CreateAlert';
import AlertDetail from './pages/AlertDetail';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen min-h-[100dvh]">
        <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: 'rgba(253, 242, 244, 0.85)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-300" style={{ background: 'var(--color-rose)' }}>
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="white" />
              </div>
              <span className="font-display text-lg sm:text-xl" style={{ color: 'var(--color-ink)' }}>
                A Outra Jornada
              </span>
            </a>
            <NotificationBadge />
          </div>
          <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, var(--color-border), transparent)' }} />
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
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
