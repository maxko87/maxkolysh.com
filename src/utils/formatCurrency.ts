export function formatCurrency(value: number): string {
  // Handle NaN, Infinity, and other invalid values
  if (!isFinite(value) || isNaN(value)) {
    return '$0.0M';
  }

  if (value > 0 && value < 0.1) {
    // Very small values: show 2 decimals to avoid showing $0.0M for non-zero values
    return `$${value.toFixed(2)}M`;
  } else if (value < 100) {
    // Less than $100M: show 1 decimal
    return `$${value.toFixed(1)}M`;
  } else if (value < 1000) {
    // $100M-$999M: no decimal
    return `$${Math.round(value)}M`;
  } else if (value < 10000) {
    // $1B-$9.99B: 2 decimals
    return `$${(value / 1000).toFixed(2)}B`;
  } else if (value < 100000) {
    // $10B-$99.9B: 1 decimal
    return `$${(value / 1000).toFixed(1)}B`;
  } else {
    // $100B+: no decimal
    return `$${Math.round(value / 1000)}B`;
  }
}
