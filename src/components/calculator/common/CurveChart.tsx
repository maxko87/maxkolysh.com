import { useEffect, useRef } from 'react';

interface CurveChartProps {
  curve: number[]; // 11-point curve array (0-10)
  width?: number; // default 300
  height?: number; // default 160
  timelineYears: number; // X-axis span
  xAxisLabel?: string; // Optional label for X-axis (not used in current implementation)
  color: string; // Curve and control point color (e.g., "#667eea")
  markerLine?: {
    year: number;
    label: string;
    color: string;
  }; // Optional vertical marker line
}

export default function CurveChart({
  curve,
  width = 300,
  height = 160,
  timelineYears,
  color,
  markerLine,
}: CurveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 30;
    const topPadding = 20;

    canvas.width = width;
    canvas.height = height;

    const chartWidth = width - 2 * padding;
    const chartHeight = height - padding - topPadding;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, topPadding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid and labels
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#718096';
    ctx.textAlign = 'center';

    // X-axis grid and labels
    const numLabels = 5;
    const step = Math.ceil(timelineYears / numLabels);
    for (let i = 0; i <= timelineYears; i += step) {
      const x = padding + (i / timelineYears) * chartWidth;
      const y = height - padding;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, topPadding);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.fillText(`Y${i}`, x, y + 15);
    }

    // Y-axis grid and labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i += 5) {
      const y = height - padding - (i / 10) * chartHeight;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      ctx.fillText(`${i * 10}%`, padding - 5, y + 3);
    }

    // Draw marker line (if provided)
    if (markerLine && isFinite(markerLine.year) && markerLine.year <= timelineYears) {
      const markerX = padding + (markerLine.year / timelineYears) * chartWidth;

      // Draw dashed vertical line
      ctx.strokeStyle = markerLine.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(markerX, topPadding);
      ctx.lineTo(markerX, height - padding);
      ctx.stroke();
      ctx.setLineDash([]); // Reset to solid line

      // Add label
      ctx.fillStyle = markerLine.color;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(markerLine.label, markerX, topPadding - 5);
    }

    // Draw curve
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i <= 10; i++) {
      const yearPosition = (i / 10) * timelineYears;
      const x = padding + (yearPosition / timelineYears) * chartWidth;
      const y = height - padding - (curve[i] || 0) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw control points
    for (let i = 0; i <= 10; i++) {
      const yearPosition = (i / 10) * timelineYears;
      const x = padding + (yearPosition / timelineYears) * chartWidth;
      const y = height - padding - (curve[i] || 0) * chartHeight;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [curve, width, height, timelineYears, color, markerLine]);

  return (
    <canvas
      ref={canvasRef}
      className="curve-preview-canvas"
      style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
    />
  );
}
