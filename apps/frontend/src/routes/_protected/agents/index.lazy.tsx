import { createLazyFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LightBulbIcon,
  CodeBracketIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  capabilities: string[];
  model: string;
  color: string;
}

const agents: AgentInfo[] = [
  {
    id: 'planner',
    name: 'Planner Agent',
    description:
      'Analyzes coding tasks and creates detailed implementation plans with step-by-step instructions.',
    icon: <LightBulbIcon className="h-8 w-8" />,
    capabilities: [
      'Task analysis and decomposition',
      'Architecture planning',
      'Dependency identification',
      'Risk assessment',
    ],
    model: 'Claude Sonnet 4.5',
    color: 'text-amber-500',
  },
  {
    id: 'coder',
    name: 'Coder Agent',
    description:
      'Implements the plan by writing clean, efficient code following best practices and coding standards.',
    icon: <CodeBracketIcon className="h-8 w-8" />,
    capabilities: [
      'Code implementation',
      'Refactoring',
      'Documentation generation',
      'Code optimization',
    ],
    model: 'Claude Opus 4.5',
    color: 'text-blue-500',
  },
  {
    id: 'tester',
    name: 'Tester Agent',
    description:
      'Creates comprehensive test suites to validate the implementation and ensure code quality.',
    icon: <BeakerIcon className="h-8 w-8" />,
    capabilities: [
      'Unit test generation',
      'Integration testing',
      'Edge case identification',
      'Coverage analysis',
    ],
    model: 'Claude Sonnet 4.5',
    color: 'text-green-500',
  },
  {
    id: 'reviewer',
    name: 'Reviewer Agent',
    description:
      'Reviews the code for quality, security, and adherence to best practices with actionable feedback.',
    icon: <MagnifyingGlassIcon className="h-8 w-8" />,
    capabilities: [
      'Code review',
      'Security analysis',
      'Performance suggestions',
      'Best practice validation',
    ],
    model: 'Claude Opus 4.5',
    color: 'text-purple-500',
  },
];

function AgentsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="AI Agents"
          description="Meet the specialized AI agents that power your development workflow"
        />

        {/* Agent Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CpuChipIcon className="text-primary h-5 w-5" />
              Multi-Agent Architecture
            </CardTitle>
            <CardDescription>
              CodeGraph uses a coordinated team of specialized AI agents to handle complex coding
              tasks. Each agent focuses on a specific aspect of the development lifecycle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-background-2 flex items-center justify-between rounded-lg p-4">
              <div className="flex items-center gap-4">
                <ChartBarIcon className="text-primary h-6 w-6" />
                <div>
                  <p className="font-medium">Workflow Pipeline</p>
                  <p className="text-text-secondary text-sm">
                    Plan → Code → Test → Review
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ClockIcon className="text-success h-6 w-6" />
                <div>
                  <p className="font-medium">Powered by Claude</p>
                  <p className="text-text-secondary text-sm">
                    Latest Anthropic models
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {agents.map((agent) => (
            <Card key={agent.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`${agent.color}`}>{agent.icon}</div>
                  <Badge variant="default" size="sm">
                    {agent.model}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{agent.name}</CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-text-primary text-sm font-medium">Capabilities</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {agent.capabilities.map((capability) => (
                      <li
                        key={capability}
                        className="text-text-secondary flex items-center gap-2 text-sm"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${agent.color} bg-current`} />
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              The agents work together in a coordinated pipeline to complete your tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                  1
                </div>
                <div>
                  <p className="font-medium">Planning Phase</p>
                  <p className="text-text-secondary text-sm">
                    The Planner Agent analyzes your task description and creates a detailed
                    implementation plan with step-by-step instructions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  2
                </div>
                <div>
                  <p className="font-medium">Coding Phase</p>
                  <p className="text-text-secondary text-sm">
                    The Coder Agent implements the plan, writing clean and efficient code following
                    best practices and your project standards.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  3
                </div>
                <div>
                  <p className="font-medium">Testing Phase</p>
                  <p className="text-text-secondary text-sm">
                    The Tester Agent creates comprehensive tests to validate the implementation and
                    ensure code quality.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                  4
                </div>
                <div>
                  <p className="font-medium">Review Phase</p>
                  <p className="text-text-secondary text-sm">
                    The Reviewer Agent provides a final quality check, identifying issues and
                    suggesting improvements before delivery.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/agents/')({
  component: AgentsPage,
});
