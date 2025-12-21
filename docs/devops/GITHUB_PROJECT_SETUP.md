# GitHub Project Setup Guide for CodeGraph 2026 Roadmap

## Overview

This guide will help you configure your GitHub Project board to track the 2026 development roadmap using the Epic → Feature → PBI hierarchy.

## Prerequisites

- GitHub Project (v2) already created
- All Epic, Feature, and PBI issues created in GitHub
- Hierarchy labels (`hierarchy: epic`, `hierarchy: feature`, `hierarchy: pbi`) created

## Step-by-Step Setup

### Step 1: Create Custom Fields

In your GitHub Project settings, create the following custom fields:

#### Field 1: Quarter
- **Type:** Single select
- **Options:**
  - Q1 2026
  - Q2 2026
  - Q3 2026
  - Q4 2026

#### Field 2: Effort
- **Type:** Single select
- **Options:**
  - Small (1-2 days)
  - Medium (3-5 days)
  - Large (1-2 weeks)

#### Field 3: Epic
- **Type:** Text
- **Description:** Link to parent epic (e.g., "#12 LangGraph Agent Orchestration")

#### Field 4: Feature
- **Type:** Text
- **Description:** Link to parent feature (e.g., "#21 Planning Agent Implementation")

#### Field 5: Status
- **Type:** Single select
- **Options:**
  - 📋 Backlog
  - 🔄 In Progress
  - 👀 Under Review
  - ✅ Done
  - ❌ Blocked

### Step 2: Create Views

Create the following views to organize and track work:

#### View 1: Roadmap (Primary View)
- **Group By:** Quarter
- **Sort By:** Priority (high to low)
- **Filter:** All issues
- **Purpose:** High-level overview of roadmap across quarters

**Column Configuration:**
- Title
- Status
- Effort
- Priority

#### View 2: Q1 Backlog
- **Filter:** Quarter = "Q1 2026" AND Status != "Done"
- **Sort By:** Priority (high to low)
- **Group By:** Epic
- **Purpose:** Plan next week's work, identify Q1 blockers

**Column Configuration:**
- Title
- Status
- Effort
- Feature
- Priority

#### View 3: Active Work
- **Filter:** Status = "In Progress" OR Status = "Under Review"
- **Sort By:** Updated (newest first)
- **Purpose:** Daily standup reference, identify blockers

**Column Configuration:**
- Title
- Status
- Assignee
- Updated date
- Priority

#### View 4: By Epic
- **Group By:** Epic
- **Sort By:** Priority
- **Filter:** Status != "Done"
- **Purpose:** Drill into specific epic details, track epic progress

**Column Configuration:**
- Title
- Status
- Effort
- Feature
- Priority

#### View 5: By Type
- **Group By:** Type label (type: backend, type: frontend, type: agents, type: infrastructure)
- **Sort By:** Priority
- **Purpose:** See work by technical area

**Column Configuration:**
- Title
- Status
- Effort
- Priority

#### View 6: Done (Archive)
- **Filter:** Status = "Done"
- **Sort By:** Updated (newest first)
- **Group By:** Quarter
- **Purpose:** Track completed work, celebrate milestones

**Column Configuration:**
- Title
- Completed date
- Effort
- Quarter

### Step 3: Set Up Automation

Configure these automation rules to keep the project in sync:

#### Automation 1: Auto-add Issues to Project
- **Trigger:** Issue created
- **Action:** Add to CodeGraph 2026 Roadmap project

#### Automation 2: Auto-update Status When PR Opened
- **Trigger:** Pull request opened linked to issue
- **Action:** Move issue to "Under Review" status

#### Automation 3: Auto-close Issue When PR Merged
- **Trigger:** Pull request merged linked to issue
- **Action:** Move issue to "Done" status (for PBIs only)

#### Automation 4: Auto-assign Epic from Issue Title
- **Trigger:** Issue created with specific titles
- **Action:** Populate Epic field based on pattern

### Step 4: Populate Custom Fields

1. **For all Epics:**
   - Quarter: Match epic's quarter (Q1, Q2, Q3, or Q4)
   - Status: Backlog
   - Priority: Critical (for Q1-Q2) or Medium (for Q3-Q4)

2. **For all Features:**
   - Quarter: Same as parent epic
   - Effort: As documented in feature description
   - Epic: Link to parent epic (e.g., "#12 LangGraph Agent Orchestration")
   - Status: Backlog
   - Priority: High (Q1-Q2) or Medium (Q3-Q4)

3. **For all PBIs:**
   - Quarter: Same as parent epic
   - Effort: As documented in PBI description
   - Epic: Link to epic
   - Feature: Link to parent feature
   - Status: Backlog
   - Priority: Critical/High (Q1-Q2) or Medium/Low (Q3-Q4)

