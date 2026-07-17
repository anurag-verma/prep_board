import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import CorruptDataNotice from './components/layout/CorruptDataNotice';
import ThemeEffect from './components/layout/ThemeEffect';
import TopBar from './components/layout/TopBar';
import BoardPage from './pages/BoardPage';
import QuestionsPage from './pages/QuestionsPage';

const StatsPage = lazy(() => import('./pages/StatsPage'));

function App() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <ThemeEffect />
      <TopBar />
      <CorruptDataNotice />
      <main>
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route
            path="/stats"
            element={
              <Suspense fallback={<div className="p-6 text-muted">Loading stats…</div>}>
                <StatsPage />
              </Suspense>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
