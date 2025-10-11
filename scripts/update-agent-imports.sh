#!/bin/bash

# Script to update all agent import paths after reorganization
# Week 1 Day 2: Repository Reorganization

echo "🔄 Updating agent import paths across codebase..."

# Define the sed commands for different import patterns
update_imports() {
    local file="$1"

    # Update OPERA agent imports
    sed -i '' "s|from '\.\./agents/enhanced-maria'|from '../agents/opera/maria-qa/enhanced-maria'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/enhanced-maria'|from '../../agents/opera/maria-qa/enhanced-maria'|g" "$file"
    sed -i '' "s|from '\.\./\.\./\.\./agents/enhanced-maria'|from '../../../agents/opera/maria-qa/enhanced-maria'|g" "$file"

    sed -i '' "s|from '\.\./agents/enhanced-james'|from '../agents/opera/james-frontend/enhanced-james'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/enhanced-james'|from '../../agents/opera/james-frontend/enhanced-james'|g" "$file"
    sed -i '' "s|from '\.\./\.\./\.\./agents/enhanced-james'|from '../../../agents/opera/james-frontend/enhanced-james'|g" "$file"

    sed -i '' "s|from '\.\./agents/enhanced-marcus'|from '../agents/opera/marcus-backend/enhanced-marcus'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/enhanced-marcus'|from '../../agents/opera/marcus-backend/enhanced-marcus'|g" "$file"
    sed -i '' "s|from '\.\./\.\./\.\./agents/enhanced-marcus'|from '../../../agents/opera/marcus-backend/enhanced-marcus'|g" "$file"

    sed -i '' "s|from '\.\./agents/sarah-pm'|from '../agents/opera/sarah-pm/sarah-pm'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/sarah-pm'|from '../../agents/opera/sarah-pm/sarah-pm'|g" "$file"

    sed -i '' "s|from '\.\./agents/alex-ba'|from '../agents/opera/alex-ba/alex-ba'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/alex-ba'|from '../../agents/opera/alex-ba/alex-ba'|g" "$file"

    sed -i '' "s|from '\.\./agents/dr-ai-ml'|from '../agents/opera/dr-ai-ml/dr-ai-ml'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/dr-ai-ml'|from '../../agents/opera/dr-ai-ml/dr-ai-ml'|g" "$file"

    # Update core infrastructure imports
    sed -i '' "s|from '\.\./agents/base-agent'|from '../agents/core/base-agent'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/base-agent'|from '../../agents/core/base-agent'|g" "$file"
    sed -i '' "s|from '\.\./\.\./\.\./agents/base-agent'|from '../../../agents/core/base-agent'|g" "$file"

    sed -i '' "s|from '\.\./agents/agent-registry'|from '../agents/core/agent-registry'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/agent-registry'|from '../../agents/core/agent-registry'|g" "$file"

    sed -i '' "s|from '\.\./agents/agent-pool'|from '../agents/core/agent-pool'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/agent-pool'|from '../../agents/core/agent-pool'|g" "$file"

    sed -i '' "s|from '\.\./agents/rag-enabled-agent'|from '../agents/core/rag-enabled-agent'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/rag-enabled-agent'|from '../../agents/core/rag-enabled-agent'|g" "$file"

    # Update introspective agent imports
    sed -i '' "s|from '\.\./agents/introspective-agent'|from '../agents/meta/introspective/introspective-agent'|g" "$file"
    sed -i '' "s|from '\.\./\.\./agents/introspective-agent'|from '../../agents/meta/introspective/introspective-agent'|g" "$file"

    echo "✅ Updated: $file"
}

# Find all TypeScript files and update imports
export -f update_imports

find src -type f -name "*.ts" ! -path "*/node_modules/*" ! -path "*/.next/*" | while read file; do
    update_imports "$file"
done

echo "✅ All import paths updated successfully!"
