import { useState } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import { createDefaultFund } from '../../../types/calculator';
import FundCard from '../fund/FundCard';
import HowToUseModal from '../common/HowToUseModal';
import PresetSelector from '../common/PresetSelector';

function Sidebar() {
  const { state, dispatch } = useCalculator();
  const [showModal, setShowModal] = useState(false);

  const handleAddFund = () => {
    const fundName = state.funds.length === 0 ? 'My Fund' : `My Fund ${state.funds.length + 1}`;
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
        <h1 style={{ marginBottom: 'var(--spacing-md)' }}>Fund GP Comp Calculator</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            How to Use
          </button>
          <PresetSelector />
        </div>
      </div>

      <div className="section">
        {state.funds.map((fund, index) => (
          <FundCard key={fund.id} fund={fund} index={index} />
        ))}

        <button className="btn btn-primary" onClick={handleAddFund}>
          + Add Fund
        </button>
      </div>

      <HowToUseModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

export default Sidebar;
