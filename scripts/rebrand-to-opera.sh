#!/bin/bash

echo "🎭 Starting VERSATIL Opera MCP Rebranding..."
echo "============================================"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup timestamp
BACKUP_DIR=".rebranding-backup-$(date +%Y%m%d_%H%M%S)"

echo -e "${YELLOW}📦 Creating backup in ${BACKUP_DIR}...${NC}"
mkdir -p "$BACKUP_DIR"

# Backup critical files
cp -r src "$BACKUP_DIR/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp *.md "$BACKUP_DIR/" 2>/dev/null || true
cp *.js "$BACKUP_DIR/" 2>/dev/null || true
cp *.cjs "$BACKUP_DIR/" 2>/dev/null || true

echo -e "${GREEN}✅ Backup created${NC}"

# Step 1: Rename directories
echo -e "${BLUE}📁 Step 1: Renaming directories...${NC}"
if [ -d "src/opera" ]; then
    mv src/opera src/opera
    echo "  ✓ src/opera → src/opera"
fi

if [ -d "dist/opera" ]; then
    mv dist/opera dist/opera
    echo "  ✓ dist/opera → dist/opera"
fi

# Step 2: Rename files
echo -e "${BLUE}📄 Step 2: Renaming files...${NC}"

# Root level files
for file in *opera*.js *opera*.cjs *opera*.md; do
    if [ -f "$file" ]; then
        newname=$(echo "$file" | sed 's/opera/opera/g' | sed 's/OPERA/OPERA/g')
        mv "$file" "$newname"
        echo "  ✓ $file → $newname"
    fi
done

# Source files
find src -type f -name "*opera*" 2>/dev/null | while read file; do
    newname=$(echo "$file" | sed 's/opera/opera/g')
    mv "$file" "$newname" 2>/dev/null
    echo "  ✓ $file → $newname"
done

# Step 3: Update content in TypeScript/JavaScript files
echo -e "${BLUE}🔧 Step 3: Updating code references...${NC}"

# Function to update file content
update_content() {
    local pattern=$1
    local replacement=$2
    local file_pattern=$3

    find . -type f \( -name "$file_pattern" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/$BACKUP_DIR/*" -exec sed -i '' "s/${pattern}/${replacement}/g" {} \; 2>/dev/null
}

# Update class names and identifiers
update_content "OperaOrchestrator" "OperaOrchestrator" "*.ts"
update_content "OperaOrchestrator" "OperaOrchestrator" "*.js"
update_content "EnhancedOperaOrchestrator" "EnhancedOperaOrchestrator" "*.ts"
update_content "EnhancedOperaOrchestrator" "EnhancedOperaOrchestrator" "*.js"
update_content "MultimodalOperaOrchestrator" "MultimodalOperaOrchestrator" "*.ts"
update_content "MultimodalOperaOrchestrator" "MultimodalOperaOrchestrator" "*.js"

# Update module paths
update_content "opera-orchestrator" "opera-orchestrator" "*.ts"
update_content "opera-orchestrator" "opera-orchestrator" "*.js"
update_content "opera-mcp" "opera-mcp" "*.ts"
update_content "opera-mcp" "opera-mcp" "*.js"
update_content "opera/opera" "opera/opera" "*.ts"
update_content "opera/opera" "opera/opera" "*.js"
update_content "opera/enhanced-opera" "opera/enhanced-opera" "*.ts"
update_content "opera/enhanced-opera" "opera/enhanced-opera" "*.js"

# Update directory references
update_content 'opera/' 'opera/' "*.ts"
update_content 'opera/' 'opera/' "*.js"

# Update generic opera references
update_content "opera" "opera" "*.ts"
update_content "opera" "opera" "*.js"
update_content "Opera" "Opera" "*.ts"
update_content "Opera" "Opera" "*.js"
update_content "OPERA" "OPERA" "*.ts"
update_content "OPERA" "OPERA" "*.js"

echo "  ✓ Code references updated"

# Step 4: Update package.json
echo -e "${BLUE}📦 Step 4: Updating package.json...${NC}"
sed -i '' 's/Opera autonomous orchestration/Opera autonomous orchestration/g' package.json
sed -i '' 's/opera/opera/g' package.json
echo "  ✓ package.json updated"

# Step 5: Update documentation
echo -e "${BLUE}📚 Step 5: Updating documentation files...${NC}"

find . -type f -name "*.md" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/$BACKUP_DIR/*" -exec sed -i '' 's/Opera MCP/Opera MCP/g' {} \; 2>/dev/null
find . -type f -name "*.md" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/$BACKUP_DIR/*" -exec sed -i '' 's/opera-mcp/opera-mcp/g' {} \; 2>/dev/null
find . -type f -name "*.md" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/$BACKUP_DIR/*" -exec sed -i '' 's/Opera/Opera/g' {} \; 2>/dev/null
find . -type f -name "*.md" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/$BACKUP_DIR/*" -exec sed -i '' 's/OPERA/OPERA/g' {} \; 2>/dev/null

echo "  ✓ Documentation updated"

# Step 6: Update JSON config files
echo -e "${BLUE}⚙️  Step 6: Updating configuration files...${NC}"

find . -type f -name "*.json" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/$BACKUP_DIR/*" -exec sed -i '' 's/opera/opera/g' {} \; 2>/dev/null
find . -type f -name "*.json" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/$BACKUP_DIR/*" -exec sed -i '' 's/Opera/Opera/g' {} \; 2>/dev/null

echo "  ✓ Configuration files updated"

echo ""
echo -e "${GREEN}✨ Rebranding Complete!${NC}"
echo ""
echo "Summary:"
echo "  • Directories renamed: src/opera → src/opera"
echo "  • Files renamed: All opera-* files → opera-*"
echo "  • Code updated: All Opera references → Opera"
echo "  • Documentation updated: All references updated"
echo "  • Backup saved in: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "  1. Run: npm run build (to rebuild TypeScript)"
echo "  2. Run: npm test (to verify everything works)"
echo "  3. Review changes: git diff"
echo ""
echo -e "${YELLOW}⚠️  Remember to update any external references and documentation!${NC}"