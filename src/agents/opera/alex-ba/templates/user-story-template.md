# User Story Template

**Epic**: [Epic Name/ID]
**Story ID**: US-[Number]
**Created**: [YYYY-MM-DD]
**Author**: Alex-BA (Business Analyst)
**Status**: Draft

---

## User Story

**As a** [user role/persona]
**I want** [goal/desire/need]
**So that** [benefit/value/outcome]

---

## Story Details

### Context & Background
[Provide context about why this story exists, the business problem it solves, and how it fits into the larger product vision]

### User Persona
- **Name**: [Persona name]
- **Role**: [Job title/role]
- **Goals**: [What they're trying to achieve]
- **Pain Points**: [Current challenges]
- **Technical Proficiency**: [Novice/Intermediate/Expert]

---

## Acceptance Criteria

### Scenario 1: [Happy Path Scenario]
```gherkin
Given [initial context/precondition]
  And [additional context if needed]
When [action taken by user or system]
  And [additional action if needed]
Then [expected outcome]
  And [additional outcome if needed]
```

### Scenario 2: [Alternative Path]
```gherkin
Given [initial context/precondition]
When [action taken by user or system]
Then [expected outcome]
```

### Scenario 3: [Error/Edge Case]
```gherkin
Given [initial context/precondition]
When [action that triggers error]
Then [error handling behavior]
  And [user feedback/error message]
```

---

## Functional Requirements

### Must Have (P0)
- [ ] [Critical requirement 1]
- [ ] [Critical requirement 2]
- [ ] [Critical requirement 3]

### Should Have (P1)
- [ ] [Important requirement 1]
- [ ] [Important requirement 2]

### Nice to Have (P2)
- [ ] [Optional enhancement 1]
- [ ] [Optional enhancement 2]

---

## Non-Functional Requirements

### Performance
- **Response Time**: [e.g., < 200ms]
- **Throughput**: [e.g., 100 concurrent users]
- **Load Time**: [e.g., < 2 seconds]

### Security
- **Authentication**: [Required? Method?]
- **Authorization**: [Role-based access control?]
- **Data Validation**: [Input sanitization requirements]
- **Compliance**: [GDPR, HIPAA, etc.]

### Usability
- **Accessibility**: [WCAG 2.1 AA compliance]
- **Mobile Support**: [Responsive? Native app?]
- **Browser Support**: [Chrome, Firefox, Safari, Edge?]
- **Localization**: [Languages supported]

### Reliability
- **Availability**: [e.g., 99.9% uptime]
- **Error Handling**: [Graceful degradation requirements]
- **Data Integrity**: [Validation, backups]

---

## Business Rules

### Rule 1: [Rule Name]
- **Description**: [Detailed rule description]
- **Rationale**: [Why this rule exists]
- **Impact**: [What happens if violated]
- **Priority**: High/Medium/Low

### Rule 2: [Rule Name]
- **Description**: [Detailed rule description]
- **Rationale**: [Why this rule exists]
- **Impact**: [What happens if violated]
- **Priority**: High/Medium/Low

---

## UI/UX Requirements

### Visual Design
- **Layout**: [Description of expected layout]
- **Components**: [UI components needed: buttons, forms, modals, etc.]
- **Styling**: [Brand guidelines, color scheme, typography]

### User Flow
```
Step 1: [User lands on page/screen]
  ↓
Step 2: [User performs action]
  ↓
Step 3: [System responds]
  ↓
Step 4: [Expected outcome]
```

### Mockups/Wireframes
[Link to design files or embed images]

---

## Technical Notes

### API Requirements
- **Endpoints**: [Required API endpoints]
- **Data Format**: [JSON, XML, etc.]
- **Authentication**: [OAuth, JWT, etc.]

### Data Model
- **Entities**: [Database tables/objects needed]
- **Fields**: [Key fields and data types]
- **Relationships**: [Foreign keys, joins]

### Third-Party Integrations
- **Service 1**: [Integration requirements]
- **Service 2**: [Integration requirements]

---

## Testing Strategy

### Unit Tests
- [ ] [Test case 1: Description]
- [ ] [Test case 2: Description]

### Integration Tests
- [ ] [Test case 1: Description]
- [ ] [Test case 2: Description]

### E2E Tests
- [ ] [Test scenario 1: Description]
- [ ] [Test scenario 2: Description]

### Manual Testing Checklist
- [ ] [Test step 1]
- [ ] [Test step 2]
- [ ] [Test step 3]

---

## Dependencies

### Technical Dependencies
- [ ] [Dependency 1: API, library, service]
- [ ] [Dependency 2: API, library, service]

### Story Dependencies
- [ ] **Blocked By**: [US-XXX - Story that must be completed first]
- [ ] **Blocks**: [US-XXX - Story that depends on this one]
- [ ] **Related**: [US-XXX - Related story]

### External Dependencies
- [ ] [Vendor approval, legal review, etc.]

---

## Estimation

### Story Points
**Estimate**: [1, 2, 3, 5, 8, 13, 21]

**Effort Breakdown**:
- Frontend Development: [Hours/Points]
- Backend Development: [Hours/Points]
- Testing: [Hours/Points]
- Documentation: [Hours/Points]
- **Total**: [Hours/Points]

### Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |
| [Risk 2] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |

---

## Collaboration

### Agent Handoffs
- **James-Frontend**: [UI/UX implementation requirements]
- **Marcus-Backend**: [API/database implementation requirements]
- **Maria-QA**: [Testing requirements and quality gates]
- **Sarah-PM**: [Sprint planning and coordination]

### Stakeholder Involvement
| Stakeholder | Role | Involvement | Approval Required? |
|-------------|------|-------------|-------------------|
| [Name/Role] | [Position] | [How involved] | Yes/No |

---

## Definition of Done (DoD)

- [ ] Code implemented and peer-reviewed
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Security scan completed (no critical issues)
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Code merged to main branch
- [ ] Documentation updated
- [ ] Stakeholder approval received
- [ ] Deployed to staging environment
- [ ] User acceptance testing completed

---

## Notes & Questions

### Open Questions
- **Q1**: [Question that needs answering]
  - **Answer**: [TBD or answered]
- **Q2**: [Question that needs answering]
  - **Answer**: [TBD or answered]

### Assumptions
- [Assumption 1]
- [Assumption 2]

### Out of Scope
- [Explicitly excluded from this story]
- [Deferred to future stories]

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [YYYY-MM-DD] | Alex-BA | Initial draft |
| 1.1 | [YYYY-MM-DD] | [Name] | [Changes made] |

---

## References

- **PRD**: [Link to Product Requirements Document]
- **BRD**: [Link to Business Requirements Document]
- **Epic**: [Link to parent Epic]
- **Design**: [Link to design files]
- **Technical Spec**: [Link to technical documentation]

---

**Story Generated by**: Alex-BA (VERSATIL SDLC Framework)
**Template Version**: 1.0
**Framework Version**: 6.1.0
**Priority**: [P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)]
**Sprint**: [Sprint number or name]
