import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function HowToUseModal({ isOpen, onClose }: HowToUseModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>What is this?</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <p>
              If you're a general partner (or planning to become a GP) in venture or private equity, this calculator lets you fully model your carry compensation. Configure fund parameters, add multiple funds at once, model return scenarios, and see your comp projections over 20 years.
            </p>
          </section>

          <section className="modal-section">
            <h3>Getting Started</h3>
            <ul className="simple-list">
              <li>Set up your base fund (size, carry %, per-GP allocation)</li>
              <li>Add 2-3 return scenarios (base/up/down case)</li>
              <li>Click any cell in the results table for calculation breakdown</li>
              <li>Share URL to save your configuration</li>
            </ul>
          </section>

          <section className="modal-section">
            <h3>Multiple Funds</h3>
            <p>
              Two ways to model multiple funds: check "Raise continuously" and set your cycle time (e.g., every 2 years), or manually add funds with "+ Add Fund" for custom timing.
            </p>
          </section>

          <section className="modal-section">
            <h3>Historic Fund Presets</h3>
            <p>
              Select from real historic funds in the preset dropdown (Apollo IX, KKR XIII, etc). Fund sizes estimated from public pension commitments: CalPERS (~$500B AUM) typically commits 6-20% of fund size depending on scale, OPERS (~$100B AUM) commits 3-18%. These are approximations for modeling purposes.
            </p>
          </section>

        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Got it!</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default HowToUseModal;
