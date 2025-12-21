# GitHub Project Views Configuration Guide

You've created 5 custom views. This guide shows exactly how to configure each one for maximum effectiveness.

## View 1: Epics
**Purpose:** See all epics and their status at a glance

### Configuration Steps:
1. **Filter:**
   - `label: hierarchy:epic` (Required)
   - Status: Open

2. **Group By:**
   - Quarter (or manually by Q1/Q2/Q3/Q4)

3. **Sort By:**
   - Priority (Critical → High → Medium)

4. **Columns to Display:**
   - Title
   - Status
   - Priority
   - Labels

### What This Shows:
- All 8 epics grouped by quarter
- Quick overview of what's coming each quarter
- Easy to see which epics are ready to start

### How to Use:
- Check at start of quarter to see what's coming
- Track epic progress throughout quarter
- Identify blockers or dependencies between epics

---

## View 2: Features
**Purpose:** Track all features and their parent epics

### Configuration Steps:
1. **Filter:**
   - `label: hierarchy:feature` (Required)
   - Status: Open

2. **Group By:**
   - Epic (using the description which links to epic)
   - Or manually by Quarter

3. **Sort By:**
   - Priority (Critical → High → Medium)

4. **Columns to Display:**
   - Title
   - Status
   - Type (backend/frontend/agents/infrastructure)
   - Priority
   - Effort (if using custom field)

### What This Shows:
- All 27 features organized by parent epic
- See which features belong to which epic
- Quick identification of feature scope and type

### How to Use:
- When starting an epic, see what features it contains
- Identify interdependencies between features
- Plan feature sequencing within an epic

---

## View 3: Backlog Items (PBIs)
**Purpose:** See all individual tasks across all quarters

### Configuration Steps:
1. **Filter:**
   - `label: hierarchy:pbi` (Required)
   - `NOT label: status:done` (or Status: Open)

2. **Group By:**
   - Quarter (using Priority or manually)
   - Or Group By: Feature

3. **Sort By:**
   - Priority (Critical → High → Medium → Low)
   - Then by: Created Date (oldest first)

4. **Columns to Display:**
   - Title
   - Status
   - Priority
   - Type
   - Effort (if using custom field)

### Pro Settings:
- **Add a "Limit" view:** Filter by `priority: critical OR priority: high` to see only Q1 items
- **Add a "Next Week" view:** Filter by `Quarter: Q1` AND `Status: Open`

### What This Shows:
- Complete backlog of 100+ individual tasks
- Prioritized by quarter and effort
- Clear work breakdown for planning

### How to Use:
- **Weekly planning:** Filter for Q1 critical/high, pick 12-15 items
- **Sprint planning:** See all available work for your capacity
- **Capacity planning:** Group by effort to balance sprints

---

## View 4: Current Sprint
**Purpose:** Track work in progress this week/sprint

