/**
 * Maps a value to a color based on user-defined rules.
 * Rules are evaluated in order; the first match wins.
 */
export const getColorFromRules = (value: any, rules: any[]): string | null => {
  for (const rule of rules) {
    if (rule.type === 'range') {
      const v = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(v)) continue;
      
      const min = rule.min ?? -Infinity;
      const max = rule.max ?? Infinity;
      
      if (v >= min && v <= max) return rule.color;
    } else if (rule.type === 'discrete') {
      if (String(value) === String(rule.value)) return rule.color;
    }
  }
  return null;
};

/**
 * Approximates RGB from Kelvin temperature (1000K to 40000K)
 * Based on Mitchell Charity's 'What color is a blackbody?' and Tanner Helland's algorithm.
 */
const kelvinToRGB = (kelvin: number): string => {
  const temp = Math.max(1000, Math.min(40000, kelvin)) / 100;
  let r, g, b;

  if (temp <= 66) {
    r = 255;
    g = Math.max(0, Math.min(255, 99.4708025861 * Math.log(temp) - 161.1195681661));
    if (temp <= 19) {
      b = 0;
    } else {
      b = Math.max(0, Math.min(255, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
    }
  } else {
    r = Math.max(0, Math.min(255, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    g = Math.max(0, Math.min(255, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
    b = 255;
  }

  return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
};

/**
 * Maps a value (0-1) to an aesthetic color scale.
 */
export const getColorFromScale = (value: number, scale: string): string => {
  const v = Math.max(0, Math.min(1, value));
  
  switch (scale) {
    case 'temp':
      // Blue -> White -> Red (Star Temp style)
      if (v < 0.5) return `hsl(${220 - v * 100}, 100%, ${50 + v * 100}%)`;
      return `hsl(${20 - (v - 0.5) * 40}, 100%, ${100 - (v - 0.5) * 80}%)`;
    
    case 'plasma':
      return `hsl(${280 + v * 120}, 100%, ${20 + v * 60}%)`;
    
    case 'neon':
      return `hsl(${180 + v * 100}, 100%, 50%)`;
      
    case 'spectral':
      return `hsl(${v * 360}, 80%, 60%)`;
      
    case 'blackbody':
    case 'hr_diagram':
      // Scientific Stellar temperature mapping: 1,000K to 40,000K
      // Maps 0.0 (Cool/Red) to 1.0 (Hot/Blue)
      const kelvin = 1000 + v * 39000;
      return kelvinToRGB(kelvin);
      
    default:
      return `hsl(180, 100%, 50%)`;
  }
};

/**
 * Normalizes a data value to 0-1 range based on column stats.
 */
export const normalizeValue = (val: number, min: number, max: number): number => {
  if (min === max) return 0.5;
  return (val - min) / (max - min);
};
