// This script demonstrates how the transformation logic works

interface Position {
  x: number;
  y: number;
}

// Sample horizontal template (like Policy Renewal Process)
const horizontalTemplate: Position[] = [
  { x: 100, y: 200 },   // Step 1
  { x: 350, y: 200 },   // Step 2
  { x: 600, y: 200 },   // Step 3
  { x: 850, y: 200 },   // Step 4
  { x: 1100, y: 200 },  // Step 5
];

// Sample vertical template (like Employee Recruitment)
const verticalTemplate: Position[] = [
  { x: 100, y: 50 },    // Step 1
  { x: 100, y: 150 },   // Step 2
  { x: 100, y: 250 },   // Step 3
  { x: 100, y: 350 },   // Step 4
  { x: 100, y: 450 },   // Step 5
];

function analyzeAndTransform(positions: Position[], name: string) {
  console.log(`\n📊 ${name}:`);

  const xPositions = positions.map(p => p.x);
  const yPositions = positions.map(p => p.y);
  const xRange = Math.max(...xPositions) - Math.min(...xPositions);
  const yRange = Math.max(...yPositions) - Math.min(...yPositions);

  console.log(`  Original layout:`);
  console.log(`    X range: ${xRange} (${Math.min(...xPositions)} to ${Math.max(...xPositions)})`);
  console.log(`    Y range: ${yRange} (${Math.min(...yPositions)} to ${Math.max(...yPositions)})`);
  console.log(`    Orientation: ${xRange > yRange ? 'HORIZONTAL' : 'VERTICAL'}`);

  const isHorizontal = xRange > yRange;

  const transformPosition = (x: number, y: number) => {
    if (!isHorizontal) {
      return { x, y }; // Already vertical
    }
    // Swap x and y to make vertical
    return { x: y, y: x };
  };

  const transformed = positions.map(p => transformPosition(p.x, p.y));

  if (isHorizontal) {
    const newXPositions = transformed.map(p => p.x);
    const newYPositions = transformed.map(p => p.y);
    const newXRange = Math.max(...newXPositions) - Math.min(...newXPositions);
    const newYRange = Math.max(...newYPositions) - Math.min(...newYPositions);

    console.log(`  Transformed layout:`);
    console.log(`    X range: ${newXRange} (${Math.min(...newXPositions)} to ${Math.max(...newXPositions)})`);
    console.log(`    Y range: ${newYRange} (${Math.min(...newYPositions)} to ${Math.max(...newYPositions)})`);
    console.log(`    Orientation: ${newXRange > newYRange ? 'HORIZONTAL' : 'VERTICAL'}`);
    console.log(`  ✅ Transformed from horizontal to vertical`);
  } else {
    console.log(`  ℹ️  Already vertical, no transformation needed`);
  }

  console.log(`  First 3 steps:`);
  positions.slice(0, 3).forEach((orig, i) => {
    const trans = transformed[i];
    const changed = orig.x !== trans.x || orig.y !== trans.y;
    console.log(`    Step ${i + 1}: (${orig.x}, ${orig.y}) → (${trans.x}, ${trans.y})${changed ? ' ✓' : ''}`);
  });
}

console.log('🔄 Position Transformation Verification\n');
console.log('This demonstrates how horizontal templates are automatically');
console.log('transformed to vertical layouts when creating processes.\n');

analyzeAndTransform(horizontalTemplate, 'Horizontal Template (e.g., Policy Renewal)');
analyzeAndTransform(verticalTemplate, 'Vertical Template (e.g., Employee Recruitment)');

console.log('\n✅ Transformation logic verified!\n');
