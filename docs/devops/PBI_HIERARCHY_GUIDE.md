# PBI Hierarchy Guide: Parent PBIs with Linked Sub-Tasks

## Overview

Your PBIs are now organized with a **parent-child hierarchy** that keeps related work grouped together while enabling detailed task tracking.

**Structure:**
```
Feature (in GitHub)
└─ [PBI] Parent Issue (represents the complete feature work)
   ├─ Sub-Task 1 (implementation detail)
   ├─ Sub-Task 2 (implementation detail)
   ├─ Sub-Task 3 (implementation detail)
   ├─ Sub-Task 4 (implementation detail)
   ├─ Sub-Task 5 (implementation detail)
   └─ Sub-Task 6 (implementation detail)
```

## Benefits

✅ **Grouped Work:** All related tasks under one parent
✅ **Clear Scope:** Parent PBI shows complete feature work
✅ **Detailed Tracking:** Individual sub-tasks for daily work
✅ **Easy Planning:** Commit parent PBI, work on sub-tasks
✅ **Progress Visibility:** Check off sub-tasks as you complete them
✅ **Backlog Clarity:** See both big picture and details

## Parent PBIs (Q1)

Each Q1 feature has one parent PBI with 6 sub-tasks:

### Epic 1.1: LangGraph Agent Orchestration

1. **[PBI] Planning Agent Implementation**
   - Implement PlannerAgent class
   - Build repository analysis tool
   - Create plan validation system
   - Integrate into LangGraph
   - Add tests
   - Build frontend UI

2. **[PBI] Coding Agent Implementation**
   - Implement SimpleCodingAgent
   - Implement ComplexCodingAgent
   - Create code generation tools
   - Build agent router
   - Integrate into LangGraph
   - Add comprehensive tests

3. **[PBI] Testing Agent Implementation**
   - Implement TestingAgent
   - Build test execution harness
   - Create test analysis system
   - Integrate into workflow
   - Add tests
   - Build frontend UI

4. **[PBI] Review Agent & Complete Workflow**
   - Implement ReviewAgent
   - Build security scanning
   - Complete LangGraph orchestration
   - Implement task execution service
   - Add integration tests
   - Build streaming UI

### Epic 1.2: Intelligent Context Management

5. **[PBI] Vector-Based Code Search**
   - Setup pgvector and embeddings
   - Implement indexing service
   - Build semantic search API
   - Integrate into agents
   - Add vector search tests
   - Build management UI

6. **[PBI] Conversation Memory & Task History**
   - Design conversation schema
   - Implement memory service
   - Integrate Chat Agent
   - Add API endpoints
   - Build chat UI
   - Add tests

### Epic 1.3: Developer Experience & Observability

7. **[PBI] Enhanced LangSmith Integration**
   - Implement trace instrumentation
   - Build cost tracking
   - Create performance monitoring
   - Add dashboard links
   - Implement error tracking
   - Add tests

8. **[PBI] Structured Logging & Debugging**
   - Enhance structlog config
   - Build log aggregation
   - Add request tracing
   - Implement debug mode
   - Create log viewer
   - Add tests

9. **[PBI] Testing Infrastructure & CI/CD**
   - Expand backend coverage
   - Build frontend testing suite
   - Setup GitHub Actions
   - Create test data management
   - Add performance testing
   - Build documentation

## How to Work with Parent PBIs

### Weekly Planning

**When committing for a sprint:**

1. Open "Backlog Items" view
2. Filter: `label: hierarchy:pbi AND label: status:parent`
3. Pick 3-5 parent PBIs for the week
4. Add `status: committed` to the parent PBI
5. These become your "focus areas" for the week

**Example:**
```
Week 1 Committed PBIs:
✓ [PBI] Planning Agent Implementation
✓ [PBI] Testing Infrastructure & CI/CD
```

### Daily Work

**When working on a parent PBI:**

1. Open the parent PBI issue
2. See the 6 linked sub-tasks
3. Pick 1-2 sub-tasks per day
4. Add `status: in progress` to the sub-task (not parent)
5. Work on that sub-task
6. Check off the sub-task in parent's checklist
7. When all 6 sub-tasks are done, close parent

