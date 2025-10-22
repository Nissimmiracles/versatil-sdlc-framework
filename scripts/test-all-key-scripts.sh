#!/bin/bash
echo "Testing all key npm scripts..."
echo ""

echo "1. Testing show-agents..."
npm run show-agents > /dev/null 2>&1 && echo "   ✅ show-agents works" || echo "   ❌ show-agents failed"

echo "2. Testing agents..."
npm run agents > /dev/null 2>&1 && echo "   ✅ agents works" || echo "   ❌ agents failed"

echo "3. Testing init..."
npm run init > /dev/null 2>&1 && echo "   ✅ init works" || echo "   ❌ init failed"

echo "4. Testing version:check..."
npm run version:check > /dev/null 2>&1 && echo "   ✅ version:check works" || echo "   ❌ version:check failed"

echo "5. Testing opera:health..."
npm run opera:health > /dev/null 2>&1 && echo "   ✅ opera:health works" || echo "   ❌ opera:health failed"

echo "6. Testing test:enhanced..."
npm run test:enhanced > /dev/null 2>&1 && echo "   ✅ test:enhanced works" || echo "   ❌ test:enhanced failed"

echo "7. Testing test:opera-mcp..."
npm run test:opera-mcp > /dev/null 2>&1 && echo "   ✅ test:opera-mcp works (shows notice)" || echo "   ❌ test:opera-mcp failed"

echo "8. Testing framework..."
node test-full-framework.mjs > /dev/null 2>&1 && echo "   ✅ test-full-framework works" || echo "   ❌ test-full-framework failed"

echo ""
echo "Script test complete!"
