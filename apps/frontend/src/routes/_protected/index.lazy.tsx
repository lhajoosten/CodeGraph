import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useCurrentUser, useTasks } from '@/hooks';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/tasks/task-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  PlusIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  ChartBarIcon,
  ArrowRightIcon,
  SparklesIcon,
  CpuChipIcon,
  BeakerIcon,
  DocumentCheckIcon,
  CodeBracketIcon,
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

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-surface relative overflow-hidden rounded-2xl border border-border-primary p-8 shadow-elevated md:p-12">
          <div className="noise pointer-events-none absolute inset-0" />
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-3">
              <SparklesIcon className="h-8 w-8 text-brand-teal-400" />
              <Badge variant="secondary" className="bg-primary-subtle text-text-brand">
                AI-Powered Development
              </Badge>
            </div>
            <h1 className="mb-3 text-4xl font-bold text-text-primary md:text-5xl">
              {getGreeting()}, {userName}!
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-text-secondary">
              Your autonomous AI agents are ready to help you code faster and smarter. Track
              progress, create tasks, and let the agents handle the heavy lifting.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/tasks">
                <Button size="lg" className="glow-teal-sm gap-2">
                  <PlusIcon className="h-5 w-5" />
                  Create New Task
                </Button>
              </Link>
              {stats.inProgress > 0 && (
                <Link to="/tasks">
                  <Button variant="outline" size="lg" className="gap-2">
                    <BoltIcon className="h-5 w-5" />
                    View Active Tasks
                  </Button>
                </Link>
              )}
            </div>
          </div>
          {/* Decorative gradient orbs */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-teal-400 opacity-10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-cyan opacity-5 blur-3xl" />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Tasks */}
          <Card className="interactive border-accent-top overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Total Tasks</CardTitle>
              <div className="bg-gradient-teal-subtle flex h-10 w-10 items-center justify-center rounded-lg">
                <Squares2X2Icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-1 text-3xl font-bold text-text-primary">{stats.total}</div>
              <p className="text-xs text-text-tertiary">{completionRate}% completion rate</p>
              {stats.total > 0 && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className="bg-gradient-teal h-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="interactive overflow-hidden hover:shadow-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Pending</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <ClockIcon className="h-5 w-5 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-1 text-3xl font-bold text-text-primary">{stats.pending}</div>
              <p className="text-xs text-text-tertiary">Waiting to be processed</p>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="interactive overflow-hidden hover:shadow-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">In Progress</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <BoltIcon className="h-5 w-5 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-1 text-3xl font-bold text-text-primary">{stats.inProgress}</div>
              <p className="text-xs text-text-tertiary">Being worked on by agents</p>
              {stats.inProgress > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-info">
                  <div className="status-dot h-2 w-2 bg-info" />
                  <span>Agents active</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="interactive overflow-hidden hover:shadow-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Completed</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircleIcon className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-1 text-3xl font-bold text-text-primary">{stats.completed}</div>
              <p className="text-xs text-text-tertiary">Successfully finished</p>
              {stats.completed > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-success">
                  <CheckCircleIcon className="h-3 w-3" />
                  <span>Great job!</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Tasks */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-text-primary">Recent Activity</h2>
              <Link
                to="/tasks"
                className="group flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary-hover"
              >
                View all
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {tasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-gradient-teal-subtle mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                    <Squares2X2Icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-text-primary">No tasks yet</h3>
                  <p className="mb-6 max-w-sm text-text-secondary">
                    Create your first task and let our AI agents help you code faster, test smarter,
                    and ship with confidence.
                  </p>
                  <Link to="/tasks">
                    <Button size="lg" className="gap-2">
                      <PlusIcon className="h-5 w-5" />
                      Create Your First Task
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks at your fingertips</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/tasks" className="block">
                  <Button
                    variant="outline"
                    className="interactive-scale w-full justify-start gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-subtle">
                      <PlusIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Create New Task</span>
                  </Button>
                </Link>
                <Link to="/tasks" className="block">
                  <Button
                    variant="outline"
                    className="interactive-scale w-full justify-start gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-info/10">
                      <Squares2X2Icon className="h-4 w-4 text-info" />
                    </div>
                    <span className="font-medium">View All Tasks</span>
                  </Button>
                </Link>
                <Link to="/settings" className="block">
                  <Button
                    variant="outline"
                    className="interactive-scale w-full justify-start gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-text-tertiary/10">
                      <Cog6ToothIcon className="h-4 w-4 text-text-tertiary" />
                    </div>
                    <span className="font-medium">Account Settings</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* AI Agent Status */}
            <Card className="border-accent-left overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RocketLaunchIcon className="h-5 w-5 text-primary" />
                  AI Agent Workflow
                </CardTitle>
                <CardDescription>Your autonomous coding assistants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <AgentStatusItem
                  icon={CpuChipIcon}
                  name="Planning Agent"
                  status="ready"
                  description="Breaks down tasks into steps"
                />
                <AgentStatusItem
                  icon={CodeBracketIcon}
                  name="Coding Agent"
                  status="ready"
                  description="Implements solutions"
                />
                <AgentStatusItem
                  icon={BeakerIcon}
                  name="Testing Agent"
                  status="ready"
                  description="Ensures code quality"
                />
                <AgentStatusItem
                  icon={DocumentCheckIcon}
                  name="Review Agent"
                  status="ready"
                  description="Final quality checks"
                />
              </CardContent>
            </Card>

            {/* Getting Started */}
            <Card className="bg-gradient-teal-subtle overflow-hidden border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <SparklesIcon className="h-5 w-5" />
                  Getting Started
                </CardTitle>
                <CardDescription>New to CodeGraph?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-text-secondary">
                <p className="font-medium">CodeGraph uses AI agents to help you code faster:</p>
                <div className="space-y-3">
                  <Step number={1} text="Create a task with your requirements" />
                  <Step number={2} text="Planning Agent breaks it into steps" />
                  <Step number={3} text="Coding Agent implements the solution" />
                  <Step number={4} text="Testing & Review ensure quality" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-surface p-3 text-xs">
                  <div className="status-dot h-2 w-2 bg-success" />
                  <span className="font-medium text-text-primary">All systems operational</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Agent Status Item Component
interface AgentStatusItemProps {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  status: 'ready' | 'active' | 'error';
  description: string;
}

function AgentStatusItem({ icon: Icon, name, status, description }: AgentStatusItemProps) {
  const statusColors = {
    ready: 'bg-success',
    active: 'bg-info',
    error: 'bg-error',
  };

  const statusLabels = {
    ready: 'Ready',
    active: 'Active',
    error: 'Error',
  };

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border-secondary bg-surface p-3 transition-all hover:border-border-primary hover:bg-surface-hover">
      <div className="bg-gradient-teal-subtle flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{name}</span>
          <div className={`status-dot h-2 w-2 ${statusColors[status]}`} />
        </div>
        <p className="truncate text-xs text-text-tertiary">{description}</p>
      </div>
      <Badge variant="secondary" size="sm" className="shrink-0 text-xs">
        {statusLabels[status]}
      </Badge>
    </div>
  );
}

// Step Component
interface StepProps {
  number: number;
  text: string;
}

function Step({ number, text }: StepProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-text-inverse">
        {number}
      </div>
      <p className="pt-0.5 text-text-primary">{text}</p>
    </div>
  );
}

export const Route = createLazyFileRoute('/_protected/')({
  component: DashboardPage,
});
