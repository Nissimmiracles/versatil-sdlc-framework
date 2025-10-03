---
description: "Generate automated stress tests (Rule 2)"
---

Generate **automated stress tests** using VERSATIL Rule 2 to validate system reliability.

## What This Does:
Creates comprehensive stress test scenarios:
- **Load Testing**: Normal traffic patterns
- **Stress Testing**: Beyond capacity to breaking point
- **Spike Testing**: Sudden traffic surges
- **Volume Testing**: Large data sets
- **Chaos Engineering**: Network failures and resilience
- **Security Stress**: Authentication attacks

## Auto-Generation Triggers:
🎯 Code changes in critical paths (API endpoints, components)
🎯 New feature deployment
🎯 Performance regression thresholds breached
🎯 Security vulnerability patterns detected
🎯 Integration point modifications

## Test Output:
- Performance baselines and regression detection
- Security vulnerability reports
- Scalability bottleneck identification
- Real-time results feed into quality gates

## Usage:
```bash
/stress-test                    # Run all stress tests
/stress-test api                # Stress test APIs only
/stress-test --generate         # Generate new test scenarios
```

## Coordination:
Maria-QA orchestrates stress testing with real-time quality gate integration.

## Benefits:
- 85% reduction in production issues
- Automated performance regression detection
- Proactive scalability issue identification