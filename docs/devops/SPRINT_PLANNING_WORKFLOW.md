# Sprint Planning Workflow with "committed" Label

## Overview

Your sprint planning workflow uses a combination of the `status: committed` label and the "Current Sprint" view to track what you're working on each week.

**Flow:**
```
Backlog Items (no label)
    ↓
Weekly Planning (pick items)
    ↓
Add "status: committed" label
    ↓
Current Sprint view shows your week's work
    ↓
Move to "in progress" as you work
    ↓
Mark "done" or "needs review" when complete
    ↓
Remove "committed" label for cycle
```

---

## Label Definitions

### Status Labels (Mutually Exclusive)

Use **ONE** of these per issue at a time:

- **`status: committed`** - ⭐ **NEW**: Added to your upcoming sprint. This is your plan for the week. Issues with this label should appear in your "Current Sprint" view. You should have 12-15 of these each week.

- **`status: in progress`** - 🔨 You're actively working on this right now. Typically 2-5 issues at a time. Move here from "committed" when you start work.

- **`status: needs review`** - 👀 Code is written and waiting for review. Either you're reviewing your own work or waiting for external review.

- **`status: blocked`** - 🚫 Can't proceed. Document in a comment why it's blocked and what's needed to unblock.

### How They Flow Each Week

```
Monday (Planning):
- Pick 12-15 items from "Backlog Items" view
- Add "status: committed" label to each
- These show in "Current Sprint" view

Tuesday-Friday (Work):
- Move items to "status: in progress" as you start
- Move to "status: needs review" when done
- Mark "status: done" or close issue when complete
- Add "status: blocked" if you get stuck

Friday (Cleanup):
- Remove "status: committed" from completed items
- Remove "status: in progress" from finished items
- Note blockers for next week's planning
```

---

## Weekly Sprint Planning Checklist

### Step 1: Review Last Week (Friday 5pm or Monday 9am)
- [ ] Open "Current Sprint" view
- [ ] See what's still "committed" but not done
- [ ] Move blockers to "status: blocked" with notes
- [ ] Move completed items to "done"
- [ ] Remove "committed" label from done items

### Step 2: Plan This Week (Monday 10am)
- [ ] Open "Backlog Items" view
- [ ] Filter: `label: hierarchy:pbi AND NOT label: status:committed AND priority: critical OR priority: high`
- [ ] Sort by: Priority (high → medium)
- [ ] Pick 12-15 items for the week
  - Aim for mix: 3-4 small, 6-8 medium, 3-4 large
  - Try to pick from different features if possible

### Step 3: Commit to Week (Monday 11am)
- [ ] Add `status: committed` label to each selected issue
- [ ] Assign each to yourself (or team if applicable)
- [ ] Add a comment with week dates (e.g., "Committed for Jan 6-10")
- [ ] Open "Current Sprint" view to verify all 12-15 show up

### Step 4: Daily Standup (Every morning)
- [ ] Open "Current Sprint" view
- [ ] Check items in "in progress"
- [ ] Update any blockers
- [ ] Plan your day: pick 2-3 to focus on

### Step 5: End of Week Review (Friday 4pm)
- [ ] Count items completed (aim for 12-15)
- [ ] Note velocity (items/week)
- [ ] Document any blockers for next week
- [ ] Remove "committed" label from done items
- [ ] Celebrate your progress! 🎉

---

## "Current Sprint" View Configuration

This view shows only items committed for this week:

