import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useCurrentUser, useTasks } from '@/hooks';
import { useHasMounted } from '@/hooks/common';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/tasks/task-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter, AnimatedPercentage } from '@/components/ui/animated-counter';
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
  const hasMounted = useHasMounted();

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
        {/* Hero Section - Premium Animated */}
        <div className="bg-gradient-surface relative overflow-hidden rounded-2xl border border-border-primary p-8 shadow-elevated md:p-12">
          {/* Noise texture overlay */}
          <div className="noise pointer-events-none absolute inset-0" />

          {/* Animated gradient orbs */}
          <div className="orb orb-teal orb-animated pointer-events-none absolute -top-20 -right-20 h-72 w-72 opacity-20" />
          <div className="orb orb-cyan animate-drift-reverse pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 opacity-15" />
          <div
            className="orb orb-teal orb-animated pointer-events-none absolute top-1/2 right-1/4 h-48 w-48 opacity-10"
            style={{ animationDelay: '-5s' }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Badge with sparkle */}
            <div
              className={`mb-6 flex items-center gap-3 ${hasMounted ? 'animate-slide-up' : 'opacity-0'}`}
            >
              <div className="sparkle-container">
                <SparklesIcon
                  className="h-8 w-8 animate-float text-brand-teal-400"
                  style={{ animationDuration: '4s' }}
                />
              </div>
              <Badge
                variant="secondary"
                className="glass-subtle bg-primary-subtle/80 text-text-brand backdrop-blur-sm"
              >
                AI-Powered Development
              </Badge>
            </div>

            {/* Gradient animated greeting */}
            <h1
              className={`mb-3 text-4xl font-bold md:text-5xl ${hasMounted ? 'stagger-1 animate-slide-up' : 'opacity-0'}`}
            >
              <span className="text-text-primary">{getGreeting()}, </span>
              <span className="text-gradient-animated">{userName}</span>
              <span className="text-text-primary">!</span>
            </h1>

            <p
              className={`mb-8 max-w-2xl text-lg text-text-secondary ${hasMounted ? 'stagger-2 animate-slide-up' : 'opacity-0'}`}
            >
              Your autonomous AI agents are ready to help you code faster and smarter. Track
              progress, create tasks, and let the agents handle the heavy lifting.
            </p>

            {/* Buttons with staggered spring animation */}
            <div
              className={`flex flex-wrap gap-4 ${hasMounted ? 'stagger-3 animate-slide-up-spring' : 'opacity-0'}`}
            >
              <Link to="/tasks">
                <Button size="lg" className="hover-glow-intense gap-2 transition-all duration-300">
                  <PlusIcon className="h-5 w-5" />
                  Create New Task
                </Button>
              </Link>
              {stats.inProgress > 0 && (
                <Link to="/tasks">
                  <Button variant="outline" size="lg" className="hover-glow border-shine gap-2">
                    <BoltIcon className="h-5 w-5" />
                    View Active Tasks
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid - Animated */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Tasks */}
          <Card
            className={`hover-lift-premium border-accent-animated overflow-hidden ${hasMounted ? 'stagger-4 animate-slide-up' : 'opacity-0'}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Total Tasks</CardTitle>
              <div className="bg-gradient-teal-subtle flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110">
                <Squares2X2Icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-1 text-3xl font-bold text-text-primary">
                <AnimatedCounter value={stats.total} duration={1000} startAnimation={hasMounted} />
              </div>
              <p className="text-xs text-text-tertiary">
                <AnimatedPercentage
                  value={completionRate}
                  duration={1200}
                  delay={200}
                  startAnimation={hasMounted}
                />{' '}
                completion rate
              </p>
              {stats.total > 0 && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className="bg-gradient-teal h-full transition-all duration-1000 ease-out"
                    style={{ width: hasMounted ? `${completionRate}%` : '0%' }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending */}
          <Card
            className={`hover-lift-premium overflow-hidden ${hasMounted ? 'stagger-5 animate-slide-up' : 'opacity-0'}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Pending</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <ClockIcon className="h-5 w-5 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-1 text-3xl font-bold text-text-primary">
                <AnimatedCounter
                  value={stats.pending}
                  duration={900}
                  delay={100}
                  startAnimation={hasMounted}
                />
              </div>
              <p className="text-xs text-text-tertiary">Waiting to be processed</p>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card
            className={`hover-lift-premium overflow-hidden ${hasMounted ? 'stagger-6 animate-slide-up' : 'opacity-0'}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">In Progress</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <BoltIcon className="h-5 w-5 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-1 text-3xl font-bold text-text-primary">
                <AnimatedCounter
                  value={stats.inProgress}
                  duration={900}
                  delay={200}
                  startAnimation={hasMounted}
                />
              </div>
              <p className="text-xs text-text-tertiary">Being worked on by agents</p>
              {stats.inProgress > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-info">
                  <div className="status-dot-premium status-working h-2.5 w-2.5" />
                  <span>Agents active</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed */}
          <Card
            className={`hover-lift-premium overflow-hidden ${hasMounted ? 'stagger-7 animate-slide-up' : 'opacity-0'}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">Completed</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircleIcon className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-1 text-3xl font-bold text-text-primary">
                <AnimatedCounter
                  value={stats.completed}
                  duration={900}
                  delay={300}
                  startAnimation={hasMounted}
                />
              </div>
              <p className="text-xs text-text-tertiary">Successfully finished</p>
              {stats.completed > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-success">
                  <div className="status-dot-premium status-alive h-2.5 w-2.5" />
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

// Agent Status Item Component - Premium Animated
interface AgentStatusItemProps {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  status: 'ready' | 'active' | 'error';
  description: string;
  delay?: number;
}

function AgentStatusItem({
  icon: Icon,
  name,
  status,
  description,
  delay = 0,
}: AgentStatusItemProps) {
  const statusClasses = {
    ready: 'status-alive bg-success',
    active: 'status-working bg-info',
    error: 'bg-error',
  };

  const statusLabels = {
    ready: 'Ready',
    active: 'Active',
    error: 'Error',
  };

  const glowClasses = {
    ready: 'group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    active: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    error: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  };

  return (
    <div
      className={`group hover-lift-premium flex items-center gap-3 rounded-lg border border-border-secondary bg-surface p-3 transition-all duration-300 hover:border-border-primary hover:bg-surface-hover ${glowClasses[status]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-gradient-teal-subtle flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-12" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary transition-colors group-hover:text-primary">
            {name}
          </span>
          <div className={`status-dot-premium h-2.5 w-2.5 ${statusClasses[status]}`} />
        </div>
        <p className="truncate text-xs text-text-tertiary">{description}</p>
      </div>
      <Badge
        variant="secondary"
        size="sm"
        className={`shrink-0 text-xs transition-all duration-300 group-hover:scale-105 ${
          status === 'ready'
            ? 'group-hover:bg-success/20 group-hover:text-success'
            : status === 'active'
              ? 'group-hover:bg-info/20 group-hover:text-info'
              : 'group-hover:bg-error/20 group-hover:text-error'
        }`}
      >
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
