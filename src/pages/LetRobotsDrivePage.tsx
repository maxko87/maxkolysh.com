import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

// Constants
const DEATHS_PER_YEAR = 39254;
const INJURIES_PER_YEAR = 2422195;
const ECONOMIC_COST = 340_000_000_000;
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
const DEATHS_PER_SECOND = DEATHS_PER_YEAR / SECONDS_PER_YEAR;
const INJURIES_PER_SECOND = INJURIES_PER_YEAR / SECONDS_PER_YEAR;
const COST_PER_SECOND = ECONOMIC_COST / SECONDS_PER_YEAR;

function Cite({ nums }: { nums: number[] }) {
  return (
    <span className="lrd-cite">
      [{nums.map((n, i) => (
        <span key={n}><a href={`#source-${n}`}>{n}</a>{i < nums.length - 1 ? ',' : ''}</span>
      ))}]
    </span>
  );
}

function LetRobotsDrivePage() {
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());
  const [baseSeconds] = useState(() => {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
  });
  const [copiedLink, setCopiedLink] = useState(false);

  // Live counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime.current) / 1000);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // OG meta tags
  useEffect(() => {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const twitterCard = document.querySelector('meta[name="twitter:card"]');

    const origTitle = ogTitle?.getAttribute('content') || '';
    const origDesc = ogDesc?.getAttribute('content') || '';
    const origUrl = ogUrl?.getAttribute('content') || '';
    const origCard = twitterCard?.getAttribute('content') || '';

    ogTitle?.setAttribute('content', 'Let Robots Drive — The Case for Autonomous Vehicles');
    ogDesc?.setAttribute('content', 'Someone died on an American road 13.4 minutes ago. Here\'s why we need to let robots drive.');
    ogUrl?.setAttribute('content', 'https://maxkolysh.com/let-robots-drive');
    twitterCard?.setAttribute('content', 'summary_large_image');

    return () => {
      ogTitle?.setAttribute('content', origTitle);
      ogDesc?.setAttribute('content', origDesc);
      ogUrl?.setAttribute('content', origUrl);
      twitterCard?.setAttribute('content', origCard);
    };
  }, []);

  const totalSecs = baseSeconds + elapsed;
  const deaths = (totalSecs * DEATHS_PER_SECOND).toFixed(2);
  const injuries = (totalSecs * INJURIES_PER_SECOND).toFixed(2);
  const cost = Math.floor(totalSecs * COST_PER_SECOND).toLocaleString('en-US');

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://maxkolysh.com/let-robots-drive').then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent('Someone dies on an American road every 13.4 minutes. Self-driving cars could prevent 92% of serious injury crashes. The data is in.\n\nhttps://maxkolysh.com/let-robots-drive');
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <div className="lrd-page">
      {/* HERO */}
      <section className="lrd-hero">
        <div className="lrd-hero-inner">
          <p className="lrd-hero-subtitle">So far today</p>
          <div className="lrd-counter-row">
            <div className="lrd-counter-block">
              <span className="lrd-counter-num lrd-red">{deaths}</span>
              <span className="lrd-counter-label">deaths on American roads<Cite nums={[1, 2]} /></span>
            </div>
            <div className="lrd-counter-block">
              <span className="lrd-counter-num lrd-red">{injuries}</span>
              <span className="lrd-counter-label">injuries on American roads<Cite nums={[1, 2]} /></span>
            </div>
            <div className="lrd-counter-block">
              <span className="lrd-counter-num lrd-red">${cost}</span>
              <span className="lrd-counter-label">in economic costs<Cite nums={[15]} /></span>
            </div>
          </div>
          <div className="lrd-hero-rates">
            <p>1 death every <span className="lrd-red lrd-bold">13.4 minutes</span>.</p>
            <p>1 injury every <span className="lrd-red lrd-bold">13 seconds</span>.</p>
          </div>
          <div className="lrd-scroll-hint" onClick={() => document.getElementById('lrd-robots-dont')?.scrollIntoView({ behavior: 'smooth' })} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('lrd-robots-dont')?.scrollIntoView({ behavior: 'smooth' }); }}>↓</div>
        </div>
      </section>

      {/* WHAT HUMANS DO WRONG */}
      <section id="lrd-robots-dont" className="lrd-section">
        <h2 className="lrd-section-title">Robots don't drink, text, speed, or get tired</h2>
        <div className="lrd-cards">
          <div className="lrd-card">
            <div className="lrd-card-icon">🍺</div>
            <h3 className="lrd-card-title">Robots don't drink</h3>
            <p className="lrd-card-stat"><span className="lrd-red">11,904</span> alcohol-impaired driving deaths in 2024<Cite nums={[6]} /></p>
            <p className="lrd-card-stat lrd-card-stat-spacer">&nbsp;</p>
          </div>
          <div className="lrd-card">
            <div className="lrd-card-icon">📱</div>
            <h3 className="lrd-card-title">Robots don't text</h3>
            <p className="lrd-card-stat"><span className="lrd-red">3,208</span> distracted driving deaths in 2024<Cite nums={[7]} /></p>
            <p className="lrd-card-stat"><span className="lrd-red">315,167</span> injuries in 2024<Cite nums={[7]} /></p>
          </div>
          <div className="lrd-card">
            <div className="lrd-card-icon">😴</div>
            <h3 className="lrd-card-title">Robots don't speed or get tired</h3>
            <p className="lrd-card-stat"><span className="lrd-red">644</span> drowsy driving deaths in 2024<Cite nums={[8]} /></p>
            <p className="lrd-card-stat"><span className="lrd-red">11,288</span> speeding deaths in 2024<Cite nums={[9]} /></p>
          </div>
        </div>
      </section>

      {/* THE EVIDENCE */}
      <section className="lrd-section lrd-section-dark">
        <h2 className="lrd-section-title">Robots drive better</h2>

        <h3 className="lrd-subsection-title">Per million miles driven</h3>
        <div className="lrd-bars">
          <BarComparison label="Serious-injury-or-worse crashes" humanVal={0.22} waymoVal={0.02} reduction="92%" cite={<Cite nums={[3, 4]} />} />
          <BarComparison label="Injury-causing crashes" humanVal={3.90} waymoVal={0.71} reduction="82%" cite={<Cite nums={[3, 4]} />} />
          <BarComparison label="Airbag deployments" humanVal={1.12} waymoVal={0.05} reduction="96%" cite={<Cite nums={[3, 4]} />} />
        </div>

        <p className="lrd-section-sub" style={{ fontSize: '0.85rem', opacity: 0.75, marginTop: '1.5rem', borderLeft: '3px solid var(--lrd-green, #4ade80)', paddingLeft: '1rem' }}>Independently validated: Swiss Re — one of the world's largest reinsurers — found Waymo vehicles had 88% fewer bodily injury claims per mile than the human benchmark.<Cite nums={[16]} /></p>

        <h3 className="lrd-subsection-title">Waymo vs. human drivers: who's safer for people outside the car?</h3>
        <div className="lrd-vuln-grid">
          <VulnStat label="pedestrian injury crashes" value="92%" />
          <VulnStat label="cyclist injury crashes" value="85%" />
          <VulnStat label="intersection injury crashes" value="96%" />
          <VulnStat label="single-vehicle injury crashes" value="96%" />
        </div>
        <p className="lrd-section-sub" style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '2rem' }}>Waymo's rider-only safety record through December 2025, compared to human drivers mile-for-mile<Cite nums={[4]} /></p>
      </section>

      <section className="lrd-section">
        <h2 className="lrd-section-title">What if every car was a Waymo?</h2>

        <div className="lrd-scale-list">
          <ScaleRow pct="1%" deaths="362" note={null} />
          <ScaleRow pct="10%" deaths="3,616" note="More than ALL distracted driving deaths" />
          <ScaleRow pct="25%" deaths="9,039" note="More than ALL pedestrian deaths" />
          <ScaleRow pct="50%" deaths="18,078" note="More than ALL drunk driving deaths" />
          <ScaleRow pct="100%" deaths="36,157" note="~1 death prevented every 14.5 minutes" />
        </div>
        <p className="lrd-section-sub" style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '2rem' }}>At Waymo's current safety record (92% fewer serious crashes)<Cite nums={[1, 4]} /></p>
      </section>

      {/* IF WAYMO WERE A DRUG */}
      <section className="lrd-section lrd-section-dark">
        <h2 className="lrd-section-title">If Waymo were a drug</h2>
        <p className="lrd-section-sub">US lives saved per year, by intervention</p>

        <div className="lrd-drug-bars">
          <DrugBar label="Blood pressure medication" lives="~80,000" width={100} source="CDC / Farley et al." />
          <DrugBar label="Statins" lives="~50,000" width={62} source="AHA modeling" />
          <DrugBar label="Childhood vaccines" lives="~37,600" width={47} source="CDC MMWR 2024" />
          <DrugBar label="Waymo at full deployment (projected)" lives="~36,000" width={45} highlight source="Waymo safety data + NHTSA crash stats" cite={<Cite nums={[3, 1]} />} />
          <DrugBar label="Seat belts" lives="~15,000" width={19} source="NHTSA" />
          <DrugBar label="Flu vaccine" lives="~7,000" width={9} source="CDC seasonal estimates" />
        </div>
      </section>

      {/* CTA / FOOTER */}
      <section className="lrd-cta">
        <p className="lrd-cta-line">Every day we delay costs lives.</p>
        <h2 className="lrd-cta-headline">Let robots drive.</h2>
        <div className="lrd-cta-buttons">
          <button className="lrd-btn lrd-btn-twitter" onClick={handleTwitterShare}>Share on Twitter</button>
          <button className="lrd-btn lrd-btn-copy" onClick={handleCopyLink}>
            {copiedLink ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        <p className="lrd-cta-author">Compiled by <Link to="/" className="lrd-link">Max Kolysh</Link></p>
      </section>

      {/* FOOTER: SOURCES + CAVEATS */}
      <section className="lrd-sources" style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
        <details id="lrd-sources">
          <summary className="lrd-sources-toggle">Sources & References</summary>
          <ol className="lrd-sources-list">
            <li id="source-1"><a href="https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/813774" target="_blank" rel="noopener noreferrer">NHTSA 2024 Annual Motor Vehicle Crash Report</a></li>
            <li id="source-2"><a href="https://www.fhwa.dot.gov/policyinformation/travel_monitoring/tvt.cfm" target="_blank" rel="noopener noreferrer">FHWA Traffic Volume Trends (VMT data)</a></li>
            <li id="source-3"><a href="https://waymo.com/safety/impact/" target="_blank" rel="noopener noreferrer">Waymo Safety Impact</a></li>
            <li id="source-4"><a href="https://waymo.com/research/waymos-rider-only-crash-data/" target="_blank" rel="noopener noreferrer">Waymo Rider-Only Crash Data Research</a></li>
            <li id="source-5"><a href="https://waymo.com/research/do-autonomous-vehicles-reduce-or-induce-speeding/" target="_blank" rel="noopener noreferrer">Waymo Speed Research</a></li>
            <li id="source-6"><a href="https://www.nhtsa.gov/risky-driving/drunk-driving" target="_blank" rel="noopener noreferrer">NHTSA — Drunk Driving</a></li>
            <li id="source-7"><a href="https://www.nhtsa.gov/risky-driving/distracted-driving" target="_blank" rel="noopener noreferrer">NHTSA — Distracted Driving</a></li>
            <li id="source-8"><a href="https://www.nhtsa.gov/risky-driving/drowsy-driving" target="_blank" rel="noopener noreferrer">NHTSA — Drowsy Driving</a></li>
            <li id="source-9"><a href="https://www.nhtsa.gov/risky-driving/speeding" target="_blank" rel="noopener noreferrer">NHTSA — Speeding</a></li>
            <li id="source-10"><a href="https://www.iihs.org/topics/advanced-driver-assistance/aeb" target="_blank" rel="noopener noreferrer">IIHS — Automatic Emergency Braking</a></li>
            <li id="source-11"><a href="https://jamanetwork.com/journals/jama/fullarticle/2784800" target="_blank" rel="noopener noreferrer">JAMA — Statin Therapy for Primary Prevention (2022 Review)</a></li>
            <li id="source-12"><a href="https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD004816.pub4/full" target="_blank" rel="noopener noreferrer">Cochrane — Statins for Primary Prevention</a></li>
            <li id="source-13"><a href="https://waymo.com/research/rider-only-ride-hail-safety/" target="_blank" rel="noopener noreferrer">Waymo Ride-Hailing Safety Research</a></li>
            <li id="source-14"><a href="https://www.cdc.gov/transportation-safety/about/cost-of-crash-deaths.html" target="_blank" rel="noopener noreferrer">CDC — Motor Vehicle Crash Deaths Cost</a></li>
            <li id="source-15"><a href="https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/813839" target="_blank" rel="noopener noreferrer">NHTSA — The Economic and Societal Impact of Motor Vehicle Crashes</a></li>
            <li id="source-16"><a href="https://waymo.com/blog/2025/01/swiss-re-independent-validation/" target="_blank" rel="noopener noreferrer">Swiss Re — Independent Validation of Waymo Safety (2025)</a></li>
          </ol>
        </details>
        <details>
          <summary className="lrd-sources-toggle">Caveats</summary>
          <ul className="lrd-caveats-list">
            <li>Waymo's data is strongest for surface streets in its current operating areas (Phoenix, San Francisco, Los Angeles). Highway and rural performance is not yet proven at scale.</li>
            <li>Waymo acknowledges it doesn't yet have enough miles for a fatalities-only statistical significance test.</li>
            <li>Human crash data is underreported — 60% of property-damage crashes and 32% of injury crashes are never reported to police — which actually makes the comparison <em>conservative</em> for autonomy.</li>
            <li>This page uses Waymo's published data. Other AV companies may have different safety profiles.</li>
            <li>Widespread adoption would affect millions of driving jobs (trucking, ride-hailing, delivery). The safety case is overwhelming, but the transition needs to be managed thoughtfully.</li>
          </ul>
        </details>
      </section>
    </div>
  );
}