### Setup Instructions:
1. **Filter:**
   - `label: status:committed` (Required)
   - `OR label: status:in progress` (Optional - to see what you're working on)

2. **Group By:**
   - Status (so you see: In Progress, Needs Review, Done)

3. **Sort By:**
   - Priority (Critical → High → Medium)

4. **Columns to Display:**
   - Title
   - Status
   - Priority
   - Type
   - Effort

### What You See:
```
In Progress (actively working)
├─ [PBI] Task 1
├─ [PBI] Task 2
├─ [PBI] Task 3

Needs Review (waiting for feedback)
├─ [PBI] Task 4

Committed (ready to start)
├─ [PBI] Task 5
├─ [PBI] Task 6
├─ [PBI] Task 7
```

---

## Important: "committed" Label Usage

### When to ADD `status: committed`:
✅ Every Monday during sprint planning
✅ When finalizing your week's work plan
✅ Only 12-15 items per week (your capacity)
✅ When you're confident you can complete it

### When to REMOVE `status: committed`:
✅ When you move to "in progress"
✅ When you mark as "done"
✅ End of week (Friday) for cleanup
✅ If priorities change mid-week

### DON'T MIX with "in progress":
❌ Don't have both labels on same issue
❌ Remove "committed" when you start work
❌ Focus on one status per issue

---

## Workflow Examples

### Example 1: Normal Task Completion
```
Monday 9am:
- Issue #42 [PBI] Implement PlannerAgent
- Status: None
- Add label: status: committed

Tuesday 2pm:
- Start working on #42
- Remove label: status: committed
- Add label: status: in progress

Wednesday 5pm:
- Finish implementation
- Remove label: status: in progress
- Add label: status: needs review (for testing)

Thursday 10am:
- Tests pass, ready to close
- Remove label: status: needs review
- Close issue or mark done

Friday review:
- Issue #42 is completed ✓
- Not in "Current Sprint" anymore
```

### Example 2: Blocking Issue
```
Wednesday 3pm:
- Working on #45 [PBI] Build test harness
- Find out it needs #40 first
- Remove label: status: in progress
- Add label: status: blocked
- Comment: "Blocked on #40 (test runner). Waiting for..."

Thursday 2pm:
- #40 is now done
- Remove label: status: blocked
- Add back: status: in progress
- Resume work on #45
```

### Example 3: Mid-Week Priority Change
```
Wednesday morning:
- Working on #50 (low priority)
- Manager flags urgent bug (#55)
- Move #55 from backlog to sprint

Wednesday 9am:
- Remove "committed" from #50 (not critical)
- Add "committed" to #55
- Add "in progress" to #55
- Work on #55

Next week:
- #50 goes back to backlog
- Pick different task for Wednesday afternoon
```

---

## Tips for Sprint Success

### 1. Be Realistic with "committed"
- Only commit what you can finish
- 12-15 PBIs is ambitious for one person
- Better to commit 10 and finish all than commit 15 and finish 8

### 2. Use Labels Correctly
- One status per issue (don't mix)
- Add "committed" only once per sprint
- Remove when appropriate
- Clean up at end of week

### 3. Track Your Velocity
- Count items completed each week
- Note if you're consistently faster/slower than 12-15
- Adjust future estimates accordingly

### 4. Communicate Blockers Early
- Label as "blocked" immediately when stuck
- Don't wait until Friday to mention
- Document what's needed to unblock
- Ask for help in the issue comments

### 5. Use "Committed" for Accountability
- It's your promise to yourself for the week
- Celebrate when you hit 12-15 ✓
- Learn when you consistently overshoot or undershoot
- Adjust next week accordingly

---

## Integration with Other Views

### "Backlog Items" View → Planning
- View shows all available work
- Filter by priority and quarter
- **SELECT items** → ADD "committed" label
- These selected items move to "Current Sprint" view

### "Current Sprint" View → Daily Work
- Shows only committed + in progress items
- This is your daily reference
- UPDATE statuses as you work
- MOVE items to "done" when complete

### "2026 ROADMAP" View → Progress
- Shows big picture (all epics/features)
- Helps see progress across quarters
- Reference to remember WHY you're doing sprint work

---

## Clearing a Sprint (End of Week)

**Friday 5pm Cleanup:**

```bash
# Remove "committed" from all completed items
gh issue list --label "status: committed" --state open \
  | grep "DONE" \
  | xargs -I {} gh issue edit {} --remove-label "status: committed"

# Or manually:
# 1. Open "Current Sprint" view
# 2. Find items marked "done"
# 3. Click issue → Remove "status: committed" label
# 4. Close issue if not closed automatically
```

**This ensures:**
- Next week's planning is clean
- "Current Sprint" view resets
- You can track week-to-week velocity
- No stale "committed" items carried over

---

## FAQ

**Q: Can I have more than 15 "committed" items?**
A: Not recommended. Your capacity is 12-15 PBIs/week. More than that means you're overcommitting.

**Q: What if I don't finish all "committed" items?**
A: Normal! Move incomplete items back to backlog, remove "committed", and plan them for next week with lessons learned.

**Q: Should blockers still have "status: committed"?**
A: No, replace with "status: blocked". Once unblocked, re-add "committed".

**Q: Can I commit items mid-week?**
A: Yes, but plan to add only 1-2. Avoid major mid-week additions.

**Q: How do I balance different types of work?**
A: Pick items from different features and epics. E.g., 3 from agents, 3 from testing, 3 from frontend, etc.

**Q: What's "status: done"?**
A: You can mark issues as done, or they auto-close when you merge a PR. Either way, remove "committed" label.

---

## Success Example: Week 1 Sprint

**Monday Planning:**
- Review: No prior sprint, starting fresh
- Select 15 PBIs:
  - 5 critical (Planning Agent tasks)
  - 5 high (Testing/CI tasks)
  - 5 medium (infrastructure)
- Add "status: committed" to all 15
- Assign to self

**Tuesday-Thursday:**
- Daily: Check "Current Sprint" view
- Work: 2-3 items at a time
- Update: Move to "in progress" and "needs review"
- Unblock: Remove any "blocked" items by Wednesday

**Friday:**
- Review: 12 of 15 completed (80% - great!)
- Note: 1 blocked on LangChain (defer to next week)
- Note: 2 underestimated (move to next sprint)
- Cleanup: Remove "committed" from done items
- Prepare: Notes for Week 2 planning

**Next Monday:**
- Commit 13 new items (not 15, accounting for 2 underestimated)
- Re-commit the 1 blocker (now unblocked)
- Velocity: 12 items/week (consistent for planning)

---

Last Updated: 2025-12-21
Use this workflow every week for consistent progress throughout 2026!
