import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CalculatorPage from './pages/CalculatorPage';
import VCsHateRecruitingPage from './pages/VCsHateRecruitingPage';
import RequestIntrosPage from './pages/RequestIntrosPage';
import LearnedLeaguePage from './pages/LearnedLeaguePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/fund-carry-calculator" element={<CalculatorPage />} />
        <Route path="/why-vcs-hate-recruiting-startups" element={<VCsHateRecruitingPage />} />
        <Route path="/how-to-request-intros" element={<RequestIntrosPage />} />
        <Route path="/learn" element={<LearnedLeaguePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
