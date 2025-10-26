/**
 * BackstopJS Visual Regression Configuration
 * Captures screenshots from Storybook and compares against baselines
 *
 * Usage:
 *   npx backstop reference  - Capture baseline
 *   npx backstop test       - Compare against baseline
 *   npx backstop approve    - Accept changes as new baseline
 */

module.exports = {
  id: "storybook_visual_regression",
  viewports: [
    {
      label: "mobile",
      width: 375,
      height: 667
    },
    {
      label: "tablet",
      width: 768,
      height: 1024
    },
    {
      label: "desktop",
      width: 1280,
      height: 720
    }
  ],
  onBeforeScript: "puppet/onBefore.js",
  onReadyScript: "puppet/onReady.js",
  scenarios: [
    // Button Component Stories
    {
      label: "Button - Primary",
      url: "http://localhost:6006/iframe.html?id=components-button--primary",
      selectors: ["#storybook-root"],
      delay: 500,
      misMatchThreshold: 0.1
    },
    {
      label: "Button - Secondary",
      url: "http://localhost:6006/iframe.html?id=components-button--secondary",
      selectors: ["#storybook-root"],
      delay: 500,
      misMatchThreshold: 0.1
    },
    {
      label: "Button - Disabled",
      url: "http://localhost:6006/iframe.html?id=components-button--disabled",
      selectors: ["#storybook-root"],
      delay: 500,
      misMatchThreshold: 0.1
    },

    // Add more component stories here
    // Example: Card component
    {
      label: "Card - Default",
      url: "http://localhost:6006/iframe.html?id=components-card--default",
      selectors: ["#storybook-root"],
      delay: 500,
      misMatchThreshold: 0.1
    }
  ],
  paths: {
    bitmaps_reference: "backstop_data/bitmaps_reference",
    bitmaps_test: "backstop_data/bitmaps_test",
    engine_scripts: "backstop_data/engine_scripts",
    html_report: "backstop_data/html_report",
    ci_report: "backstop_data/ci_report"
  },
  report: ["browser", "CI"],
  engine: "puppeteer",
  engineOptions: {
    args: ["--no-sandbox"]
  },
  asyncCaptureLimit: 5,
  asyncCompareLimit: 50,
  debug: false,
  debugWindow: false
};