function BarComparison({ label, humanVal, waymoVal, reduction, cite }: { label: string; humanVal: number; waymoVal: number; reduction: string; cite?: ReactNode }) {
  const humanPct = 100;
  const waymoPct = (waymoVal / humanVal) * 100;
  return (
    <div className="lrd-bar-group">
      <p className="lrd-bar-label">{label}</p>
      <div className="lrd-bar-row">
        <span className="lrd-bar-tag">Human</span>
        <div className="lrd-bar-track">
          <div className="lrd-bar-fill lrd-bar-human" style={{ width: `${humanPct}%` }}></div>
        </div>
        <span className="lrd-bar-val">{humanVal}</span>
      </div>
      <div className="lrd-bar-row">
        <span className="lrd-bar-tag">Waymo</span>
        <div className="lrd-bar-track">
          <div className="lrd-bar-fill lrd-bar-waymo" style={{ width: `${Math.max(waymoPct, 2)}%`, minWidth: '8px' }}></div>
        </div>
        <span className="lrd-bar-val">{waymoVal}</span>
      </div>
      <p className="lrd-bar-reduction"><span className="lrd-green lrd-bold">{reduction} fewer</span>{cite}</p>
    </div>
  );
}

function VulnStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="lrd-vuln-item">
      <span className="lrd-vuln-value lrd-green">{value}</span>
      <span className="lrd-vuln-label">fewer {label}</span>
    </div>
  );
}