### Configuration Steps:
1. **Filter:**
   - `label: status:in progress` (Issues you're actively working on)
   - Or: `Status: In Progress`

2. **Sort By:**
   - Updated (Newest first - what you're working on now)

3. **Columns to Display:**
   - Title
   - Status
   - Assignee
   - Updated
   - Priority

### Optional: Create 2 variants:
**Active (In Progress):**
- Filter: `status: in progress`
- Shows: Code being written right now

**Review (Code Review):**
- Filter: `status: needs review` OR `status: under review`
- Shows: Code waiting for feedback

### What This Shows:
- What you're working on right now (3-5 items typically)
- What's waiting for code review
- Quick context switching overview

### How to Use:
- **Daily standup:** Check this view to report progress
- **Blocker identification:** See what's stuck or waiting
- **Priority switching:** See when to pause one task for another
- **Context:** Quickly remember what you were working on

---

## View 5: 2026 ROADMAP
**Purpose:** High-level strategic view of the entire year

### Configuration Steps:
1. **Filter:**
   - ALL issues (no filter, or include epics + features + backlog items)

2. **Group By:**
   - Quarter (first level)
   - Then Epic (second level)
   - Then Status

3. **Sort By:**
   - None (maintains quarter/epic grouping)

4. **Columns to Display:**
   - Title
   - Status
   - Type
   - Priority

### Layout Suggestion:
```
Q1 2026
├─ Epic 1.1: LangGraph Agent Orchestration
│  ├─ Feature 1.1.1: Planning Agent
│  │  ├─ PBI: Task 1
│  │  ├─ PBI: Task 2
│  ├─ Feature 1.1.2: Coding Agent
│  ├─ ... (other features)
├─ Epic 1.2: Intelligent Context Management
├─ Epic 1.3: Developer Experience & Observability

Q2 2026
├─ Epic 2.1: Multi-Repository Orchestration
├─ Epic 2.2: Enterprise Authentication & Multi-Tenancy

... (Q3 and Q4)
```

### What This Shows:
- Everything you committed to for 2026 in one view
- Visual progress through the year
- Understand the full scope and sequencing

### How to Use:
- **Quarterly reviews:** Check progress at end of Q1/Q2/Q3
- **Stakeholder updates:** Show what you've done and what's coming
- **Planning:** See dependencies between quarters
- **Motivation:** See all the work you've completed throughout year

---

## Quick Setup Checklist

### For Each View: Follow These Steps

1. **Click the "+" button** in your Project sidebar to add/edit a view
2. **Give it the exact name** shown above (Epics, Features, Backlog Items, Current Sprint, 2026 ROADMAP)
3. **Click the filter icon** and add filters from Configuration Steps
4. **Click "Group by"** button and select grouping option
5. **Click "Sort by"** button and select sort option
6. **Click settings icon** to customize visible columns
7. **Save the view**

### Setting Up Filters in GitHub Projects:
- Click the **Filter icon** (looks like a funnel)
- Click **Add filter**
- Select field (e.g., `Labels` for `label: hierarchy:pbi`)
- Select value (e.g., `hierarchy: pbi`)
- Add more filters with AND/OR logic
- Click **Apply**

---

## Label Reference

Use these labels to filter views effectively:

**Hierarchy:**
- `hierarchy: epic` - All epics
- `hierarchy: feature` - All features
- `hierarchy: pbi` - All PBIs (individual tasks)

**Priority:**
- `priority: critical` - Q1 must-dos
- `priority: high` - Q1 important / Q2-Q3 should-do
- `priority: medium` - Q2-Q4 nice-to-have
- `priority: low` - Future consideration

**Type:**
- `type: agents` - LLM agent development
- `type: backend` - API and services
- `type: frontend` - UI and React
- `type: infrastructure` - DevOps, CI/CD, monitoring

**Status:**
- `status: committed` - Committed to upcoming sprint (weekly planning)
- `status: in progress` - Currently being worked on
- `status: needs review` - Waiting for code review
- `status: blocked` - Blocked on something
- `status: done` - Completed

---

## Advanced: Custom Fields

If you want even more power, add these custom fields to your project:

### Field 1: Quarter
- **Type:** Single select
- **Options:** Q1 2026, Q2 2026, Q3 2026, Q4 2026
- **Use:** Filter by `Quarter: Q1 2026` to see only this quarter's work

### Field 2: Effort
- **Type:** Single select
- **Options:** Small (1-2d), Medium (3-5d), Large (1-2w)
- **Use:** Balance sprints with `Effort: Small, Medium, Large`

### Field 3: Epic
- **Type:** Text
- **Usage:** Link to parent epic (e.g., "#12 LangGraph")
- **Use:** Manually track feature→epic relationships if needed

### Field 4: Feature
- **Type:** Text
- **Usage:** Link to parent feature (e.g., "#21 Planning Agent")
- **Use:** Track PBI→feature relationships

### Field 5: Status (alternative to labels)
- **Type:** Single select
- **Options:** Backlog, Ready, In Progress, Under Review, Done
- **Use:** More visible than labels in table view

---

## Pro Tips

### 1. Use "Save as..." to Create Quick Access
- Right-click any view → "Save as..."
- Create multiple variants (e.g., "Q1 This Week" vs "Q1 Backlog")

### 2. Create a "Dashboard" view
- Show only Epics and Features (filter out PBIs)
- This is your executive summary

### 3. Create a "My Work" view
- Filter: `assignee: @me`
- Shows all your assigned work across all quarters

### 4. Create a "Blockers" view
- Filter: `label: status:blocked`
- Quick view of what's stuck

### 5. Create a "Ready to Start" view
- Filter: `Status: Open` AND `Feature: [feature you're about to start]`
- See all PBIs for a feature you're ready to work on

---

## Troubleshooting

### Issues not showing in a view?
- **Check filters:** Click filter icon, verify all filters are correct
- **Check labels:** Ensure issues have the labels you're filtering for
- **Check limit:** Some views may have a limit - adjust in view settings

### Can't group by what I want?
- **For Epic/Feature:** These require custom fields (advanced GitHub Projects feature)
- **For Quarter/Status:** Use these fields if they're not working with grouping
- **Workaround:** Sort instead of group, or create multiple smaller views

### Performance slow with 100+ issues?
- **Add filters:** Narrow the scope (e.g., filter by quarter or priority)
- **Create multiple views:** Don't try to show everything in one view
- **Archive done items:** Move completed issues to a "Done" column

---

## Example: Setting Up "Backlog Items" View Step-by-Step

1. In your project, click **Add view** → **Table**
2. Name it: `Backlog Items`
3. Click **Filter**:
   - Filter 1: `label: hierarchy: pbi` ✓
   - Filter 2: `status: != done` (or manually keep open items)
4. Click **Group by**: Select `Custom field` → `Priority`
5. Click **Sort**: Select `Priority` → High to Low
6. Click **Columns**: Keep Title, Status, Priority, Type visible
7. Click **Save**

Now you have a backlog view showing:
```
Priority: Critical
├─ [PBI] Task 1
├─ [PBI] Task 2
├─ [PBI] Task 3

Priority: High
├─ [PBI] Task 4
├─ [PBI] Task 5
```

---

## Next Steps

1. **This week:** Set up all 5 views using configurations above
2. **Tomorrow:** Use "Current Sprint" to track daily work
3. **Next Monday:** Use "Backlog Items" for weekly planning
4. **End of Q1:** Use "2026 ROADMAP" to review progress

---

Last Updated: 2025-12-21
Contact: Your GitHub Issues for detailed discussions
