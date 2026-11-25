const APPROXIMATE_LOAD_YARDS = 20;
const SQUARE_FEET_INCHES_PER_CUBIC_YARD = 324;
const format = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function estimateWoodChipLoad(squareFeet, depthInches) {
  if (!Number.isFinite(squareFeet) || squareFeet < 1 || squareFeet > 1_000_000 ||
      !Number.isFinite(depthInches) || depthInches < 0.1 || depthInches > 24) {
    throw new RangeError('Enter an area from 1 to 1,000,000 square feet and a depth from 0.1 to 24 inches.');
  }
  const needed = squareFeet * depthInches / SQUARE_FEET_INCHES_PER_CUBIC_YARD;
  const remainder = APPROXIMATE_LOAD_YARDS - needed;
  return {
    needed,
    approximateLoad: APPROXIMATE_LOAD_YARDS,
    coverageSquareFeet: APPROXIMATE_LOAD_YARDS * SQUARE_FEET_INCHES_PER_CUBIC_YARD / depthInches,
    remainder,
  };
}

function displayVolume(value) {
  return value > 0 && value < 0.01 ? 'less than 0.01' : format.format(value);
}

if (typeof document !== 'undefined') {
  const controls = document.getElementById('wood-chip-controls');
  const area = document.getElementById('wood-chip-area');
  const depth = document.getElementById('wood-chip-depth');
  const result = document.getElementById('wood-chip-result');
  const calculate = document.getElementById('wood-chip-calc');

  calculate.addEventListener('click', () => {
    let estimate;
    try {
      estimate = estimateWoodChipLoad(area.valueAsNumber, depth.valueAsNumber);
    } catch (error) {
      result.textContent = error.message;
      return;
    }
    const { needed, remainder, coverageSquareFeet } = estimate;
    const difference = Math.abs(remainder);
    const fit = difference < 0.01
      ? 'Your estimate is close to the town’s approximate load size.'
      : 'Against a nominal 20-yard load, about ' + displayVolume(difference) + ' cubic yards ' +
        (remainder > 0 ? 'could be left over.' : 'of your planned volume would still be needed.');
    result.textContent = 'Your estimated need is ' + displayVolume(needed) + ' cubic yards. ' + fit +
      ' A 20-yard load would cover about ' + format.format(coverageSquareFeet) + ' square feet at this depth.';
  });

  for (const input of [area, depth]) {
    input.addEventListener('input', () => { result.textContent = ''; });
  }
  controls.hidden = false;
}
