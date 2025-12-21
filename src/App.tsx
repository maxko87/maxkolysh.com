import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CalculatorPage from './pages/CalculatorPage';
import VCsHateRecruitingPage from './pages/blog/VCsHateRecruitingPage';
import RequestIntrosPage from './pages/blog/RequestIntrosPage';
import LearnedLeaguePage from './pages/blog/LearnedLeaguePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/fund-gp-comp-calculator" element={<CalculatorPage />} />
        <Route path="/why-vcs-hate-recruiting-startups" element={<VCsHateRecruitingPage />} />
        <Route path="/how-to-request-intros" element={<RequestIntrosPage />} />
        <Route path="/learn" element={<LearnedLeaguePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
