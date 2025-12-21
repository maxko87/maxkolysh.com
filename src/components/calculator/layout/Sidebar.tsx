import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCalculator } from '../../../hooks/useCalculator';
import { createDefaultFund } from '../../../types/calculator';
import FundCard from '../fund/FundCard';
import HowToUseModal from '../common/HowToUseModal';
import FundTypeSelector from '../common/FundTypeSelector';
import PresetSelector from '../common/PresetSelector';

function Sidebar() {
  const { state, dispatch } = useCalculator();
  const [showModal, setShowModal] = useState(false);

  const handleAddFund = () => {
    // Find the highest existing fund number to avoid duplicates
    const existingNumbers = state.funds.map(f => {
      const match = f.name.match(/^Fund (\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const fundNumber = maxNumber + 1;
    const fundName = `Fund ${fundNumber}`;
    const templateFund = state.funds[0];
    const newFund = createDefaultFund(
      state.funds.length,
      fundName,
      templateFund
    );
    dispatch({ type: 'ADD_FUND', payload: newFund });
  };

  return (
    <div className="sidebar">
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{
          marginBottom: 'var(--spacing-xs)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '1.9em',
          fontWeight: 800,
          letterSpacing: '-0.8px',
          lineHeight: 1.2
        }}>
          Fund GP Comp Calculator
        </h1>
        <div style={{
          fontSize: '13px',
          color: '#94a3b8',
          marginBottom: 'var(--spacing-md)'
        }}>
          <div>Made with 🤖 by <Link to="/" style={{ color: 'inherit', textDecoration: 'underline' }}>Max Kolysh</Link>.</div>
          <div><a href="#" onClick={(e) => { e.preventDefault(); setShowModal(true); }} style={{ color: 'inherit', textDecoration: 'underline' }}>Read the quickstart</a> or <a href="mailto:maxkolysh@gmail.com?subject=Fund GP Comp Calculator Feedback" style={{ color: 'inherit', textDecoration: 'underline' }}>send feedback</a>.</div>
        </div>
      </div>

      <div className="section">
        {state.funds.map((fund, index) => (
          <FundCard key={fund.id} fund={fund} index={index} />
        ))}

        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleAddFund}>
            + Add Fund
          </button>
          <FundTypeSelector />
          <PresetSelector />
        </div>
      </div>

      <HowToUseModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

export default Sidebar;
