# Storybook Guide - CodeGraph

Complete guide to using and maximizing Storybook for CodeGraph component development.

## Quick Start

```bash
# Start Storybook dev server (http://localhost:6006)
npm run storybook

# Build static Storybook site (for deployment)
npm run build-storybook
```

## What is Storybook?

Storybook is a tool for developing and showcasing UI components in isolation. It allows you to:

- 🎨 **Build** components without worrying about app dependencies
- 📚 **Document** components with interactive examples
- 🧪 **Test** components visually and functionally
- 🔍 **Debug** components in a controlled environment
- 👥 **Collaborate** by sharing component documentation
- ♿ **Check accessibility** issues automatically

## Features in CodeGraph's Storybook

### 1. **Auto-Docs**

- Automatically generates documentation from your stories
- No extra effort needed - stories create docs automatically

### 2. **Built-in Addons**

| Addon            | Purpose                                      |
| ---------------- | -------------------------------------------- |
| **Essentials**   | Controls, docs, viewport, toolbar            |
| **Interactions** | Test user interactions (clicks, form inputs) |
| **Links**        | Navigate between stories                     |
| **A11y**         | Check accessibility compliance (WCAG)        |

### 3. **Controls Panel**

- Interactive controls to test component props
- Change variants, sizes, states in real-time
- No code reload needed

### 4. **Global Decorators**

- Luminous theme applied to all stories
- Ensures consistent design system appearance

## Story Structure

### Basic Story Template

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from '@/components/MyComponent';

// 1. Define metadata
const meta = {
  title: 'Components/MyComponent',           // Navigation path
  component: MyComponent,                     // Component to showcase
  tags: ['autodocs'],                        // Enable auto-docs
  argTypes: {                                // Control definitions
    variant: {
      control: 'select',
      options: ['default', 'primary'],
      description: 'Visual style variant',
    },
  },
  args: {                                    // Default props
    children: 'Click me',
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// 2. Define individual stories
export const Default: Story = {
  args: { variant: 'default' },
};

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Interactive: Story = {
  render: (args) => <MyComponent {...args} />,
  play: async ({ canvasElement }) => {
    // Test user interactions here
  },
};
```

## Story Categories

### Current Stories in CodeGraph

```
stories/
├── components/          # Reusable UI components
│   ├── Button.stories.tsx
│   ├── Input.stories.tsx
│   ├── Card.stories.tsx
│   └── AuthComponents.stories.tsx
├── foundations/         # Design system foundations
│   ├── Colors.stories.tsx
│   ├── Typography.stories.tsx
│   └── Effects.stories.tsx
├── compositions/        # Complex component combinations
│   └── AuthFlows.stories.tsx
└── icons/              # Icon system showcase
    └── Icons.stories.tsx (NEW!)
```

## How to Write Stories

### 1. **Simple Story (Single Variant)**

```typescript
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Button text',
  },
};
```

### 2. **Grid Story (Multiple Variants)**

```typescript
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <MyComponent variant="default" />
      <MyComponent variant="primary" />
      <MyComponent variant="secondary" />
    </div>
  ),
};
```

### 3. **Interactive Story (With User Actions)**

```typescript
export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button');
    await userEvent.click(button);
  },
};
```

### 4. **Documentation Story (MDX)**

Create `.stories.mdx` files for pure documentation:

```mdx
# My Component

This is a component that does X, Y, and Z.

## Usage

\`\`\`tsx

<MyComponent variant="primary">Click me</MyComponent>
\`\`\`

## Props

- **variant**: Visual style ('default', 'primary')
- **onClick**: Click handler function
```

## Advanced Features

### Control Types

```typescript
argTypes: {
  variant: {
    control: 'select',                    // Select dropdown
    options: ['default', 'primary'],
  },
  disabled: {
    control: 'boolean',                   // Toggle switch
  },
  count: {
    control: 'number',                    // Number input
  },
  label: {
    control: 'text',                      // Text input
  },
  bgColor: {
    control: 'color',                     // Color picker
  },
  date: {
    control: 'date',                      // Date picker
  },
}
```

### Play Function (Testing Interactions)

