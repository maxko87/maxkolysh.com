import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CalculatorPage from './pages/CalculatorPage';
import VCsHateRecruitingPage from './pages/blog/VCsHateRecruitingPage';
import RequestIntrosPage from './pages/blog/RequestIntrosPage';
import LearnedLeaguePage from './pages/blog/LearnedLeaguePage';

// Redirect component that preserves search params and hash state
function RedirectWithHash({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gp-comp" element={<CalculatorPage />} />
        {/* Backwards compatibility redirect */}
        <Route path="/fund-gp-comp-calculator" element={<RedirectWithHash to="/gp-comp" />} />
        <Route path="/why-vcs-hate-recruiting-startups" element={<VCsHateRecruitingPage />} />
        <Route path="/how-to-request-intros" element={<RequestIntrosPage />} />
        <Route path="/learn" element={<LearnedLeaguePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
