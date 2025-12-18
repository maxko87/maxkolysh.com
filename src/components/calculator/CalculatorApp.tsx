import { CalculatorProvider } from '../../context/CalculatorContext';
import { useUrlState } from '../../hooks/useUrlState';
import Sidebar from './layout/Sidebar';
import MainContent from './layout/MainContent';

function CalculatorInner() {
  useUrlState(); // Sync state with URL hash

  return (
    <div>
      <Sidebar />
      <MainContent />
    </div>
  );
}

function CalculatorApp() {
  return (
    <CalculatorProvider>
      <CalculatorInner />
    </CalculatorProvider>
  );
}

export default CalculatorApp;
