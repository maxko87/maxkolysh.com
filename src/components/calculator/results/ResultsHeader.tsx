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
    <div>
      <h2>Total Projected Returns (All Funds)</h2>
      <button onClick={handleShare}>
        📋 Share
      </button>

      {showToast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#16a34a', color: 'white', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 600, fontSize: '14px', zIndex: 1000 }}>
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}

export default ResultsHeader;
