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
    <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800">
        Total Projected Returns (All Funds)
      </h2>
      <button
        onClick={handleShare}
        className="calc-btn calc-btn-share px-4 py-2 text-white rounded-lg flex items-center gap-2"
      >
        <span>📋</span>
        <span>Share</span>
      </button>

      {showToast && (
        <div className="calc-toast">
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}

export default ResultsHeader;
