import { createLazyFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LightBulbIcon,
  CodeBracketIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  capabilities: string[];
  model: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconGradient: string;
}

const agents: AgentInfo[] = [
  {
    id: 'planner',
    name: 'Planner Agent',
    description:
      'Analyzes coding tasks and creates detailed implementation plans with step-by-step instructions.',
    icon: LightBulbIcon,
    capabilities: [
      'Task analysis and decomposition',
      'Architecture planning',
      'Dependency identification',
      'Risk assessment',
    ],
    model: 'Claude Sonnet 4.5',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    iconGradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'coder',
    name: 'Coder Agent',
    description:
      'Implements the plan by writing clean, efficient code following best practices and coding standards.',
    icon: CodeBracketIcon,
    capabilities: [
      'Code implementation',
      'Refactoring',
      'Documentation generation',
      'Code optimization',
    ],
    model: 'Claude Opus 4.5',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    iconGradient: 'from-blue-400 to-cyan-500',
  },
  {
    id: 'tester',
    name: 'Tester Agent',
    description:
      'Creates comprehensive test suites to validate the implementation and ensure code quality.',
    icon: BeakerIcon,
    capabilities: [
      'Unit test generation',
      'Integration testing',
      'Edge case identification',
      'Coverage analysis',
    ],
    model: 'Claude Sonnet 4.5',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    iconGradient: 'from-green-400 to-emerald-500',
  },
  {
    id: 'reviewer',
    name: 'Reviewer Agent',
    description:
      'Reviews the code for quality, security, and adherence to best practices with actionable feedback.',
    icon: MagnifyingGlassIcon,
    capabilities: [
      'Code review',
      'Security analysis',
      'Performance suggestions',
      'Best practice validation',
    ],
    model: 'Claude Opus 4.5',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    iconGradient: 'from-purple-400 to-pink-500',
  },
];

const workflowSteps = [
  {
    title: 'Planning Phase',
    description:
      'The Planner Agent analyzes your task description and creates a detailed implementation plan with step-by-step instructions.',
    agent: agents[0],
  },
  {
    title: 'Coding Phase',
    description:
      'The Coder Agent implements the plan, writing clean and efficient code following best practices and your project standards.',
    agent: agents[1],
  },
  {
    title: 'Testing Phase',
    description:
      'The Tester Agent creates comprehensive tests to validate the implementation and ensure code quality.',
    agent: agents[2],
  },
  {
    title: 'Review Phase',
    description:
      'The Reviewer Agent provides a final quality check, identifying issues and suggesting improvements before delivery.',
    agent: agents[3],
  },
];

function AgentsPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="noise relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-teal-500/10 via-brand-cyan/5 to-transparent p-8 md:p-12">
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-teal-400/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-cyan/10 blur-3xl" />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-teal-400 to-brand-cyan shadow-lg">
                <CpuChipIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-text-primary md:text-5xl">
                  Meet Your AI Team
                </h1>
                <p className="text-lg text-text-secondary">
                  Specialized agents working together to build better code
                </p>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8 max-w-3xl text-lg text-text-secondary"
            >
              CodeGraph uses a coordinated team of specialized AI agents to handle complex coding
              tasks. Each agent focuses on a specific aspect of the development lifecycle, ensuring
              high-quality results from planning to delivery.
            </motion.p>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-4 md:gap-8"
            >
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-brand-teal-500" />
                <span className="font-semibold text-text-primary">4 Agents</span>
              </div>
              <div className="flex items-center gap-2">
                <CpuChipIcon className="h-5 w-5 text-brand-teal-500" />
                <span className="font-semibold text-text-primary">2 Models</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-success" />
                <span className="font-semibold text-text-primary">Unlimited Tasks</span>
              </div>
              <div className="rounded-full bg-surface px-4 py-1.5 shadow-sm">
                <span className="text-sm font-medium text-text-secondary">
                  Powered by{' '}
                  <span className="text-gradient-brand font-semibold">Claude by Anthropic</span>
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Workflow Visualization */}
        <div className="overflow-hidden rounded-xl bg-surface p-6 shadow-card md:p-8">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-text-primary">Workflow Pipeline</h2>
            <p className="text-text-secondary">
              Watch how agents collaborate to deliver exceptional results
            </p>
          </div>

          {/* Desktop: Horizontal Flow */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute top-16 right-0 left-0 z-0 h-0.5">
                <div className="h-full w-full bg-gradient-to-r from-amber-500 to-purple-500 opacity-20" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-500 to-purple-500"
                  initial={{ scaleX: 0, transformOrigin: 'left' }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2, ease: 'easeInOut', delay: 0.5 }}
                  style={{ height: '2px', top: '-1px' }}
                />
              </div>

              {/* Agent Nodes */}
              <div className="relative z-10 grid grid-cols-4 gap-4">
                {agents.map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className="relative"
                  >
                    {/* Arrow */}
                    {index < agents.length - 1 && (
                      <div className="absolute top-16 -right-4 z-20 flex h-8 w-8 items-center justify-center">
                        <ArrowRightIcon className={`h-5 w-5 ${agent.color}`} />
                      </div>
                    )}

                    {/* Agent Node */}
                    <div className="flex flex-col items-center">
                      {/* Icon Circle */}
                      <div
                        className={`relative mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br ${agent.iconGradient} p-0.5 shadow-lg`}
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-surface">
                          <agent.icon className={`h-12 w-12 ${agent.color}`} />
                        </div>
                        {/* Status Indicator */}
                        <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow-sm">
                          <div className="status-dot status-ready" />
                        </div>
                      </div>

                      {/* Agent Info */}
                      <h3 className="mb-1 text-center text-sm font-semibold text-text-primary">
                        {agent.name}
                      </h3>
                      <Badge variant="secondary" size="sm" className="text-xs">
                        Ready
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: Vertical Flow */}
          <div className="md:hidden">
            <div className="relative space-y-4">
              {/* Connecting Line */}
              <div className="absolute top-0 bottom-0 left-16 w-0.5">
                <div className="h-full w-full bg-gradient-to-b from-amber-500 to-purple-500 opacity-20" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-amber-500 to-purple-500"
                  initial={{ scaleY: 0, transformOrigin: 'top' }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 2, ease: 'easeInOut', delay: 0.5 }}
                  style={{ width: '2px', left: '-0.5px' }}
                />
              </div>

              {/* Agent Nodes */}
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="relative flex items-center gap-4"
                >
                  {/* Icon Circle */}
                  <div
                    className={`relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${agent.iconGradient} p-0.5 shadow-lg`}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-surface">
                      <agent.icon className={`h-10 w-10 ${agent.color}`} />
                    </div>
                    {/* Status Indicator */}
                    <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow-sm">
                      <div className="status-dot status-ready" />
                    </div>
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1">
                    <h3 className="mb-1 text-sm font-semibold text-text-primary">{agent.name}</h3>
                    <Badge variant="secondary" size="sm" className="text-xs">
                      Ready
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {agents.map((agent, index) => {
            const IconComponent = agent.icon;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              >
                <Card
                  className={`group relative overflow-hidden border ${agent.borderColor} bg-gradient-surface interactive glass-subtle shadow-card transition-all duration-300 hover:shadow-card-hover`}
                >
                  {/* Gradient Accent Border */}
                  <div
                    className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${agent.iconGradient}`}
                  />

                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                      {/* Icon */}
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${agent.iconGradient} p-0.5 shadow-lg`}
                      >
                        <div
                          className={`flex h-full w-full items-center justify-center rounded-xl ${agent.bgColor}`}
                        >
                          <IconComponent className={`h-8 w-8 ${agent.color}`} />
                        </div>
                      </div>

                      {/* Model Badge & Status */}
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="default" size="sm" className="text-xs font-medium">
                          {agent.model}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <div className="status-dot status-ready" />
                          <span className="text-xs font-medium text-success">Ready</span>
                        </div>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="mb-2 text-xl font-bold text-text-primary">{agent.name}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
                      {agent.description}
                    </p>

                    {/* Capabilities */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold tracking-wide text-text-tertiary uppercase">
                        Capabilities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {agent.capabilities.map((capability) => (
                          <div
                            key={capability}
                            className={`flex items-center gap-1.5 rounded-full ${agent.bgColor} px-3 py-1.5 text-xs font-medium ${agent.color}`}
                          >
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            {capability}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* How It Works Timeline */}
        <div className="bg-gradient-surface overflow-hidden rounded-xl p-6 shadow-card md:p-8">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-text-primary">How It Works</h2>
            <p className="text-text-secondary">
              The agents work together in a coordinated pipeline to complete your tasks
            </p>
          </div>

          <div className="relative mx-auto max-w-3xl">
            {/* Timeline Line */}
            <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-border-primary md:left-8" />

            {/* Timeline Steps */}
            <div className="space-y-8">
              {workflowSteps.map((step, index) => {
                const IconComponent = step.agent.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.15 }}
                    className="relative flex gap-4 md:gap-8"
                  >
                    {/* Number Circle with Icon */}
                    <div className="relative z-10 flex shrink-0 flex-col items-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${step.agent.iconGradient} p-0.5 shadow-lg`}
                      >
                        <div
                          className={`flex h-full w-full items-center justify-center rounded-xl ${step.agent.bgColor}`}
                        >
                          <IconComponent className={`h-7 w-7 ${step.agent.color}`} />
                        </div>
                      </div>
                      <div
                        className={`absolute -bottom-2 flex h-6 w-6 items-center justify-center rounded-full ${step.agent.bgColor} border-2 border-surface text-xs font-bold ${step.agent.color}`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 pb-8">
                      <Card
                        className={`border ${step.agent.borderColor} interactive-scale bg-surface/50 shadow-sm transition-all duration-300 hover:shadow-md`}
                      >
                        <CardContent className="p-4">
                          <h3 className="mb-1 text-lg font-semibold text-text-primary">
                            {step.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-text-secondary">
                            {step.description}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/agents/')({
  component: AgentsPage,
});
