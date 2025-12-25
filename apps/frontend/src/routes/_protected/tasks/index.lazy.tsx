import { createLazyFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { TaskList } from '@/components/tasks/task-list';
import { PageHeader } from '@/components/layout/page-header';

function TasksPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Tasks" description="Manage your AI-powered development tasks" />
        <TaskList />
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/tasks/')({
  component: TasksPage,
});
