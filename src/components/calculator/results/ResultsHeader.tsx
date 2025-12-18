import { compressState } from '../../../utils/stateCompression';
import { useCalculator } from '../../../hooks/useCalculator';
import { formatCurrency } from '../../../utils/formatCurrency';
import { useState } from 'react';

function ResultsHeader() {
  const { state, calculations } = useCalculator();
  const [showToast, setShowToast] = useState(false);

  const handleShare = () => {
    const url = window.location.origin + window.location.pathname + '#' + compressState(state);
    navigator.clipboard.writeText(url).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  // Get the value for 5 years worked and 11 years from today (indices [4][10])
  const fiveYearEleven = calculations[4]?.[10];
  const fiveYearValue = fiveYearEleven?.total || 0;

  return (
    <div className="results-header">
      <div className="tooltip-label" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
        If you vest into these funds for 5 years starting today, in 11 years you'll have {formatCurrency(fiveYearValue)}
      </div>
      <button className="btn btn-share" onClick={handleShare}>
        Share
      </button>

      {showToast && (
        <div className="toast">
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}

export default ResultsHeader;
