---
name: Task
about: A small unit of work within a PBI (< 1 day)
title: "[TASK] "
labels: "hierarchy: task"
assignees: ""
---

## Task Description

**Task ID:** T-[pbi].[number] (e.g., T-1.1.3.2)

[What needs to be done?]

## Parent Hierarchy

> ✅ Tasks CAN use "Closes #" when completion means the parent PBI is done.
> Otherwise use "Part of #" to link without auto-closing.

- **Part of Epic:** #[epic-issue-number]
- **Part of Feature:** #[feature-issue-number]
- **Part of PBI:** #[pbi-issue-number]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Details

**Files to modify:**

- [ ] `/path/to/file.py`

**Technical requirements or constraints:**
[Details here]

## Dependencies

- **Depends on:** #issue-number
- **Blocks:** #issue-number

## Estimated Effort

- [ ] XS (< 1 hour)
- [ ] S (1-4 hours)
- [ ] M (4-8 hours)
- [ ] L (1-2 days) ⚠️ Consider splitting into multiple tasks
