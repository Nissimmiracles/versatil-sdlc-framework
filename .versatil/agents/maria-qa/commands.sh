#!/bin/bash
# Maria-QA Commands

maria_test_all() {
    echo "🧪 Running comprehensive test suite..."
    npm run test
    playwright test
}

maria_visual_test() {
    echo "🧪 Running visual regression tests..."
    chrome-mcp test --visual
}

maria_performance() {
    echo "🧪 Running performance tests..."
    lighthouse http://localhost:3000
}

maria_accessibility() {
    echo "🧪 Running accessibility audit..."
    pa11y http://localhost:3000
}