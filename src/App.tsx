import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import CalculatorPage from './pages/CalculatorPage';
import VCsHateRecruitingPage from './pages/blog/VCsHateRecruitingPage';
import RequestIntrosPage from './pages/blog/RequestIntrosPage';
import LearnedLeaguePage from './pages/blog/LearnedLeaguePage';
import StartupNamesPage from './pages/blog/StartupNamesPage';
import TweetLibsAdminPage from './pages/TweetLibsAdminPage';
import TweetLibsPage from './pages/TweetLibsPage';
import ParkingPage from './pages/ParkingPage';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Max Kolysh',
  '/carry-calc': 'Carry Calculator — Max Kolysh',
  '/why-vcs-hate-recruiting-startups': 'Why VCs Hate Recruiting Startups — Max Kolysh',
  '/how-to-request-intros': 'How to Request Intros — Max Kolysh',
  '/learn': 'Learned League — Max Kolysh',
  '/startup-names': 'Startup Names — Max Kolysh',
  '/tweetlibs': 'TweetLibs — Max Kolysh',
  '/tweetlibs/admin': 'TweetLibs Admin — Max Kolysh',
  '/parking': 'SF Street Cleaning — Max Kolysh',
};

function PageTitle() {
  const location = useLocation();
  useEffect(() => {
    document.title = PAGE_TITLES[location.pathname] || 'Max Kolysh';
  }, [location.pathname]);
  return null;
}

// Redirect component that preserves search params and hash state
function RedirectWithHash({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <PageTitle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/carry-calc" element={<CalculatorPage />} />
        {/* Backwards compatibility redirects */}
        <Route path="/gp-comp" element={<RedirectWithHash to="/carry-calc" />} />
        <Route path="/fund-gp-comp-calculator" element={<RedirectWithHash to="/carry-calc" />} />
        <Route path="/why-vcs-hate-recruiting-startups" element={<VCsHateRecruitingPage />} />
        <Route path="/how-to-request-intros" element={<RequestIntrosPage />} />
        <Route path="/learn" element={<LearnedLeaguePage />} />
        <Route path="/startup-names" element={<StartupNamesPage />} />
        <Route path="/tweetlibs" element={<TweetLibsPage />} />
        <Route path="/tweetlibs/admin" element={<TweetLibsAdminPage />} />
        <Route path="/parking" element={<ParkingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
