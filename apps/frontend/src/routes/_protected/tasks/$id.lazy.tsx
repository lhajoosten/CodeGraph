import { createLazyFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CalendarIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useFetchTask } from '@/hooks/api/tasks/queries';
import { useDeleteTask } from '@/hooks/api/tasks/mutations';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskExecutionPanel } from '@/components/tasks/task-execution-panel';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDateTime, formatDate } from '@/lib/formatters';

export const Route = createLazyFileRoute('/_protected/tasks/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const taskId = parseInt(id, 10);
  const navigate = Route.useNavigate();

  const { data: task, isLoading, error } = useFetchTask(taskId);
  const deleteMutation = useDeleteTask();

  const handleDelete = () => {
    deleteMutation.mutate(
      { path: { task_id: taskId } },
      {
        onSuccess: () => {
          navigate({ to: '/tasks' });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Hero Skeleton */}
        <div className="bg-gradient-teal mb-8 overflow-hidden rounded-2xl p-8">
          <Skeleton className="mb-4 h-8 w-32 bg-white/20" />
          <Skeleton className="mb-4 h-10 w-3/4 bg-white/30" />
          <div className="flex gap-3">
            <Skeleton className="h-6 w-24 bg-white/20" />
            <Skeleton className="h-6 w-24 bg-white/20" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <SkeletonText lines={4} />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <SkeletonText lines={6} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex h-[400px] flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-surface/50 backdrop-blur">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error-bg">
            <div className="h-10 w-10 text-error">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-text-primary">Task Not Found</h2>
            <p className="text-text-secondary">
              The task you&rsquo;re looking for doesn&rsquo;t exist or has been deleted.
            </p>
          </div>
          <Button asChild variant="default" className="shadow-button-hover">
            <Link to="/tasks">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Tasks
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Tasks', onClick: () => navigate({ to: '/tasks' }) },
    { label: task.title },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />
      </div>

      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-teal relative mb-8 overflow-hidden rounded-2xl p-8 shadow-elevated">
        {/* Noise texture */}
        <div className="noise absolute inset-0" />

        <div className="relative z-10">
          {/* Back Button */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-4 border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
          >
            <Link to="/tasks">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Tasks
            </Link>
          </Button>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Title and Badges */}
            <div className="flex-1">
              <h1 className="mb-4 text-4xl font-bold text-white drop-shadow-lg">{task.title}</h1>

              <div className="flex flex-wrap items-center gap-3">
                <TaskStatusBadge status={task.status} />
                {task.priority && <TaskPriorityBadge priority={task.priority} />}

                {/* Meta Pills */}
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Created {formatDate(task.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="bg-error/90 text-white hover:bg-error"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description Card */}
          <Card className="hc-skel-item border-accent-top shadow-card transition-shadow hover:shadow-card-hover">
            <CardHeader>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <svg
                  className="h-5 w-5 text-brand-teal"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                Description
              </h2>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed whitespace-pre-wrap text-text-secondary">
                {task.description}
              </p>
            </CardContent>
          </Card>

          {/* Execution Panel */}
          <div className="hc-skel-item" style={{ animationDelay: '100ms' }}>
            <TaskExecutionPanel taskId={taskId} taskStatus={task.status} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Information Card */}
          <Card
            className="hc-skel-item border-accent-left shadow-card"
            style={{ animationDelay: '50ms' }}
          >
            <CardHeader>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <svg
                  className="h-5 w-5 text-brand-cyan"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
                Information
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="group">
                <div className="mb-2 flex items-center gap-2">
                  <div className="status-dot status-ready" />
                  <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                    Status
                  </p>
                </div>
                <div className="ml-5">
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>

              <div className="divider" />

              {/* Priority */}
              {task.priority && (
                <>
                  <div className="group">
                    <div className="mb-2 flex items-center gap-2">
                      <FlagIcon className="h-4 w-4 text-text-muted" />
                      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                        Priority
                      </p>
                    </div>
                    <div className="ml-6">
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                  </div>

                  <div className="divider" />
                </>
              )}

              {/* Created */}
              <div className="group">
                <div className="mb-2 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-text-muted" />
                  <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                    Created
                  </p>
                </div>
                <p className="ml-6 text-sm font-medium text-text-primary">
                  {formatDateTime(task.created_at)}
                </p>
              </div>

              <div className="divider" />

              {/* Last Updated */}
              <div className="group">
                <div className="mb-2 flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-text-muted" />
                  <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                    Last Updated
                  </p>
                </div>
                <p className="ml-6 text-sm font-medium text-text-primary">
                  {formatDateTime(task.updated_at)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline Card */}
          {task.status === 'completed' && (
            <Card
              className="hc-skel-item border-l-4 border-l-success shadow-card"
              style={{ animationDelay: '100ms' }}
            >
              <CardHeader>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                  Completed
                </h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">This task was successfully completed.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