function ScaleRow({ pct, deaths, note }: { pct: string; deaths: string; note: string | null }) {
  return (
    <div className="lrd-scale-row">
      <div className="lrd-scale-pct">{pct}</div>
      <div className="lrd-scale-info">
        <span className="lrd-scale-deaths"><span className="lrd-green">{deaths}</span> deaths prevented per year</span>
        {note && <span className="lrd-scale-note">{note}</span>}
      </div>
    </div>
  );
}

function DrugBar({ label, lives, width, highlight, source, cite }: { label: string; lives: string; width: number; highlight?: boolean; source: string; cite?: ReactNode }) {
  return (
    <div className={`lrd-drug-row ${highlight ? 'lrd-drug-highlight' : ''}`}>
      <div className="lrd-drug-info">
        <span className={`lrd-drug-label ${highlight ? 'lrd-green lrd-bold' : ''}`}>{label}{cite}</span>
        <span className={`lrd-drug-lives ${highlight ? 'lrd-green' : ''}`}>{lives}</span>
      </div>
      <div className="lrd-drug-track">
        <div className={`lrd-drug-fill ${highlight ? 'lrd-drug-fill-highlight' : ''}`} style={{ width: `${Math.max(width, 2)}%` }}></div>
      </div>
      <span className="lrd-drug-source">{source}</span>
    </div>
  );
}

export default LetRobotsDrivePage;
