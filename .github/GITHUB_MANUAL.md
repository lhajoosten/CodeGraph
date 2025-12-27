# GitHub DevOps Board Manual

> **For:** CodeGraph Development Team  
> **Last Updated:** 2025-12-27

This manual explains how to use GitHub Issues, Projects, and the work item hierarchy for CodeGraph development.

---

## 📋 Table of Contents

1. [Work Item Hierarchy](#work-item-hierarchy)
2. [Creating Issues](#creating-issues)
3. [Linking Issues (Parent-Child)](#linking-issues-parent-child)
4. [Labels System](#labels-system)
5. [GitHub Projects Board Setup](#github-projects-board-setup)
6. [Workflow & Status Transitions](#workflow--status-transitions)
7. [Best Practices](#best-practices)
8. [Quick Reference](#quick-reference)

---

## 🏗️ Work Item Hierarchy

CodeGraph uses a **4-level hierarchy** for organizing work:

```
🏔️ EPIC (3-6 months)
└── 📦 FEATURE (2-6 weeks)
    └── 📋 PBI - Product Backlog Item (1-5 days)
        └── ✅ TASK (< 1 day)
```

### Hierarchy Levels Explained

| Level       | Label                | Duration   | Contains     | Example                                      |
| ----------- | -------------------- | ---------- | ------------ | -------------------------------------------- |
| **Epic**    | `hierarchy: epic`    | 3-6 months | 3-6 Features | "E-1.1 LangGraph Agent Orchestration"        |
| **Feature** | `hierarchy: feature` | 2-6 weeks  | 4-8 PBIs     | "F-1.1.1 Planning Agent Implementation"      |
| **PBI**     | `hierarchy: pbi`     | 1-5 days   | 1-5 Tasks    | "PBI-1.1.1 Implement PlannerAgent class"     |
| **Task**    | `hierarchy: task`    | < 1 day    | None         | "T-1.1.1.1 Create planner.py file structure" |

### ID Naming Convention

```
E-[quarter].[number]           → Epic       (E-1.1)
F-[epic].[number]              → Feature    (F-1.1.1)
PBI-[feature].[number]         → PBI        (PBI-1.1.1)
T-[pbi].[number]               → Task       (T-1.1.1.1)
```

---

## 📝 Creating Issues

### Step 1: Choose the Right Template

When creating a new issue, select the appropriate template:

| Template            | When to Use                                          | Label Applied        |
| ------------------- | ---------------------------------------------------- | -------------------- |
| **Epic**            | Major initiative, quarter-spanning work              | `hierarchy: epic`    |
| **Feature**         | Significant feature within an Epic                   | `hierarchy: feature` |
| **PBI**             | Specific implementable work item                     | `hierarchy: pbi`     |
| **Task**            | Small unit of work within a PBI                      | `hierarchy: task`    |
| **Bug**             | Something broken that needs fixing                   | `bug`                |
| **Feature Request** | Community suggestions (convert to Feature/PBI later) | `enhancement`        |

### Step 2: Fill Out the Template

Each template has specific sections. Key fields:

**For Epics:**

```markdown
**Epic ID:** E-1.1
**Quarter:** Q1 2026
**Status:** 🔴 Not Started

## Child Features

| Feature | Title          | Status         | PBI Count |
| ------- | -------------- | -------------- | --------- |
| #12     | Planning Agent | 🔴 Not Started | 0/6       |
```

**For Features:**

```markdown
**Feature ID:** F-1.1.1
**Part of Epic:** #10

## Child PBIs

| PBI | Title                  | Status         | Tasks |
| --- | ---------------------- | -------------- | ----- |
| #15 | Implement PlannerAgent | 🔴 Not Started | 0/3   |
```

**For PBIs:**

```markdown
**PBI ID:** PBI-1.1.1
**Part of Epic:** #10
**Part of Feature:** #12

## Child Tasks

| Task | Title                 | Status         | Estimate |
| ---- | --------------------- | -------------- | -------- |
| #20  | Create file structure | 🔴 Not Started | 2h       |
```

---

## 🔗 Linking Issues (Parent-Child)

### ⚠️ CRITICAL: Never Use "Closes" for Parent Links!

Using `Closes #123` in a child issue will **automatically close the parent** when the child is merged. This is almost never what you want!

### Correct Linking Pattern

| Scenario           | What to Write | Effect                         |
| ------------------ | ------------- | ------------------------------ |
| Feature → Epic     | `Part of #10` | Links without auto-close       |
| PBI → Feature      | `Part of #12` | Links without auto-close       |
| PBI → Epic         | `Part of #10` | Links without auto-close       |
| Task → PBI         | `Part of #15` | Links without auto-close       |
| Task completes PBI | `Closes #15`  | Auto-closes PBI when merged ✅ |

### Example: Correct Hierarchy Linking

```markdown
## Parent Hierarchy

> ⚠️ **DO NOT use "Closes #"** - that would auto-close the parent!

- **Part of Epic:** #10
- **Part of Feature:** #12
```

### When CAN You Use "Closes"?

Only use `Closes #` when:

1. A **Task** completes the **last remaining work** on a PBI
2. A **Bug fix PR** should close the bug issue
3. A **single PR** fully implements a PBI

---

## 🏷️ Labels System

### Hierarchy Labels (Required for Work Items)

| Label                | Color                 | For           |
| -------------------- | --------------------- | ------------- |
| `hierarchy: epic`    | Purple (#6f42c1)      | Epics only    |
| `hierarchy: feature` | Blue (#0052cc)        | Features only |
| `hierarchy: pbi`     | Green (#0e8a16)       | PBIs only     |
| `hierarchy: task`    | Light Green (#c2e0c6) | Tasks only    |

### Priority Labels

| Label                | Color            | Meaning                    |
| -------------------- | ---------------- | -------------------------- |
| `priority: critical` | Red (#b60205)    | Must be fixed immediately  |
| `priority: high`     | Orange (#d93f0b) | Important for next release |
| `priority: medium`   | Yellow (#fbca04) | Should be done soon        |
| `priority: low`      | Green (#0e8a16)  | Nice to have               |

### Component Labels

| Label                  | Color                | Scope                  |
| ---------------------- | -------------------- | ---------------------- |
| `type: backend`        | Blue (#1d76db)       | FastAPI, Python        |
| `type: frontend`       | Purple (#5319e7)     | React, TypeScript      |
| `type: agents`         | Pink (#f9d0c4)       | LangGraph, LLM         |
| `type: infrastructure` | Teal (#bfdadc)       | Docker, CI/CD          |
| `type: database`       | Dark Teal (#006b75)  | PostgreSQL, migrations |
| `type: testing`        | Light Blue (#bfd4f2) | Tests, QA              |

### Status Labels

| Label                  | Color                | Meaning                 |
| ---------------------- | -------------------- | ----------------------- |
| `status: backlog`      | Gray (#ededed)       | Not yet started         |
| `status: ready`        | Light Blue (#c5def5) | Ready to pick up        |
| `status: in progress`  | Yellow (#ffeb3b)     | Currently being worked  |
| `status: blocked`      | Orange (#ff5722)     | Blocked by something    |
| `status: needs review` | Blue (#03a9f4)       | Waiting for code review |
| `status: on hold`      | Lavender (#d4c5f9)   | Temporarily paused      |

### Quarter Labels

| Label     | Color            | Period       |
| --------- | ---------------- | ------------ |
| `Q1-2026` | Blue (#1d76db)   | Jan-Mar 2026 |
| `Q2-2026` | Blue (#0052cc)   | Apr-Jun 2026 |
| `Q3-2026` | Purple (#5319e7) | Jul-Sep 2026 |
| `Q4-2026` | Purple (#6f42c1) | Oct-Dec 2026 |

### Applying Labels to Issues

Every work item should have:

1. **One hierarchy label** (epic/feature/pbi/task)
2. **One priority label** (critical/high/medium/low)
3. **At least one component label** (backend/frontend/agents/etc.)
4. **One status label** (starts as `status: backlog`)
5. **One quarter label** (for planning)

---

## 📊 GitHub Projects Board Setup

### Creating the Project

1. Go to your repository → **Projects** tab
2. Click **New Project** → **Board**
3. Name it: "CodeGraph 2026 Roadmap"

### Recommended Views

#### View 1: Kanban Board (Default)

Columns:

- 📝 Backlog
- ✅ Ready
- 🔄 In Progress
- 👀 In Review
- ✅ Done

Filter by: `is:issue is:open` or specific labels

#### View 2: Roadmap by Quarter

Group by: Quarter label
Sort by: Priority

```
Q1-2026
├── E-1.1 Agent Orchestration [Critical]
├── E-1.2 Context Management [High]
└── E-1.3 Observability [High]

Q2-2026
├── E-2.1 Multi-Repository [High]
└── E-2.2 Enterprise Auth [High]
...
```

#### View 3: Epic Progress

Group by: `hierarchy: epic`
Shows Features under each Epic

#### View 4: Current Sprint

Filter: `label:"status: in progress" OR label:"status: ready"`
Sort by: Priority

### Custom Fields (Recommended)

| Field   | Type          | Values               |
| ------- | ------------- | -------------------- |
| Size    | Single Select | S, M, L              |
| Sprint  | Iteration     | Week 1, Week 2, etc. |
| Quarter | Single Select | Q1, Q2, Q3, Q4       |
| Epic    | Single Select | E-1.1, E-1.2, etc.   |

---

## 🔄 Workflow & Status Transitions

### Issue Lifecycle

```
Created → Backlog → Ready → In Progress → In Review → Done
             ↓         ↑         ↓
          On Hold ←────┴───── Blocked
```

### Status Transitions

| From        | To          | When                                     |
| ----------- | ----------- | ---------------------------------------- |
| Backlog     | Ready       | All dependencies met, requirements clear |
| Ready       | In Progress | Developer starts work                    |
| In Progress | Blocked     | Waiting on external dependency           |
| In Progress | In Review   | PR created, ready for review             |
| In Review   | Done        | PR merged, acceptance criteria met       |
| Any         | On Hold     | Temporarily paused (explain why)         |

### Pull Request Workflow

1. Create branch: `feature/pbi-1.1.1-planner-agent`
2. Link PR to issue: `Implements #15` or `Part of #15`
3. Request review
4. After approval and merge:
   - PR auto-closes if using `Closes #15`
   - Otherwise, manually close the issue

---

## ✅ Best Practices

### DO ✅

- **Always use templates** for new issues
- **Link child to parent** using "Part of #"
- **Update status labels** as work progresses
- **Break down large PBIs** into Tasks
- **Keep issue titles concise** but descriptive
- **Update the parent's child table** when creating children
- **Close issues** when all acceptance criteria are met

### DON'T ❌

- **Don't use "Closes #"** for parent links (auto-closes parent!)
- **Don't create orphan issues** without hierarchy links
- **Don't skip hierarchy levels** (Epic → PBI without Feature)
- **Don't leave issues in "In Progress"** indefinitely
- **Don't change hierarchy labels** after issue creation
- **Don't create PBIs larger than 1 week** (split them)
- **Don't create Tasks larger than 1 day** (split them)

### Issue Title Conventions

```
[EPIC] LangGraph Agent Orchestration Engine
[FEATURE] Planning Agent Implementation
[PBI] Implement PlannerAgent class with LangChain
[TASK] Create planner.py file structure
[BUG] Planning agent crashes on empty repository
```

---

## 📖 Quick Reference

### Creating a Complete Hierarchy (Example)

**1. Create Epic:**

```markdown
Title: [EPIC] LangGraph Agent Orchestration Engine
Labels: hierarchy: epic, priority: critical, Q1-2026, type: agents
```

**2. Create Feature (referencing Epic):**

```markdown
Title: [FEATURE] Planning Agent Implementation
Labels: hierarchy: feature, priority: high, Q1-2026, type: agents, type: backend
Body: "Part of Epic: #10"
```

**3. Create PBI (referencing Feature & Epic):**

```markdown
Title: [PBI] Implement PlannerAgent class
Labels: hierarchy: pbi, priority: high, Q1-2026, type: backend
Body:

- Part of Epic: #10
- Part of Feature: #12
```

**4. Create Task (referencing PBI):**

```markdown
Title: [TASK] Create planner.py file structure
Labels: hierarchy: task, priority: medium, type: backend
Body: "Part of PBI: #15"
```

### Updating Parent Issues

When you create a child issue, update the parent's table:

**Before (in Feature #12):**

```markdown
| PBI  | Title | Status         | Tasks |
| ---- | ----- | -------------- | ----- |
| #000 | TBD   | 🔴 Not Started | 0/3   |
```

**After (in Feature #12):**

```markdown
| PBI | Title                  | Status         | Tasks |
| --- | ---------------------- | -------------- | ----- |
| #15 | Implement PlannerAgent | 🔴 Not Started | 0/3   |
```

### Label Sync Command

To sync labels from `labels.yml` to your repository:

```bash
# Using GitHub CLI
gh label sync --force

# Or using github-label-sync npm package
npm install -g github-label-sync
github-label-sync --access-token <token> --labels .github/labels.yml <owner>/<repo>
```

---

## 🆘 Troubleshooting

### "My parent issue was auto-closed!"

**Cause:** You used `Closes #` in a child issue or PR.

**Fix:**

1. Reopen the parent issue
2. Edit the child to use `Part of #` instead
3. Remember: Only use `Closes` when you want auto-close!

### "I can't find my issue in the board"

**Cause:** Issue might be missing required labels or not added to project.

**Fix:**

1. Check the issue has a hierarchy label
2. Add issue to project manually: Issue → Projects → Add to project

### "How do I see all work for an Epic?"

1. In GitHub Issues, search: `"Part of #10"` (Epic number)
2. Or use Projects Board grouped by Epic

---

## 📚 Related Documents

- [ROADMAP.md](../ROADMAP.md) - Full 2026 development roadmap
- [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute
- [Issue Templates](.github/ISSUE_TEMPLATE/) - Templates for all issue types

---

_Questions? Open an issue with the `question` label!_
