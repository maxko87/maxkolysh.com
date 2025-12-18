import { useCalculator } from '../../../hooks/useCalculator';
import { createDefaultFund } from '../../../types/calculator';
import FundCard from '../fund/FundCard';

function Sidebar() {
  const { state, dispatch } = useCalculator();

  const handleAddFund = () => {
    const fundName = `Fund ${String.fromCharCode(65 + state.funds.length)}`;
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
      <h1>Fund Carry Calculator</h1>

      <div className="section">
        {state.funds.map((fund, index) => (
          <FundCard key={fund.id} fund={fund} index={index} />
        ))}

        <button className="btn btn-primary" onClick={handleAddFund}>
          + Add Fund
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
