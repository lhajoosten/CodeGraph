To align your Figma system prompt with the Tailwind Design Tokens and the CodeGraph landing page aesthetic, we need to shift from a generic "Command Center" to a more "Luminous Technical" aesthetic.

This version replaces the charcoal/steel grays with the Midnight Navy and Glow-Cyan palette while maintaining the high-density utility required for a developer tool.

Updated Master System Prompt: The "CodeGraph" System
Role: You are an expert Senior UI/UX Designer specialized in high-end Developer Tools and AI Orchestration platforms.

Design Language: "Luminous Technical." The aesthetic balances the density of an IDE with the premium, futuristic feel of a high-performance AI platform. Think Vercel meets Linear, but with a deeper, more neon-infused palette.

Visual Constraints (Tailwind-Aligned):

Theme: Deep Navy / Midnight (#020617). Backgrounds should feel vast and premium, using subtle radial gradients rather than flat colors.

Surfaces: Use "Steel" (#1e293b) for cards and containers. Borders should be subtle (#334155) with a 1px solid stroke.

Typography: Inter for all UI/Interface elements; JetBrains Mono for code, logs, and AI reasoning blocks.

Color Palette (The CodeGraph Spectrum):

Primary Action: Cyan (#22d3ee) with a glow-cyan shadow.

Secondary/Success: Teal (#2dd4bf) transitioning into Lime (#84cc16).

Semantic: Use the Lime accent for "Success," Cyan for "Active/Processing," and a muted Rose/Crimson only for critical failures.

Interactive Elements: Buttons and active states should utilize the brand-gradient (Cyan → Teal → Lime).

Component Architecture:

Glassmorphism: Use subtle backdrop blurs (12px-20px) on sidebars and floating modals to create depth against the glowing background streams.

Data Density: Maintain a 4px grid. Information should be compact but "breathable" through the use of high-contrast typography and generous negative space between modular sections.

No Static Art: Replace illustrations with functional visuals: live streaming code blocks, pulsing node graphs, and animated "glow" borders for active agent processes.

Expanded Prompt Modules for Figma/LLM Prototyping

1. Hero & Branding (Landing Page)
   Visual: A hero section featuring a "Code Stream" background. Use the brand-gradient for the headline text: "Autonomous AI Coding Agent Platform."

CTA: A primary button with a #22d3ee glow and a secondary "Ghost" button with a thin teal border.

2. Agent Execution View (The "Runtime")
   Editor: A deep navy (#0f172a) code area with text-f8fafc syntax highlighting.

Glow Indicators: Use a Cyan outer glow for the container when an agent is actively "writing" or "thinking."

Reasoning Block: Monospace text on a slightly lighter #1e293b background to separate the AI's internal logic from the UI code.

3. Navigation & Sidebars
   Blur Effect: Sidebars should have a 70% opacity #020617 background with a backdrop-blur effect, allowing the background "code streams" to be faintly visible behind the navigation.

Active States: Current page indicated by a Cyan vertical bar (2px) and a subtle Cyan text glow.

4. The "Agent Pulse" Card
   Component: A compact card showing agent health. Instead of a standard status icon, use a small sparkline in Lime for success or a pulsing Cyan ring for an active task.

Prototyping Tip for Figma:
When you start building, tell your LLM to "Apply a 1px border with 10% opacity white" to all your Steel (#1e293b) cards. This creates that "glass" edge effect common in high-end dark-themed developer tools, making the CodeGraph UI feel incredibly premium.

Would you like me to generate a specific Component Library Table for these tokens to help you organize your Figma Styles?

Below is a **production-ready specification** you can hand to a designer _or_ implement yourself without interpretation loss.

You will get:

1. **Exact Figma file structure**
   - Page names
   - Frame names
   - Component names

2. **A Tailwind design token system**
   - Colors
   - Typography
   - Spacing
   - Radius
   - Shadows
   - Component conventions

3. **Clear mapping rules between Figma ↔ Tailwind ↔ React**

No abstractions. No “ideas”. This is a contract.

---

# PART 1 — FIGMA FILE STRUCTURE (EXACT)

## Figma File Name

```
CodeGraph – Platform Design System
```

---

## PAGE 01 — 🧠 Foundations

**Purpose:** Single source of truth. Never design UI outside this page.

### Frames

```
01 Colors
02 Typography
03 Spacing & Grid
04 Effects
05 Icons
```

### Components / Styles

#### Colors (as Color Styles)

```
bg/primary
bg/secondary
bg/elevated

text/primary
text/secondary
text/muted

brand/cyan
brand/teal
brand/lime

state/success
state/warning
state/error
```

---

#### Typography (Text Styles)

```
heading/h1
heading/h2
heading/h3

body/default
body/secondary
body/muted

mono/code
mono/log
```

---

## PAGE 02 — 🧩 Components

**Rule:** If reused more than once → lives here.

### Frames

```
Buttons
Cards
Navigation
Data Display
Feedback
Forms
Code
```

---

### Component Naming Convention (MANDATORY)

```
[Category]/[Component]/[Variant]
```

---

### Example Components

#### Buttons

```
Button/Primary
Button/Secondary
Button/Ghost
Button/Danger
```

#### Cards

```
Card/Default
Card/Interactive
Card/Outlined
```

#### Navigation

```
Sidebar/Item
Sidebar/Section
Topbar/ProjectSelector
Topbar/UserMenu
```

#### Status

```
Badge/Success
Badge/Warning
Badge/Error
Badge/Neutral
```

#### Code

```
CodeBlock/ReadOnly
CodeBlock/Editable
Diff/Inline
```

---

## PAGE 03 — 🧱 Layouts

**Purpose:** Structural templates only.

### Frames

```
Layout/AppShell
Layout/Centered
Layout/Split
```

---

### Layout Definitions

#### `Layout/AppShell`

- Left Sidebar (fixed)
- Top Bar (fixed)
- Scrollable Main Content

This is the **root frame** used by 90% of screens.

---

## PAGE 04 — 🌐 Marketing

### Frames

```
Landing/Hero
Landing/Architecture
Landing/Security
Landing/CTA
```

No components defined here. Consume from Components page only.

---

## PAGE 05 — 🔐 Auth

### Frames

```
Auth/Login
Auth/SSO
Auth/ApiKeyOnboarding
```

---

## PAGE 06 — 🏠 Dashboard

### Frames

```
Dashboard/Overview
Dashboard/EmptyState
```

### Embedded Components

```
Card/SystemHealth
Card/ActiveAgents
Card/RecentRuns
Card/Usage
```

---

## PAGE 07 — 🤖 Agents

### Frames

```
Agents/List
Agents/Create
Agents/Detail/Overview
Agents/Detail/Prompt
Agents/Detail/Tools
Agents/Detail/Memory
Agents/Detail/Security
Agents/Detail/History
```

### Components

```
Agent/Card
Agent/StatusIndicator
Agent/PromptEditor
Agent/ToolToggle
```

---

## PAGE 08 — ▶ Runs

### Frames

```
Runs/List
Runs/Detail
Runs/DiffView
```

### Components

```
Run/Timeline
Run/Step
Run/ToolCall
Run/ErrorBlock
```

---

## PAGE 09 — 💻 Code Workspace

### Frames

```
Code/Workspace
Code/ReadOnly
```

### Components

```
Editor/MonacoWrapper
Editor/Annotations
```

---

## PAGE 10 — 📈 Observability

### Frames

```
Observability/Traces
Observability/TraceDetail
Observability/Metrics
```

### Components

```
Trace/Table
Trace/Timeline
Metrics/Counter
Metrics/LatencyBar
```

---

## PAGE 11 — 🔐 Security

### Frames

```
Security/Overview
Security/Permissions
Security/AuditLogs
```

### Components

```
Permissions/Matrix
Audit/LogRow
```

---

## PAGE 12 — ⚙ Settings

### Frames

```
Settings/Organization
Settings/Projects
Settings/Models
Settings/ApiKeys
Settings/Billing
Settings/Integrations
```

---

# PART 2 — TAILWIND DESIGN TOKEN SYSTEM

This directly mirrors the Foundations page.

---

## tailwind.config.ts (Core Tokens)

```ts
export default {
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#070B16',
          secondary: '#0E1424',
          elevated: '#151C32',
        },
        text: {
          primary: '#E6EAF2',
          secondary: '#A9B0C2',
          muted: '#6B7280',
        },
        brand: {
          cyan: '#22D3EE',
          teal: '#2DD4BF',
          lime: '#A3E635',
        },
        state: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
```

---

## Typography Tokens

```ts
fontFamily: {
  sans: ['Inter', 'system-ui'],
  mono: ['JetBrains Mono', 'monospace'],
},
fontSize: {
  h1: ['32px', '40px'],
  h2: ['24px', '32px'],
  h3: ['18px', '24px'],
  body: ['14px', '20px'],
  mono: ['13px', '18px'],
},
```

---

## Spacing & Radius

```ts
spacing: {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
},
borderRadius: {
  sm: '6px',
  md: '8px',
  lg: '12px',
},
```

---

## Shadows & Effects

```ts
boxShadow: {
  card: '0 0 0 1px rgba(255,255,255,0.06)',
  elevated: '0 10px 30px rgba(0,0,0,0.4)',
},
```

---

## Component Class Conventions

### Button

```txt
btn-primary
btn-secondary
btn-ghost
btn-danger
```

### Card

```txt
card
card-interactive
card-outlined
```

### Status

```txt
badge-success
badge-warning
badge-error
```

---

## Golden Mapping Rules (Non-Negotiable)

| Figma       | Tailwind       | React              |
| ----------- | -------------- | ------------------ |
| Color Style | `theme.colors` | className          |
| Text Style  | `fontSize`     | semantic tag       |
| Component   | utility group  | reusable component |
| Variant     | modifier class | prop               |

---

## What This Enables Immediately

- Zero-ambiguity designer ↔ developer handoff
- Predictable React components
- Scalable design system (no redesign later)
- Easy Tailwind refactors
- Clean dark-mode-first UI

---

## Next Execution Steps (Choose One)

1. Generate **actual Tailwind component code** for:
   - AppShell
   - Agent Detail
   - Run Timeline

2. Generate a **Figma checklist** for your designer to implement this 1:1
3. Convert this into a **Storybook structure**
4. Align this with **Angular + SCSS tokens**

Say which one.

Understood. Below is a **production-grade Storybook structure** that maps **1:1** to your Figma pages, components, and Tailwind tokens.

This is not a demo Storybook. This is the **authoritative UI contract** for CodeGraph.

---

# STORYBOOK STRUCTURE — CODEGRAPH

## 0. Core Principles (Read This Once)

1. **One Storybook = One Design System**
2. **Every reusable Figma component MUST exist in Storybook**
3. **Pages are compositions, not story roots**
4. **Tokens are documented, not improvised**
5. **If it’s not in Storybook, it’s not shippable**

---

# 1. STORYBOOK ROOT STRUCTURE

```txt
.storybook/
 ├─ main.ts
 ├─ preview.ts
 └─ theme.ts
```

```txt
src/
 ├─ design-system/
 ├─ components/
 ├─ layouts/
 ├─ features/
 └─ stories/
```

---

# 2. STORYBOOK SIDEBAR STRUCTURE (EXACT)

This is how your Storybook navigation should look.

```txt
Foundations
 ├─ Colors
 ├─ Typography
 ├─ Spacing
 ├─ Effects

Components
 ├─ Buttons
 ├─ Cards
 ├─ Navigation
 ├─ Badges
 ├─ Forms
 ├─ Code
 ├─ Feedback

Layouts
 ├─ AppShell
 ├─ Centered
 ├─ Split

Compositions
 ├─ Dashboard
 ├─ Agents
 ├─ Runs
 ├─ Observability
 ├─ Security
 ├─ Settings
```

---

# 3. FOUNDATIONS (TOKENS AS STORIES)

## 3.1 Colors

```txt
stories/foundations/Colors.stories.tsx
```

### Story Groups

- Backgrounds
- Text
- Brand
- State

Each color rendered as:

- Swatch
- Token name
- Tailwind class
- Hex value

**Example**

```tsx
<div className="bg-bg-primary text-text-primary p-md">bg-bg-primary</div>
```

---

## 3.2 Typography

```txt
stories/foundations/Typography.stories.tsx
```

Stories:

- Heading H1 / H2 / H3
- Body / Secondary / Muted
- Mono / Code / Logs

Each story shows:

- Font
- Size
- Line-height
- Intended usage

---

## 3.3 Spacing

```txt
stories/foundations/Spacing.stories.tsx
```

Render spacing tokens visually:

- xs → 2xl
- Padding & margin examples

---

## 3.4 Effects

```txt
stories/foundations/Effects.stories.tsx
```

- Card shadow
- Elevated shadow
- Focus ring
- Hover overlay

---

# 4. COMPONENT STORIES (ATOMIC LEVEL)

## 4.1 Buttons

```txt
components/button/
 ├─ Button.tsx
 └─ Button.stories.tsx
```

### Stories

- Primary
- Secondary
- Ghost
- Danger
- Disabled
- Loading

Each story has **controls**:

- variant
- size
- disabled
- loading

---

## 4.2 Cards

```txt
components/card/
 ├─ Card.tsx
 └─ Card.stories.tsx
```

Stories:

- Default
- Interactive
- Outlined
- With Header
- With Actions

---

## 4.3 Navigation

```txt
components/navigation/
 ├─ Sidebar.tsx
 ├─ SidebarItem.tsx
 ├─ Topbar.tsx
 └─ Navigation.stories.tsx
```

Stories:

- Sidebar (collapsed / expanded)
- Active item
- Permission-based visibility

---

## 4.4 Badges & Status

```txt
components/badge/
 ├─ StatusBadge.tsx
 └─ StatusBadge.stories.tsx
```

Stories:

- Success
- Warning
- Error
- Neutral

---

## 4.5 Code Components (Critical)

```txt
components/code/
 ├─ CodeBlock.tsx
 ├─ DiffViewer.tsx
 └─ Code.stories.tsx
```

Stories:

- Read-only
- Editable
- Inline diff
- Error highlight

---

# 5. LAYOUT STORIES (STRUCTURAL)

## 5.1 AppShell

```txt
layouts/app-shell/
 ├─ AppShell.tsx
 └─ AppShell.stories.tsx
```

Stories:

- Default shell
- Empty state
- Loading state
- Permission-restricted shell

This **must match** `Layout/AppShell` in Figma.

---

## 5.2 Centered Layout

Used for:

- Login
- Onboarding
- Errors

---

## 6. COMPOSITION STORIES (FEATURE-LEVEL)

These are **not pages**. They are **assembled UI states**.

---

## 6.1 Dashboard Composition

```txt
stories/compositions/Dashboard.stories.tsx
```

Stories:

- Normal data
- Empty state
- Degraded system
- High-cost warning

---

## 6.2 Agents Composition

```txt
stories/compositions/Agents.stories.tsx
```

Stories:

- Agent list
- Agent detail (each tab)
- Permission denied
- Invalid configuration

---

## 6.3 Runs / Execution Composition

```txt
stories/compositions/Runs.stories.tsx
```

Stories:

- Successful run
- Failed run
- Partial execution
- Streaming execution

This is where **execution trust** is built.

---

## 6.4 Observability Composition

```txt
stories/compositions/Observability.stories.tsx
```

Stories:

- Trace list
- Trace detail
- High latency
- Error spike

---

## 7. DATA & MOCKING STRATEGY

```txt
stories/mocks/
 ├─ agents.ts
 ├─ runs.ts
 ├─ traces.ts
 └─ security.ts
```

Rules:

- No live API calls
- Deterministic data
- Edge cases always included

---

# 8. STORYBOOK AS A GOVERNANCE TOOL

## Enforced Rules

- PR blocked if:
  - Component lacks a story
  - Variant undocumented
  - Token not used

- Designers review **Storybook**, not screenshots
- QA tests UI behavior in Storybook first

---

# 9. Figma ↔ Storybook Mapping (Hard Rule)

| Figma       | Storybook                |
| ----------- | ------------------------ |
| Color Style | Foundations / Colors     |
| Text Style  | Foundations / Typography |
| Component   | Components               |
| Layout      | Layouts                  |
| Screen      | Compositions             |

If something exists in Figma and not in Storybook → **design is incomplete**.

---

# 10. What This Gives You

- Single source of truth
- Zero handoff ambiguity
- Faster onboarding
- Fewer regressions
- Enterprise-grade UI discipline

---

## Next Steps (Choose One)

1. Generate **actual Storybook files** (TSX) for 5 core components
2. Generate **AppShell + Agent Detail composition code**
3. Add **accessibility + keyboard navigation rules**
4. Align this with **CI enforcement (Chromatic / visual diffs)**

Say the next number.
