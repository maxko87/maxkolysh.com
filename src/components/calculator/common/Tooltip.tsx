import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

function Tooltip({ text, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, arrowLeft: 0, showBelow: false });
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isVisible || !triggerRef.current) return;

    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();

    // Tooltip is always 250px wide max
    const tooltipWidth = 250;
    const padding = 10;

    // Position tooltip horizontally - keep it within viewport
    let left = Math.max(padding, Math.min(
      window.innerWidth - tooltipWidth - padding,
      triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2
    ));

    // Position tooltip vertically
    const tooltipHeight = 100; // approximate
    const showBelow = triggerRect.top < tooltipHeight + padding;
    const top = showBelow
      ? triggerRect.bottom + 8
      : triggerRect.top - tooltipHeight - 8;

    // Arrow points to trigger center
    const arrowLeft = Math.max(12, Math.min(
      tooltipWidth - 12,
      triggerRect.left + triggerRect.width / 2 - left
    ));

    setPosition({ top, left, arrowLeft, showBelow });
  }, [isVisible]);

  return (
    <span
      ref={triggerRef}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            background: '#1e293b',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 10000,
            pointerEvents: 'none',
            maxWidth: '250px',
            width: 'max-content',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          {text}
          <div
            style={{
              position: 'absolute',
              left: `${position.arrowLeft}px`,
              ...(position.showBelow ? {
                bottom: '100%',
                borderBottom: '6px solid #1e293b',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
              } : {
                top: '100%',
                borderTop: '6px solid #1e293b',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
              }),
            }}
          />
        </div>
      )}
    </span>
  );
}

export default Tooltip;
