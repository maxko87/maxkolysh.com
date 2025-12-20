import { CalculatorProvider } from '../../context/CalculatorContext';
import { useUrlState } from '../../hooks/useUrlState';
import Sidebar from './layout/Sidebar';
import MainContent from './layout/MainContent';

function CalculatorInner() {
  useUrlState(); // Sync state with URL hash

  return (
    <div className="app-layout">
      <Sidebar />
      <MainContent />
      <div style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '13px',
        color: '#94a3b8',
        fontStyle: 'italic',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        Made with ❤️ by Max Kolysh
      </div>
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
