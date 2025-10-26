#!/usr/bin/env node

/**
 * WCAG Color Contrast Checker
 *
 * Usage:
 *   node contrast-checker.js <foreground> <background>
 *   node contrast-checker.js '#999999' '#ffffff'
 *   node contrast-checker.js 'rgb(153, 153, 153)' 'rgb(255, 255, 255)'
 *
 * Output:
 *   - Contrast ratio
 *   - WCAG AA/AAA compliance for text and UI components
 *   - Color suggestions for compliance
 */

// Parse hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Parse rgb() or rgba() color
function rgbStringToRgb(rgb) {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return match ? {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3])
  } : null;
}

// Calculate relative luminance per WCAG formula
function getLuminance(rgb) {
  const { r, g, b } = rgb;

  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio per WCAG formula
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Convert RGB to hex
function rgbToHex(rgb) {
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

// Suggest compliant color by darkening/lightening
function suggestCompliantColor(foreground, background, targetRatio = 4.5) {
  const bgLum = getLuminance(background);
  const fgLum = getLuminance(foreground);

  // Determine if we need darker or lighter foreground
  const shouldDarken = fgLum > bgLum;

  let bestColor = foreground;
  let bestRatio = getContrastRatio(foreground, background);

  // Iterate through adjustments
  for (let adjustment = 0; adjustment <= 100; adjustment += 5) {
    const factor = shouldDarken ? (100 - adjustment) / 100 : (100 + adjustment) / 100;

    const adjusted = {
      r: Math.max(0, Math.min(255, foreground.r * factor)),
      g: Math.max(0, Math.min(255, foreground.g * factor)),
      b: Math.max(0, Math.min(255, foreground.b * factor))
    };

    const ratio = getContrastRatio(adjusted, background);

    if (ratio >= targetRatio && (bestRatio < targetRatio || ratio < bestRatio)) {
      bestColor = adjusted;
      bestRatio = ratio;
    }

    if (bestRatio >= targetRatio && ratio > bestRatio + 0.5) {
      break; // Found good enough match
    }
  }

  return { color: bestColor, ratio: bestRatio };
}

// Main function
function checkContrast(foregroundInput, backgroundInput) {
  // Parse colors
  let foreground, background;

  if (foregroundInput.startsWith('#')) {
    foreground = hexToRgb(foregroundInput);
  } else if (foregroundInput.startsWith('rgb')) {
    foreground = rgbStringToRgb(foregroundInput);
  } else {
    throw new Error('Invalid foreground color format. Use hex (#999999) or rgb(153, 153, 153)');
  }

  if (backgroundInput.startsWith('#')) {
    background = hexToRgb(backgroundInput);
  } else if (backgroundInput.startsWith('rgb')) {
    background = rgbStringToRgb(backgroundInput);
  } else {
    throw new Error('Invalid background color format. Use hex (#999999) or rgb(153, 153, 153)');
  }

  if (!foreground || !background) {
    throw new Error('Failed to parse colors');
  }

  // Calculate contrast ratio
  const ratio = getContrastRatio(foreground, background);

  // WCAG Compliance Levels
  const wcagAA_text = ratio >= 4.5;
  const wcagAAA_text = ratio >= 7.0;
  const wcagAA_largeText = ratio >= 3.0;
  const wcagAA_ui = ratio >= 3.0;

  // Output
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('           WCAG COLOR CONTRAST CHECKER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Foreground: ${rgbToHex(foreground)} / rgb(${foreground.r}, ${foreground.g}, ${foreground.b})`);
  console.log(`Background: ${rgbToHex(background)} / rgb(${background.r}, ${background.g}, ${background.b})\n`);

  console.log(`Contrast Ratio: ${ratio.toFixed(2)}:1\n`);

  console.log('📊 WCAG Compliance:\n');
  console.log(`   Text (normal):    ${wcagAA_text ? '✅' : '❌'} AA ${wcagAA_text ? 'PASS' : 'FAIL'} (requires 4.5:1)`);
  console.log(`   Text (large):     ${wcagAA_largeText ? '✅' : '❌'} AA ${wcagAA_largeText ? 'PASS' : 'FAIL'} (requires 3:1)`);
  console.log(`   UI Components:    ${wcagAA_ui ? '✅' : '❌'} AA ${wcagAA_ui ? 'PASS' : 'FAIL'} (requires 3:1)`);
  console.log(`   Text (enhanced):  ${wcagAAA_text ? '✅' : '❌'} AAA ${wcagAAA_text ? 'PASS' : 'FAIL'} (requires 7:1)\n`);

  // Suggestions
  if (!wcagAA_text) {
    console.log('💡 Suggestions for AA Compliance (4.5:1):\n');

    const suggestion = suggestCompliantColor(foreground, background, 4.5);
    console.log(`   Use ${rgbToHex(suggestion.color)} for AA compliance (${suggestion.ratio.toFixed(2)}:1)`);

    if (!wcagAAA_text) {
      const suggestionAAA = suggestCompliantColor(foreground, background, 7.0);
      console.log(`   Use ${rgbToHex(suggestionAAA.color)} for AAA compliance (${suggestionAAA.ratio.toFixed(2)}:1)`);
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Exit code
  process.exit(wcagAA_text ? 0 : 1);
}

// CLI Entry Point
const foreground = process.argv[2];
const background = process.argv[3];

if (!foreground || !background) {
  console.error('Usage: node contrast-checker.js <foreground> <background>');
  console.error('Example: node contrast-checker.js "#999999" "#ffffff"');
  console.error('Example: node contrast-checker.js "rgb(153, 153, 153)" "rgb(255, 255, 255)"');
  process.exit(1);
}

try {
  checkContrast(foreground, background);
} catch (error) {
  console.error(`\n❌ Error: ${error.message}\n`);
  process.exit(1);
}