**Example:**
```
Day 1:
├─ Working on: [Sub-Task] Implement PlannerAgent class
├─ Status: in progress
└─ Others: Ready to start

Day 2:
├─ Completed: [Sub-Task] Implement PlannerAgent class ✓
├─ Working on: [Sub-Task] Build repository analysis tool
└─ Status: in progress

Day 3-4:
├─ Completed: Sub-task 2, 3, 4
└─ Working on: Sub-task 5, 6
```

## Label Usage with Parent PBIs

### Parent PBI Labels
- `hierarchy: pbi` ✓
- `priority: critical` or `high` ✓
- `type: agents` (for agent work) or `backend`, etc. ✓
- `status: committed` (when you plan the week) ✓
- `status: in progress` (optional - if tracking at parent level)

### Sub-Task Labels
- `hierarchy: pbi` ✓
- `priority: critical` or `high` ✓
- `type: agents`, `backend`, `frontend`, etc. ✓
- `status: in progress` (when you start working)
- `status: needs review` (when code is ready)
- `status: blocked` (if stuck)
- NO `status: committed` label (parent has this)

## Workflow: Parent PBI → Sub-Tasks

### When You Commit a Parent PBI

```
Monday Planning:
└─ Add "status: committed" to parent PBI
   (NOT to sub-tasks yet)
```

### When You Start Working

```
Tuesday Morning:
├─ Remove "committed" from parent (optional)
├─ Pick first sub-task (e.g., "Implement PlannerAgent class")
├─ Add "status: in progress" to sub-task
└─ Start coding
```

### As You Complete Sub-Tasks

```
Tuesday Afternoon:
├─ Sub-task complete
├─ Remove "in progress" from sub-task
├─ Check off ✓ in parent's checklist
├─ Add "status: needs review" to sub-task
└─ Submit for review (or self-review)

Wednesday Morning:
├─ Review complete
├─ Close sub-task issue
├─ Parent PBI shows: 1/6 complete ✓
└─ Pick next sub-task
```

### When All Sub-Tasks Are Done

```
Friday Afternoon:
├─ All 6 sub-tasks completed ✓
├─ All sub-tasks closed
├─ Remove "status: committed" from parent
├─ Close parent PBI
└─ Feature work is complete!
```

## Example: Planning Agent PBI (Actual Implementation Flow)

### Monday (Planning)
```
[PBI] Planning Agent Implementation (#123)
├─ Status: committed
├─ This week's focus area
├─ Contains 6 sub-tasks (see details below)

Sub-Tasks:
├─ [ ] Implement PlannerAgent class (#124)
├─ [ ] Build repository analysis tool (#125)
├─ [ ] Create plan validation system (#126)
├─ [ ] Integrate into LangGraph (#127)
├─ [ ] Add tests (#128)
└─ [ ] Build frontend UI (#129)
```

### Tuesday (Start Work)
```
Start: Implement PlannerAgent class (#124)
├─ Status: in progress
├─ Create: /apps/backend/src/agents/planner.py
├─ Extend: BaseAgent class
└─ Use: Claude Sonnet 4.5
```

### Wednesday (Progress)
```
Completed Sub-Tasks:
├─ ✓ Implement PlannerAgent class (#124) - closed
├─ ✓ Build repository analysis tool (#125) - in review

In Progress:
└─ [ ] Create plan validation system (#126)

Parent Progress:
└─ [PBI] Planning Agent: 2/6 complete (33%)
```

### Friday (Completion)
```
Completed Sub-Tasks:
├─ ✓ All 6 sub-tasks complete
├─ ✓ All closed
├─ ✓ Tests passing
├─ ✓ Code reviewed

Parent Status:
├─ Remove "status: committed"
├─ Close [PBI] Planning Agent Implementation
└─ Feature 1.1.1 DONE! ✓
```

## Working with Sub-Tasks

### Opening a Sub-Task

When you open a sub-task issue, you'll see:
```
[Task Name]

Description:
Part of: Planning Agent Implementation (#123)

This sub-task is implementation work for the parent PBI.
Complete this, then move to the next sub-task.
```

