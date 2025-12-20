const fs = require('fs');
const path = require('path');

// Read the OPERS CSV (from same directory as this script)
const csvPath = path.join(__dirname, 'OPERF_Private_Equity_Portfolio_Q3_2024_all_pages.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV (simple parsing)
const lines = csvContent.trim().split('\n');

// Parse funds
const funds = [];
for (let i = 1; i < lines.length; i++) { // Skip header
  const line = lines[i];
  if (!line.trim()) continue;

  const cols = line.split(',');
  if (cols.length < 9) continue;

  const partnership = cols[2];
  const vintageYear = parseInt(cols[1]);
  const commitment = parseFloat(cols[3]);
  const tvpiStr = cols[7];
  const irrStr = cols[8];

  // Skip if no valid data
  if (!partnership || isNaN(vintageYear) || isNaN(commitment) || partnership === 'Total') continue;

  // Parse TVPI (remove 'x')
  const tvpi = parseFloat(tvpiStr.replace('x', ''));
  if (isNaN(tvpi)) continue;

  // Parse IRR (handle 'n.m.' for not meaningful)
  const irr = irrStr === 'n.m.' ? null : parseFloat(irrStr.replace('%', ''));

  funds.push({
    partnership,
    vintageYear,
    commitment,
    tvpi,
    irr
  });
}

// Known fund sizes (from public sources)
const knownFundSizes = {
  'Apollo Investment Fund IX': 24700,
  'Apollo Investment Fund VIII': 18400,
  'Blackstone Capital Partners VIII': 26000,
  'Blackstone Capital Partners VII': 17600,
  'Blackstone Capital Partners VI': 15800,
  'KKR North America Fund XI': 13900,
  'KKR Americas Fund XII': 13900,
  'KKR Americas Fund XIII': 17000,
  'Thoma Bravo Fund XIV': 22800,
  'Francisco Partners IV': 4000,
  'Francisco Partners V': 5000,
  'Francisco Partners VI': 6500,
  'Francisco Partners VII': 5000,
  'Hellman & Friedman Capital Partners IX': 16000,
  'Hellman & Friedman Capital Partners X': 24300,
  'TPG Partners VII': 13500,
  'TPG Partners VIII': 10000,
  'Vista Equity Partners Fund VI': 16000,
  'Vista Equity Partners Fund VII': 16000,
  'Vista Equity Partners Fund VIII': 15000,
  'Warburg Pincus Private Equity X': 15000,
  'Advent International GPE IX': 17500,
  'Advent International GPE X': 25000,
  'CVC Capital Partners VII': 18500,
  'CVC Capital Partners VIII': 26000,
};

// Estimate fund size function
// OPERS is smaller than CalPERS (~$100B vs ~$500B AUM), so they typically
// commit smaller percentages of total fund sizes
function estimateFundSize(partnership, commitment) {
  // Check if we have a known size
  if (knownFundSizes[partnership]) {
    return knownFundSizes[partnership];
  }

  // For mega-commitments (>$400M), OPERS is typically 3-4% of fund
  if (commitment >= 400) {
    return Math.round(commitment / 0.035); // Use 3.5% as estimate
  }

  // For large commitments ($200-400M), OPERS is typically 5-7% of fund
  if (commitment >= 200) {
    return Math.round(commitment / 0.06); // Use 6% as estimate
  }

  // For mid-market commitments ($75-200M), OPERS is typically 8-12% of fund
  if (commitment >= 75) {
    return Math.round(commitment / 0.10); // Use 10% as estimate
  }

  // For smaller commitments (<$75M), OPERS is typically 12-18% of fund
  return Math.round(commitment / 0.15); // Use 15% as estimate
}

// Filter for interesting funds (good performance or large/well-known funds)
const interestingFunds = funds.filter(f => {
  // Include if TVPI > 2.0 (excellent performance)
  if (f.tvpi >= 2.0) return true;

  // Include well-known fund families
  const wellKnownFamilies = [
    'Apollo', 'Blackstone', 'KKR', 'TPG', 'Carlyle', 'Advent',
    'Hellman', 'Vista', 'Thoma Bravo', 'Silver Lake', 'Francisco',
    'General Atlantic', 'Tiger Global', 'TCV', 'BOND',
    'Warburg Pincus', 'CVC', 'Permira', 'Apax', 'Genstar'
  ];

  if (wellKnownFamilies.some(family => f.partnership.includes(family))) {
    return true;
  }

  // Include if commitment > $200M (likely a major fund)
  if (f.commitment >= 200) return true;

  return false;
});

// Sort by TVPI descending
interestingFunds.sort((a, b) => b.tvpi - a.tvpi);

// Generate TypeScript code
console.log('// OPERS Funds');
console.log('// Add these to PRESET_FUNDS array in presetFunds.ts');
console.log('');

interestingFunds.forEach(fund => {
  const estimatedSize = estimateFundSize(fund.partnership, fund.commitment);
  const displayName = `${fund.partnership} (${fund.vintageYear}) - ${fund.tvpi.toFixed(2)}x`;

  console.log(`  {`);
  console.log(`    displayName: "${displayName}",`);
  console.log(`    fundName: "${fund.partnership}",`);
  console.log(`    vintage: ${fund.vintageYear},`);
  console.log(`    strategy: "Private Equity",`);
  console.log(`    source: "OPERS",`);
  console.log(`    sourceUrl: "https://www.oregon.gov/treasury/invested-for-oregon/Documents/Invested-for-OR-Performance-and-Holdings/2024/OPERF_Private_Equity_Portfolio_-_Quarter_3_2024.pdf",`);
  console.log(`    size: ${estimatedSize},  // Estimated from $${fund.commitment}M commitment`);
  console.log(`    grossReturnMultiple: ${fund.tvpi.toFixed(2)},`);
  if (fund.irr !== null && !isNaN(fund.irr)) {
    console.log(`    irr: ${fund.irr.toFixed(1)},`);
  }
  console.log(`  },`);
});

console.log('');
console.log(`Total funds exported: ${interestingFunds.length}`);
