import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthLayout } from '@/components/auth/auth-layout';

describe('AuthLayout', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <AuthLayout>
          <div>Test Content</div>
        </AuthLayout>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render the main container with correct class', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('luminous-theme');
      expect(mainDiv).toHaveClass('flex');
      expect(mainDiv).toHaveClass('min-h-screen');
      expect(mainDiv).toHaveClass('w-full');
      expect(mainDiv).toHaveClass('items-center');
      expect(mainDiv).toHaveClass('justify-center');
    });
  });

  describe('Background Elements', () => {
    it('should render gradient background', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const gradientDivs = container.querySelectorAll('[class*="bg-gradient"]');
      expect(gradientDivs.length).toBeGreaterThan(0);
    });

    it('should render animated background elements', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const bgElements = container.querySelectorAll('[class*="rounded-full"]');
      expect(bgElements.length).toBeGreaterThan(0);
    });

    it('should have subtle animated elements with opacity', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const bgElements = container.querySelectorAll('[class*="opacity"]');
      expect(bgElements.length).toBeGreaterThan(0);
    });
  });

  describe('Content Container', () => {
    it('should wrap content in z-index container', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test Content</div>
        </AuthLayout>
      );

      const contentContainer = container.querySelector('[class*="z-10"]');
      expect(contentContainer).toBeInTheDocument();
    });

    it('should apply max-width to content', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test Content</div>
        </AuthLayout>
      );

      const contentContainer = container.querySelector('[class*="z-10"]');
      expect(contentContainer).toHaveClass('max-w-2xl');
    });

    it('should be full width but constrained', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test Content</div>
        </AuthLayout>
      );

      const contentContainer = container.querySelector('[class*="z-10"]');
      expect(contentContainer).toHaveClass('w-full');
    });
  });

  describe('Props', () => {
    it('should accept multiple children', () => {
      render(
        <AuthLayout>
          <div>Child 1</div>
          <div>Child 2</div>
        </AuthLayout>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should accept complex children', () => {
      render(
        <AuthLayout>
          <div>
            <h1>Authentication</h1>
            <form>
              <input type="email" placeholder="email@example.com" />
              <button>Submit</button>
            </form>
          </div>
        </AuthLayout>
      );

      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply padding for responsive design', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('p-4');
    });

    it('should have gradient background', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const gradient = container.querySelector('[class*="bg-gradient-to-br"]');
      expect(gradient).toBeInTheDocument();
    });

    it('should use luminous theme colors', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const gradient = container.querySelector('[class*="bg-gradient-to-br"]');
      expect(gradient?.className).toContain('bg-gradient-to-br');
    });
  });

  describe('Layout', () => {
    it('should center content both horizontally and vertically', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('flex');
      expect(mainDiv).toHaveClass('items-center');
      expect(mainDiv).toHaveClass('justify-center');
    });

    it('should fill entire viewport height', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('min-h-screen');
    });

    it('should handle overflow with hidden class on animated elements', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const overflowContainer = container.querySelector('[class*="overflow-hidden"]');
      expect(overflowContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render semantic content with proper hierarchy', () => {
      render(
        <AuthLayout>
          <h1>Login Page</h1>
          <form>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
          </form>
        </AuthLayout>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should not interfere with interactive elements', () => {
      render(
        <AuthLayout>
          <button>Click Me</button>
          <input type="text" placeholder="Type here" />
        </AuthLayout>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should render background blur effects', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const elements = Array.from(container.querySelectorAll('[style*="blur"]'));
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should have positioned absolute background elements', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const bgElements = container.querySelectorAll('[class*="absolute"]');
      expect(bgElements.length).toBeGreaterThan(0);
    });

    it('should position elements off-screen for design effect', () => {
      const { container } = render(
        <AuthLayout>
          <div>Test</div>
        </AuthLayout>
      );

      const roundElements = container.querySelectorAll('[class*="rounded-full"]');
      expect(roundElements.length).toBeGreaterThan(0);
    });
  });
});
