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
    <div className="calculator-sidebar w-[380px] min-w-[320px] max-w-[420px] bg-white border-r border-gray-200 overflow-y-auto p-6 shadow-md">
      <h1 className="calculator-title text-2xl font-bold mb-6">Fund Carry Calculator</h1>

      <div className="space-y-4">
        {state.funds.map((fund, index) => (
          <FundCard key={fund.id} fund={fund} index={index} />
        ))}

        <button
          onClick={handleAddFund}
          className="calc-btn calc-btn-primary w-full py-3 px-4 text-white rounded-lg font-medium"
        >
          + Add Fund
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
