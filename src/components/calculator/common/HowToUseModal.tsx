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
              If you're a general partner (or planning to become a GP) in venture or private equity, this calculator lets you fully model your carry compensation.
            </p>
            <p>
              Configure fund parameters, model multiple funds at once, and deep dive into the math behind your carry returns.
            </p>
          </section>

          <section className="modal-section">
            <h3>Getting Started</h3>
            <ul className="simple-list">
              <li>Set up your fund(s) on the left sidebar. The returns table will automatically update to show how much carry a GP would earn under your assumptions.</li>
              <li>Each row in the returns table represents how many years you worked at the fund. Each column shows how far into the future you want to model carry. This lets you model scenarios like working at a fund for 5 years and earning carry for another 5 years into the future (as is typical).</li>
              <li>Create multiple return scenarios in each fund, and select which one you're modeling using the dropdowns above the returns table.</li>
              <li>Click each cell in the table to explore the math in "Simple" or "Advanced" mode.</li>
            </ul>
          </section>

          <section className="modal-section">
            <h3>Tips</h3>
            <ul className="simple-list">
              <li>There are two ways to model multiple funds:
                <ul>
                  <li>For recurring funds of similar size, select "Raise continuously" and set the fund cycle time to the number of years between raises.</li>
                  <li>If funds aren't raised regularly, or you want to model two different funds at once, use "+ Add Fund" for each one.</li>
                </ul>
              </li>
              <li>To see the total carry for the fund instead of a single GP, you can set "Per GP Carry" to 100%.</li>
              <li>Use "+ Preset" to add funds modeled off a typical seed/growth/late-stage fund.</li>
            </ul>
          </section>

          <section className="modal-section">
            <h3>Historic Funds</h3>
            <ul className="simple-list">
              <li>We've added return profiles for 561 historic funds, including Apollo Fund X, Blackstone Capital Partners VII, and Carlyle Partners VII. You can explore these by clicking "+ Historic".</li>
              <li>Note: Fund sizes are estimated from public pension commitments (e.g. CalPERS has ~$500B AUM and typically commits 6-20% of fund size depending on scale, OPERS has ~$100B AUM and commits 3-18%).</li>
            </ul>
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
