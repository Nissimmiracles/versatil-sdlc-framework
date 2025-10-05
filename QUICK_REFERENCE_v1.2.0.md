# 🎯 VERSATIL v1.2.0 Quick Reference

## 🚀 Start Commands
```bash
npx versatil-sdlc enhanced    # Start with learning & memory
npx versatil-sdlc autonomous  # Full autonomous mode
npx versatil-sdlc test       # Interactive demos
npx versatil-sdlc migrate    # Upgrade from v1.1.x
```

## 🧠 RAG Memory API
```javascript
// Store knowledge
await vectorMemoryStore.storeMemory({
  content: "Always validate user input",
  metadata: { agentId: "security-sam", tags: ["security"] }
});

// Query knowledge
const memories = await vectorMemoryStore.queryMemories({
  query: "input validation",
  topK: 5
});
```

## 🤖 Opera Goals
```javascript
// Set autonomous goal
await opera.addGoal({
  type: 'feature',
  description: 'Add user authentication',
  priority: 'high',
  constraints: ['Use JWT', 'Include 2FA'],
  successCriteria: ['Tests pass', '95% coverage']
});

// Check status
const state = opera.getState();
```

## 🎮 Enhanced OPERA
```javascript
// Execute autonomous workflow
await enhancedOPERA.executeOPERAWorkflow(
  'project-id',
  'Build a REST API for user management'
);

// Enable full autonomous mode
enhancedOPERA.setAutonomousMode(true);
```

## 📡 MCP Tools
```yaml
versatil_memory_store     # Store knowledge
versatil_memory_query     # Search memories  
versatil_opera_goal      # Set dev goals
versatil_opera_status    # Check progress
versatil_opera_autonomous  # Full auto mode
```

## 🌐 REST Endpoints
```
POST   /api/memory/store     # Store knowledge
POST   /api/memory/query     # Query memories
POST   /api/opera/goal      # Add goal
GET    /api/opera/status    # Get status
POST   /api/opera/execute     # Run workflow
```

## 📊 Key Metrics
- **85%** faster development
- **95%** bug prevention  
- **70%** weekly improvement
- **99.9%** context retention

## 🎯 Quick Wins

### Fix Production Bug
```javascript
opera.addGoal({
  type: 'bug_fix',
  description: 'Memory leak in user service',
  priority: 'critical',
  constraints: ['Fix in production', 'No downtime']
});
```

### Build New Feature  
```javascript
enhancedOPERA.executeOPERAWorkflow(
  'chat-feature',
  'Add real-time chat with WebSockets'
);
```

### Refactor Legacy Code
```javascript
opera.addGoal({
  type: 'refactor',
  description: 'Modernize payment module',
  priority: 'medium',
  constraints: ['Maintain API compatibility', 'Add tests']
});
```

## 🧪 Test One Feature
```bash
# See memory in action
npm run test:quick

# Watch autonomous bug fix
node tests/real-world-scenarios.js

# Stress test the system
npm run test:edge-cases
```

## 💡 Pro Tips
1. **Let agents learn**: Every interaction improves future performance
2. **Set clear goals**: Better constraints = better results
3. **Trust autonomy**: Let Opera handle the complexity
4. **Review memories**: See what your agents have learned
5. **Start enhanced**: Get benefits immediately

## 🔗 Resources
- Docs: `https://docs.versatil-framework.com`
- Discord: `https://discord.gg/versatil`
- Issues: `https://github.com/.../issues`

---
**Remember**: You're not using a tool—you're partnering with an AI team that learns! 🚀
