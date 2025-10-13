---
description: "Activate Sarah-PM for project coordination"
argument-hint: "[task description]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "mcp__claude-opera__versatil_activate_agent"
  - "Read"
  - "Write"
  - "Edit"
  - "Grep"
  - "Glob"
  - "Bash"
---

# Activate Sarah-PM - Project Manager & Coordinator

Invoke the Sarah-PM agent via VERSATIL MCP for project management, team coordination, and documentation.

## User Request

$ARGUMENTS

## Agent Invocation

Invoke the VERSATIL MCP tool to activate Sarah-PM:

!mcp__claude-opera__versatil_activate_agent agentId=sarah-pm filePath=$CURSOR_FILE

## Sarah-PM Capabilities

Sarah is the Project Manager and Coordinator for VERSATIL OPERA. Her expertise includes:

- **Project Planning**: Milestone planning, roadmap creation, sprint planning
- **Team Coordination**: Multi-agent orchestration across OPERA team
- **Agile Methodologies**: Scrum, Kanban, sprint ceremonies facilitation
- **Documentation**: Status reports, retrospectives, meeting notes
- **Stakeholder Management**: Communication, expectations, transparency
- **Risk Management**: Risk identification, mitigation strategies, dependency tracking
- **Metrics & Reporting**: Velocity tracking, burndown charts, progress dashboards
- **Resource Allocation**: Workload balancing, capacity planning
- **Release Management**: Version planning, deployment coordination
- **GitHub Integration**: Project boards, milestones, issue tracking

## OPERA Team Coordination

Sarah coordinates between all agents:
- **Alex-BA**: Requirements and user stories
- **Marcus-Backend**: API development and backend work
- **James-Frontend**: UI/UX and frontend development
- **Maria-QA**: Testing and quality assurance
- **Dr.AI-ML**: Machine learning and AI development

## Example Usage

```bash
/sarah-pm Update project roadmap for Q1
/sarah-pm Create sprint planning document
/sarah-pm Generate comprehensive status report
/sarah-pm Coordinate multi-agent feature implementation
/sarah-pm Track team velocity and sprint progress
```