### Step 5: Populate Issue Labels

Ensure all issues have appropriate labels:

**Hierarchy Labels (required):**
- `hierarchy: epic` - For all epics
- `hierarchy: feature` - For all features
- `hierarchy: pbi` - For all PBIs

**Type Labels (required):**
- `type: agents` - Agent-related work
- `type: backend` - Backend/API work
- `type: frontend` - Frontend/UI work
- `type: infrastructure` - DevOps/infrastructure

**Priority Labels (required):**
- `priority: critical` - Must do (Q1-Q2)
- `priority: high` - Important
- `priority: medium` - Should do
- `priority: low` - Nice to have

**Status Labels (optional, can use custom field instead):**
- `status: in progress`
- `status: needs review`
- `status: blocked`

## Workflow: How to Use Your Project

### Weekly Planning
1. Open **Q1 Backlog** view
2. Sort by Priority and Effort
3. Select 12-15 PBIs for the week (3-4 from different features if possible)
4. Assign to yourself
5. Update Status to "In Progress" when starting

### Daily Standup
1. Open **Active Work** view
2. Review all "In Progress" items
3. Identify blockers and dependencies
4. Update Status as work completes

### Epic Tracking
1. Open **By Epic** view
2. Check progress on each epic
3. Verify child features and PBIs are aligned
4. Update epic description if priorities change

### Sprint Review
1. Open **Done** view
2. See completed work by quarter
3. Calculate velocity (PBIs completed per week)
4. Identify patterns and blockers for retrospective

## Quick Links & Commands

### View Your Roadmap

```bash
# List all epics
gh issue list --label "hierarchy: epic" --state open

# List all features for a specific epic
gh issue list --label "hierarchy: feature" --search "Epic #12" --state open

# List all PBIs in progress
gh issue list --label "hierarchy: pbi" --label "status: in progress"

# List this week's work
gh issue list --assignee @me --state open --label "hierarchy: pbi"
```

### Create New Issue

Use the issue templates when creating issues:

```bash
# Create a new epic
gh issue create --template epic

# Create a new feature
gh issue create --template feature

# Create a new PBI
gh issue create --template pbi
```

### Update Issue Status

When starting work:
```bash
gh issue edit <issue-number> --add-label "status: in progress"
```

When finished:
```bash
gh issue edit <issue-number> --add-label "status: done" --remove-label "status: in progress"
```

## Tips for Success

### 1. Keep Descriptions Updated
- Update issue descriptions as requirements clarify
- Add comments for decisions and blockers
- Link related issues for context

### 2. Use Milestones for Monthly Goals
- Create monthly milestones (Q1.1, Q1.2, Q1.3, Q1.4)
- Add target issues to each milestone
- Track milestone completion as monthly reports

### 3. Regular Reviews
- **Weekly:** Check active work view, plan next week
- **Monthly:** Review monthly milestone, update high-level roadmap
- **Quarterly:** Full roadmap review, plan next quarter

### 4. Maintain Dependencies
- Link blocked issues to blocking issues
- Use issue body to document dependencies
- Review dependency graph before estimating

### 5. Track Velocity
- Record PBIs completed per week
- Track effort (small/medium/large) not just count
- Use velocity to improve estimates for future quarters

## Troubleshooting

### Issues not appearing in project?
- Verify automation rules are enabled
- Check that issue has at least one hierarchy label
- Manually add issue to project if needed

### Can't filter or group properly?
- Verify custom fields are created
- Check that field values match filter criteria exactly
- Use project settings to verify field configuration

### Duplicate issues?
- Search before creating new issues
- Link related issues with "Relates to" in description
- Close duplicates and consolidate

## Next Steps

1. Follow the step-by-step setup above
2. Populate custom fields for all issues
3. Create the 6 views recommended above
4. Configure automation rules
5. Start with Q1 Backlog view for weekly planning
6. Review the roadmap in your GitHub Project board

---

## Example Project Configuration Summary

**Project Name:** CodeGraph 2026 Roadmap

**Issues:** ~35 total (8 Epics + 27 Features + 50+ PBIs)

**Custom Fields:**
- Quarter (Q1/Q2/Q3/Q4)
- Effort (Small/Medium/Large)
- Epic (text link)
- Feature (text link)
- Status (Backlog/In Progress/Under Review/Done/Blocked)

**Views:** 6 (Roadmap, Q1 Backlog, Active Work, By Epic, By Type, Done)

**Labels:**
- Hierarchy: 3 labels
- Type: 4 labels
- Priority: 4 labels
- Status: 5 labels (optional)

**Automation:** 4 rules enabled

---

Last Updated: 2025-12-21
