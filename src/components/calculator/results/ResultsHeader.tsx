import { compressState } from '../../../utils/stateCompression';
import { useCalculator } from '../../../hooks/useCalculator';
import { useState } from 'react';

function ResultsHeader() {
  const { state } = useCalculator();
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

  return (
    <div className="results-header">
      <h2>Total Projected Returns (All Funds)</h2>
      <button className="btn btn-share" onClick={handleShare}>
        📋 Share
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
