import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthCard } from '@/components/auth/auth-card';

describe('AuthCard', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <AuthCard>
          <div>Test Content</div>
        </AuthCard>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render with Card component', () => {
      const { container } = render(
        <AuthCard>
          <div>Test</div>
        </AuthCard>
      );

      const card = container.querySelector('[class*="rounded"]');
      expect(card).toBeInTheDocument();
    });

    it('should render with luminousGlass variant styling', () => {
      const { container } = render(
        <AuthCard>
          <div>Test</div>
        </AuthCard>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('mx-auto', 'w-full', 'max-w-lg');
    });
  });

  describe('Props', () => {
    it('should accept multiple children', () => {
      render(
        <AuthCard>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </AuthCard>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should accept complex children', () => {
      render(
        <AuthCard>
          <form>
            <input type="email" placeholder="email@example.com" />
            <button>Submit</button>
          </form>
        </AuthCard>
      );

      expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have max-width constraint', () => {
      const { container } = render(
        <AuthCard>
          <div>Test</div>
        </AuthCard>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('max-w-lg');
    });

    it('should be centered with auto margin', () => {
      const { container } = render(
        <AuthCard>
          <div>Test</div>
        </AuthCard>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('mx-auto');
    });

    it('should be full width', () => {
      const { container } = render(
        <AuthCard>
          <div>Test</div>
        </AuthCard>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('w-full');
    });
  });

  describe('Accessibility', () => {
    it('should render semantic content', () => {
      render(
        <AuthCard>
          <h1>Login Form</h1>
          <form>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
          </form>
        </AuthCard>
      );

      expect(screen.getByText('Login Form')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });
});
