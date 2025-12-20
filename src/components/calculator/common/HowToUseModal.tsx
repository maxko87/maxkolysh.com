import { useEffect } from 'react';

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>How to Use the GP Comp Calculator</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <p>
              See how much a general partner can make from venture capital funds over time.
              This model accounts for fund structure, hurdle rates, vesting schedules, and multiple return scenarios.
            </p>
          </section>

          <section className="modal-section">
            <h3>Key Terms</h3>
            <ul className="simple-list">
              <li><strong>Carried Interest (Carry)</strong> - The share of a fund's profits that GPs receive as performance-based compensation, typically 20%</li>
              <li><strong>Fund Size</strong> - Total capital committed to the fund in millions of dollars</li>
              <li><strong>Fund Cycle</strong> - Time between raising consecutive funds, typically 2-3 years</li>
              <li><strong>Fund Life</strong> - Duration of the fund before full realization, typically 10 years</li>
              <li><strong>Hurdles</strong> - Performance thresholds that affect carry percentage at different return levels</li>
              <li><strong>Gross Return Multiple</strong> - Total return on the fund before fees (e.g., 3x means $300M returned on a $100M fund)</li>
              <li><strong>Vesting Period</strong> - Time required for GPs to fully earn their carry allocation, typically 4 years</li>
              <li><strong>Cliff</strong> - Minimum time before any carry vests, typically 1 year</li>
              <li><strong>Realization Curve</strong> - Pattern of when fund returns are distributed over time</li>
            </ul>
          </section>

          <section className="modal-section">
            <h3>Quick Start</h3>
            <ul className="simple-list">
              <li>Enter your fund parameters (size, carry %, fees, etc.)</li>
              <li>Add return scenarios to model different outcomes</li>
              <li>Adjust vesting terms to match your carry allocation</li>
              <li>Add multiple funds to see how compensation compounds over time</li>
              <li>Use the Share button to save and share your model</li>
            </ul>
          </section>

          <section className="modal-section">
            <h3>Modeling Multiple Funds</h3>
            <ul className="simple-list">
              <li><strong>Raise this fund continuously</strong> - Check this box and set your Fund Cycle (e.g., 2 years) to automatically model raising new funds at regular intervals. This is the recommended approach for most scenarios.</li>
              <li><strong>+ Add Fund</strong> - Use this button to manually create separate funds for each fundraise. This gives you full control over the timing and parameters of each fund.</li>
            </ul>
          </section>

          <section className="modal-section">
            <h3>Note on Historic Fund Data</h3>
            <p style={{ fontSize: '0.9em', color: '#64748b' }}>
              The historic fund sizes in the preset dropdown are estimates based on CalPERS's public commitment data.
              Since pension funds typically don't disclose total fund sizes, we estimate them by assuming CalPERS commits:
            </p>
            <ul className="simple-list" style={{ fontSize: '0.9em', color: '#64748b' }}>
              <li>6-7% of mega-funds (commitments &gt;$500M)</li>
              <li>12-13% of large funds (commitments $200-500M)</li>
              <li>~20% of mid-market funds (commitments &lt;$200M)</li>
            </ul>
            <p style={{ fontSize: '0.9em', color: '#64748b' }}>
              These are approximations for modeling purposes. Actual fund sizes may vary.
            </p>
          </section>

        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Got it!</button>
        </div>
      </div>
    </div>
  );
}

export default HowToUseModal;
