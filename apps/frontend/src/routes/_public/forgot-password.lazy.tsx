import { createLazyFileRoute } from '@tanstack/react-router';
import { AuthLayout, AuthCard, AuthHeader, ForgotPasswordForm } from '@/components/auth';

export const Route = createLazyFileRoute('/_public/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader title="Reset Password" subtitle="Enter your email to receive reset link" />

        <ForgotPasswordForm />
      </AuthCard>
    </AuthLayout>
  );
}
