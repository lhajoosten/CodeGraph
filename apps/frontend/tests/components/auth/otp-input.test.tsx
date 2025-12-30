import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OTPInput } from '@/components/auth/otp-input';

describe('OTPInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render 6 input fields by default', () => {
      render(<OTPInput value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByDisplayValue('');
      expect(inputs).toHaveLength(6);
    });

    it('should render with custom length', () => {
      render(<OTPInput length={4} value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByDisplayValue('');
      expect(inputs).toHaveLength(4);
    });

    it('should display label and helper text', () => {
      render(<OTPInput value="" onChange={mockOnChange} />);

      expect(screen.getByText('Verification Code')).toBeInTheDocument();
      expect(screen.getByText(/Enter the 6-digit code/i)).toBeInTheDocument();
    });

    it('should have numeric input mode', () => {
      render(<OTPInput value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByDisplayValue('');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('inputMode', 'numeric');
      });
    });

    it('should have maxLength of 1', () => {
      render(<OTPInput value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByDisplayValue('');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('maxLength', '1');
      });
    });
  });

  describe('User Input', () => {
    it('should accept numeric input only', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="" onChange={mockOnChange} />);

      const firstInput = container.querySelector('input') as HTMLInputElement;

      await user.type(firstInput, 'a5b');

      expect(mockOnChange).toHaveBeenCalledWith('5');
    });

    it('should auto-advance to next field on digit entry', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      await user.type(inputs[0], '1');

      expect(inputs[1]).toHaveFocus();
    });

    it('should not auto-advance to next field on empty input', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      await user.type(inputs[0], 'a');

      expect(inputs[0]).toHaveFocus();
    });

    it('should fill all fields when pasting 6-digit code', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="" onChange={mockOnChange} />);

      const firstInput = container.querySelector('input') as HTMLInputElement;

      await user.type(firstInput, '123456');

      expect(mockOnChange).toHaveBeenLastCalledWith('123456');
    });

    it('should handle partial paste (fills remaining fields)', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="12" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      // Clear previous calls
      mockOnChange.mockClear();

      await user.type(inputs[2], '3456');

      expect(mockOnChange).toHaveBeenLastCalledWith('123456');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should move to previous field on backspace when current field is empty', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="1" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      // Focus second field
      await user.click(inputs[1]);

      // Backspace in empty field should move to previous
      await user.keyboard('{Backspace}');

      expect(inputs[0]).toHaveFocus();
    });

    it('should clear current field and stay on backspace when field has value', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="1" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      // Clear previous calls
      mockOnChange.mockClear();

      // Backspace in field with value should clear it
      await user.type(inputs[0], '{Backspace}');

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should navigate left with arrow key', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="123456" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      await user.click(inputs[2]);
      await user.keyboard('{ArrowLeft}');

      expect(inputs[1]).toHaveFocus();
    });

    it('should navigate right with arrow key', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="123456" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      await user.click(inputs[2]);
      await user.keyboard('{ArrowRight}');

      expect(inputs[3]).toHaveFocus();
    });

    it('should not navigate left from first field', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="1" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      await user.click(inputs[0]);
      await user.keyboard('{ArrowLeft}');

      expect(inputs[0]).toHaveFocus();
    });

    it('should not navigate right from last field', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="123456" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      await user.click(inputs[5]);
      await user.keyboard('{ArrowRight}');

      expect(inputs[5]).toHaveFocus();
    });
  });

  describe('Value Management', () => {
    it('should populate fields with initial value', () => {
      const { container } = render(<OTPInput value="123456" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      expect(inputs[0]).toHaveValue('1');
      expect(inputs[1]).toHaveValue('2');
      expect(inputs[2]).toHaveValue('3');
      expect(inputs[3]).toHaveValue('4');
      expect(inputs[4]).toHaveValue('5');
      expect(inputs[5]).toHaveValue('6');
    });

    it('should update when value prop changes', () => {
      const { rerender, container } = render(<OTPInput value="123" onChange={mockOnChange} />);

      let inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
      expect(inputs[0]).toHaveValue('1');
      expect(inputs[1]).toHaveValue('2');
      expect(inputs[2]).toHaveValue('3');

      rerender(<OTPInput value="456" onChange={mockOnChange} />);

      inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
      expect(inputs[0]).toHaveValue('4');
      expect(inputs[1]).toHaveValue('5');
      expect(inputs[2]).toHaveValue('6');
    });

    it('should call onChange with concatenated OTP', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');
      await user.type(inputs[2], '3');

      expect(mockOnChange).toHaveBeenLastCalledWith('123');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      const { container } = render(<OTPInput value="" onChange={mockOnChange} disabled={true} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      inputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      const { container } = render(<OTPInput value="" onChange={mockOnChange} disabled={true} />);

      const firstInput = container.querySelector('input') as HTMLInputElement;

      await user.type(firstInput, '1');

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should have teal border and glow when field has value', () => {
      const { container } = render(<OTPInput value="1" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      expect(inputs[0].className).toContain('border-brand-teal');
      expect(inputs[0].className).toContain('shadow-glow-teal');
    });

    it('should have default border when field is empty', () => {
      const { container } = render(<OTPInput value="" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      expect(inputs[0].className).toContain('border-border-primary');
    });
  });

  describe('Accessibility', () => {
    it('should have proper type attribute for text inputs', () => {
      const { container } = render(<OTPInput value="" onChange={mockOnChange} />);

      const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];

      inputs.forEach((input) => {
        expect(input).toHaveAttribute('type', 'text');
      });
    });

    it('should have accessible label', () => {
      render(<OTPInput value="" onChange={mockOnChange} />);

      const label = screen.getByText('Verification Code');
      expect(label).toBeInTheDocument();
    });
  });
});
