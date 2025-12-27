import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useCurrentUser, useTasks } from '@/hooks';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/tasks/task-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlusIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: tasksResponse, isLoading: tasksLoading } = useTasks({ pageSize: 5 });

  const tasks = tasksResponse?.items ?? [];
  const totalTasks = tasksResponse?.total ?? 0;

  // Calculate task stats
  const stats = {
    total: totalTasks,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) =>
      ['in_progress', 'planning', 'testing', 'reviewing'].includes(t.status)
    ).length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const userName = user?.email?.split('@')[0] || 'there';

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div
          className={`
            flex flex-col gap-4
            md:flex-row md:items-center md:justify-between
          `}
        >
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Welcome back, {userName}!</h1>
            <p className="mt-1 text-text-secondary">
              Here&apos;s what&apos;s happening with your AI-powered development tasks.
            </p>
          </div>
          <Link to="/tasks">
            <Button className="gap-2">
              <PlusIcon className="h-4 w-4" />
              New Task
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div
          className={`
            grid gap-4
            md:grid-cols-2
            lg:grid-cols-4
          `}
        >
          <Card>
            <CardHeader
              className={`
              flex flex-row items-center justify-between pb-2
            `}
            >
              <CardTitle className="text-sm font-medium text-text-secondary">Total Tasks</CardTitle>
              <Squares2X2Icon className="h-4 w-4 text-text-tertiary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
              <p className="text-xs text-text-tertiary">All tasks in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              className={`
              flex flex-row items-center justify-between pb-2
            `}
            >
              <CardTitle className="text-sm font-medium text-text-secondary">Pending</CardTitle>
              <ClockIcon className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{stats.pending}</div>
              <p className="text-xs text-text-tertiary">Waiting to be processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              className={`
              flex flex-row items-center justify-between pb-2
            `}
            >
              <CardTitle className="text-sm font-medium text-text-secondary">In Progress</CardTitle>
              <ExclamationCircleIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{stats.inProgress}</div>
              <p className="text-xs text-text-tertiary">Being worked on by agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              className={`
              flex flex-row items-center justify-between pb-2
            `}
            >
              <CardTitle className="text-sm font-medium text-text-secondary">Completed</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{stats.completed}</div>
              <p className="text-xs text-text-tertiary">Successfully finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div
          className={`
            grid gap-6
            lg:grid-cols-3
          `}
        >
          {/* Recent Tasks */}
          <div
            className={`
              space-y-4
              lg:col-span-2
            `}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-primary">Recent Tasks</h2>
              <Link
                to="/tasks"
                className={`
                  flex items-center gap-1 text-sm text-primary
                  hover:underline
                `}
              >
                View all
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            {tasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="mb-2 h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent
                  className={`
                    flex flex-col items-center justify-center py-12 text-center
                  `}
                >
                  <Squares2X2Icon className="mb-4 h-12 w-12 text-text-tertiary" />
                  <h3 className="mb-2 text-lg font-medium text-text-primary">No tasks yet</h3>
                  <p className="mb-4 text-text-secondary">
                    Create your first task and let our AI agents help you code.
                  </p>
                  <Link to="/tasks">
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create Task
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks at your fingertips</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/tasks" className="block">
                  <Button
                    variant="outline"
                    className={`
                    w-full justify-start gap-3
                  `}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Create New Task
                  </Button>
                </Link>
                <Link to="/tasks" className="block">
                  <Button
                    variant="outline"
                    className={`
                    w-full justify-start gap-3
                  `}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                    View All Tasks
                  </Button>
                </Link>
                <Link to="/settings" className="block">
                  <Button
                    variant="outline"
                    className={`
                    w-full justify-start gap-3
                  `}
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    Account Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* AI Agent Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RocketLaunchIcon className="h-5 w-5" />
                  AI Agents
                </CardTitle>
                <CardDescription>Your autonomous coding assistants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={`
                    flex items-center justify-between rounded-lg bg-secondary
                    p-3
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Planning Agent</span>
                  </div>
                  <span className="text-xs text-text-tertiary">Ready</span>
                </div>
                <div
                  className={`
                    flex items-center justify-between rounded-lg bg-secondary
                    p-3
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Coding Agent</span>
                  </div>
                  <span className="text-xs text-text-tertiary">Ready</span>
                </div>
                <div
                  className={`
                    flex items-center justify-between rounded-lg bg-secondary
                    p-3
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Testing Agent</span>
                  </div>
                  <span className="text-xs text-text-tertiary">Ready</span>
                </div>
                <div
                  className={`
                    flex items-center justify-between rounded-lg bg-secondary
                    p-3
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Review Agent</span>
                  </div>
                  <span className="text-xs text-text-tertiary">Ready</span>
                </div>
              </CardContent>
            </Card>

            {/* Getting Started */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Getting Started</CardTitle>
                <CardDescription>New to CodeGraph?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-text-secondary">
                <p>
                  CodeGraph uses AI agents to help you code faster. Here&apos;s how to get started:
                </p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>Create a new task with your coding requirements</li>
                  <li>Our Planning Agent will break it into steps</li>
                  <li>The Coding Agent will implement the solution</li>
                  <li>Testing and Review Agents ensure quality</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/')({
  component: DashboardPage,
});
