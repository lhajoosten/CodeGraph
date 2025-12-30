import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useFetchTask } from '@/hooks/api/tasks/queries';
import { useDeleteTask } from '@/hooks/api/tasks/mutations';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskExecutionPanel } from '@/components/tasks/task-execution-panel';
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
import { formatDateTime } from '@/lib/formatters';

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
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-lg text-danger">Failed to load task</p>
        <Button asChild variant="secondary">
          <Link to="/tasks">Back to tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/tasks">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to tasks
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold">{task.title}</h1>
            <div className="flex items-center gap-3">
              <TaskStatusBadge status={task.status} />
              {task.priority && <TaskPriorityBadge priority={task.priority} />}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this task? This action cannot be
                    undone.
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Description</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {task.description}
              </p>
            </CardContent>
          </Card>

          {/* Execution Panel */}
          <TaskExecutionPanel taskId={taskId} taskStatus={task.status} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Information */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Information</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="mt-0.5 text-sm font-medium">
                  <TaskStatusBadge status={task.status} />
                </p>
              </div>

              {task.priority && (
                <div>
                  <p className="text-muted-foreground text-xs">Priority</p>
                  <p className="mt-0.5 text-sm font-medium">
                    <TaskPriorityBadge priority={task.priority} />
                  </p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-xs">Created</p>
                <p className="mt-0.5 text-sm font-medium">
                  {formatDateTime(task.created_at)}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-xs">Last Updated</p>
                <p className="mt-0.5 text-sm font-medium">
                  {formatDateTime(task.updated_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