### Tracking Individual Sub-Tasks

Each sub-task:
- Has its own issue number
- Can be assigned to yourself
- Has its own labels
- Shows in "Current Sprint" if it's "in progress"
- Can have associated PRs

### Completing a Sub-Task

1. Code is written and tested
2. Create a PR (link it to the sub-task)
3. PR is reviewed and approved
4. Merge the PR
5. Close the sub-task
6. Check off ✓ in parent's checklist
7. Pick next sub-task

## Tips for Parent/Child Success

### 1. Commit the PARENT, Not Sub-Tasks

✅ **Correct:**
```
Monday: Add "status: committed" to [PBI] Planning Agent Implementation
Then: Work on sub-tasks #124, #125, #126, etc.
```

❌ **Incorrect:**
```
Committing all 6 sub-tasks individually
This loses the grouping benefit
```

### 2. One Sub-Task at a Time

✅ **Focus:**
```
Start one sub-task
Work until complete (code + tests + review)
Close it
Move to next
```

❌ **Context Switching:**
```
Starting all 6 sub-tasks at once
Creates confusion and context switching
```

### 3. Update Parent Checklist

As you complete sub-tasks:
```
Parent PBI body shows:
- [ ] Sub-Task 1
- [ ] Sub-Task 2
- [x] Sub-Task 3  ← Check when done
```

This gives a quick visual progress indicator.

### 4. Use Sub-Task Links for References

In your code/PRs, reference the sub-task:
```
PR Title: "Implement PlannerAgent class (#124)"

PR Description:
Closes: #124
Related: #123 (parent PBI)
```

This links code changes to the work item.

## View Configuration for Parent PBIs

### "Q1 Focus" View (Parent PBIs Only)

Show only parent PBIs for the quarter:

```
Filter:
- label: hierarchy: pbi
- NOT label: relates-to-parent  (or use custom field)
- status: Open

Group By: Priority
Sort By: Priority (high to low)
```

This shows your 9 parent PBIs for Q1.

### "Detailed Work" View (Sub-Tasks Only)

Show only sub-tasks you're working on:

```
Filter:
- label: hierarchy: pbi
- label: relates-to-parent
- status: in progress

Sort By: Updated (newest first)
```

This shows your current detailed work.

### "Progress Tracker" View

Show parent + sub-task progress:

```
Group By: Parent Issue
Sort By: Completion %
```

This shows parent PBIs with completion count.

## FAQ

**Q: Should I commit sub-tasks individually?**
A: No, commit the parent. The parent groups 6 sub-tasks, so one commitment covers a week's focus area.

**Q: What if a sub-task takes longer than expected?**
A: That's normal. Keep working, it's still part of the parent PBI. Adjust future estimates.

**Q: Can I skip a sub-task?**
A: Avoid skipping if possible. If you must, document why in the parent. Better to defer the entire parent than skip pieces.

**Q: How do I link PRs to sub-tasks?**
A: In your PR description: `Closes: #123` or `Related: #123` (use the sub-task number).

**Q: What if sub-tasks have different effort levels?**
A: That's fine. A parent PBI might have 3 small + 2 medium + 1 large. Still grouped together.

**Q: Can I work on 2 parent PBIs in parallel?**
A: Yes, but limit to 2-3 max. Commit them both, then focus on one at a time.

## Summary

**Parent PBIs provide:**
- ✓ Clear scope (what's included in this work)
- ✓ Better organization (related tasks grouped)
- ✓ Detailed tracking (individual sub-tasks)
- ✓ Progress visibility (see completion percentage)
- ✓ Reduced context switching (finish feature before starting next)

**Work Flow:**
1. **Plan:** Commit 3-5 parent PBIs per week
2. **Work:** Complete 1-2 sub-tasks per day
3. **Track:** Check off sub-tasks in parent
4. **Review:** Close sub-tasks as done
5. **Complete:** Close parent when all sub-tasks done

This structure keeps you focused on completing entire features while enabling detailed day-to-day work tracking.

---

Last Updated: 2025-12-21
Use this for all Q1 work (9 parent PBIs × 6 sub-tasks each)