```typescript
import { userEvent, within } from '@storybook/test-utils';

export const FormInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    const button = canvas.getByRole('button');

    await userEvent.type(input, 'Hello');
    await userEvent.click(button);
  },
};
```

### Viewport Testing

```typescript
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'iphone12', // Test on iPhone 12
    },
  },
};
```

## Tips for Maximizing Storybook

### 1. **Document Everything**

- Add descriptions to all components
- Include usage examples
- Document edge cases

### 2. **Test All States**

- Default state
- Hover/active states
- Disabled state
- Error states
- Loading states

### 3. **Use Accessibility Panel**

- Click the **A11y** tab
- Check for WCAG violations
- Verify color contrast
- Test with screen readers

### 4. **Organize Stories Hierarchically**

```
title: 'Components/Forms/Input'          // Creates: Components > Forms > Input
title: 'Design System/Colors'            // Creates: Design System > Colors
```

### 5. **Share with Team**

- Build Storybook: `npm run build-storybook`
- Deploy static files to Vercel/Netlify
- Share design system with non-developers
- Design-to-code collaboration

### 6. **Create Stories First**

- **Story-Driven Development**: Write stories before components
- Validates component API
- Forces good component design
- Documentation is always up-to-date

## Keyboard Shortcuts

| Shortcut | Action                 |
| -------- | ---------------------- |
| `D`      | Toggle docs panel      |
| `A`      | Toggle addons panel    |
| `Z`      | Toggle zoom            |
| `S`      | Toggle sidebar         |
| `T`      | Search stories (cmd+K) |

## Common Patterns

### Status Colors

```typescript
export const StatusVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Component variant="success" />    {/* Green */}
      <Component variant="warning" />    {/* Yellow */}
      <Component variant="danger" />     {/* Red */}
      <Component variant="info" />       {/* Blue */}
    </div>
  ),
};
```

### Size Variants

```typescript
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Component size="sm" />
      <Component size="md" />
      <Component size="lg" />
      <Component size="xl" />
    </div>
  ),
};
```

### Dark Mode

```typescript
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark bg-gray-900 p-4">
        <Story />
      </div>
    ),
  ],
};
```

## Real-World Example: Icon Stories

Check out `/src/stories/icons/Icons.stories.tsx` for a complete icon system showcase:

- ✅ Size variants grid
- ✅ Color variants comparison
- ✅ All standard icons
- ✅ Custom variant icons
- ✅ Brand icons
- ✅ Individual story examples
- ✅ Accessibility labels

## Best Practices Checklist

- [ ] Every component has at least one story
- [ ] Stories include all major variants
- [ ] Props are documented with descriptions
- [ ] Stories are organized by category (Components, Foundations, Compositions)
- [ ] Complex components have interaction stories
- [ ] Stories test edge cases (empty, error, loading)
- [ ] Accessibility is verified (A11y addon)
- [ ] Team can view stories in browser
- [ ] Documentation is kept current

## Troubleshooting

### Stories Not Appearing?

- Check file naming: `*.stories.tsx` or `*.stories.mdx`
- Verify path in `.storybook/main.ts`
- Restart Storybook dev server

### Controls Not Working?

- Ensure `argTypes` is defined
- Use correct control types
- Check prop types match component

### Styling Issues?

- Global CSS loaded in `preview.tsx`
- Check Tailwind is configured
- Verify CSS classes are available

## Resources

- 📖 [Storybook Docs](https://storybook.js.org/docs/react/get-started/introduction)
- 🎥 [Storybook Tutorials](https://storybook.js.org/tutorials/)
- 🧪 [Testing in Storybook](https://storybook.js.org/docs/react/workflows/testing-with-storybook)
- ♿ [Accessibility Testing](https://storybook.js.org/docs/react/writing-stories/accessibility-testing)

## Next Steps

1. **Run Storybook**: `npm run storybook`
2. **View Icon Stories**: Navigate to `Icons > System`
3. **Add Stories**: Create stories for new components
4. **Test Interactions**: Use play functions for UX testing
5. **Share**: Deploy built Storybook to team

---

Happy storytelling! 📚✨
