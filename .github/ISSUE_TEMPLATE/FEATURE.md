---
name: Feature
about: A major feature within an epic (2-6 weeks of work)
title: "[FEATURE] "
labels: "hierarchy: feature"
assignees: ""
---

## Feature Description

**Feature ID:** F-[epic].[number] (e.g., F-1.1)

[Clear description of what this feature does and why it's needed]

## Parent Epic

> ⚠️ **DO NOT use "Closes #"** - that would auto-close the Epic!

**Part of Epic:** #[epic-issue-number]

## User Stories

As a [user type], I want to [action], so that [benefit].

### Acceptance Criteria

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2
- [ ] Acceptance criterion 3

## Child PBIs (Product Backlog Items)

> ⚠️ **DO NOT use "Closes #" here** - that would auto-close the Feature!
> Use "Part of #" in the PBI to link back here.

| PBI  | Title | Status         | Tasks |
| ---- | ----- | -------------- | ----- |
| #000 | PBI 1 | 🔴 Not Started | 0/3   |
| #000 | PBI 2 | 🔴 Not Started | 0/3   |
| #000 | PBI 3 | 🔴 Not Started | 0/3   |
| #000 | PBI 4 | 🔴 Not Started | 0/3   |
| #000 | PBI 5 | 🔴 Not Started | 0/3   |
| #000 | PBI 6 | 🔴 Not Started | 0/3   |

## Technical Details

### Components Affected

- [ ] Backend
- [ ] Frontend
- [ ] Infrastructure
- [ ] Agents/LLM

### Architecture

[Describe the architecture or design approach for this feature]

### Dependencies

- [Dependency 1]
- [Dependency 2]

## Effort Estimate

**Size:** S (Small) / M (Medium) / L (Large)
**Estimated PBIs per size:**

- Small: 1-2 days per PBI
- Medium: 3-5 days per PBI
- Large: 1-2 weeks per PBI

## Success Criteria

- [ ] All acceptance criteria met
- [ ] All PBIs completed
- [ ] Tests passing (80%+ coverage)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Performance benchmarks met (if applicable)

## Testing Strategy

[Describe the testing approach: unit tests, integration tests, E2E tests, etc.]

## Documentation

- [ ] Inline code documentation added
- [ ] README/architecture docs updated
- [ ] API documentation updated (if applicable)
- [ ] User guide updated (if applicable)

## Deployment Notes

[Any special considerations for deployment, feature flags, migrations, etc.]

---

## Implementation Checklist

- [ ] Design approved
- [ ] All PBIs created
- [ ] All PBIs completed
- [ ] Code review completed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Merged to main
- [ ] Deployed to production (if applicable)
