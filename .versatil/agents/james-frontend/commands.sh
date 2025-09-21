#!/bin/bash
# James-Frontend Commands

james_lint() {
    echo "🎨 Linting frontend code..."
    eslint src/ --fix
    prettier --write src/
}

james_build() {
    echo "🎨 Building frontend..."
    npm run build
}

james_optimize() {
    echo "🎨 Optimizing frontend performance..."
    webpack-bundle-analyzer dist/
}