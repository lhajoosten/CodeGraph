import { type ComponentType } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHasMounted } from '@/hooks/common';
import {
  LightBulbIcon,
  CodeBracketIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
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
  const hasMounted = useHasMounted();

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="noise relative overflow-hidden rounded-xl bg-linear-to-br from-brand-teal-500/10 via-brand-cyan/5 to-transparent p-8 md:p-12">
          {/* Animated Gradient Orbs */}
          <div className="orb orb-teal orb-animated pointer-events-none absolute -top-20 -right-20 h-72 w-72 opacity-30" />
          <div className="orb orb-cyan animate-drift-reverse pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 opacity-25" />
          <div className="orb orb-purple animate-drift-slow pointer-events-none absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 opacity-15" />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand-teal-400 to-brand-cyan shadow-lg">
                <CpuChipIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-text-primary md:text-5xl">
                  Meet Your <span className="text-gradient-animated">AI Team</span>
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

            {/* Stats Row - Premium Glass Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-3 md:gap-4"
            >
              <div className="glass-subtle flex items-center gap-2 rounded-full px-4 py-2 shadow-sm transition-all hover:shadow-md">
                <SparklesIcon className="h-5 w-5 text-brand-teal-500" />
                <span className="font-semibold text-text-primary">4 Agents</span>
              </div>
              <div className="glass-subtle flex items-center gap-2 rounded-full px-4 py-2 shadow-sm transition-all hover:shadow-md">
                <CpuChipIcon className="h-5 w-5 text-brand-teal-500" />
                <span className="font-semibold text-text-primary">2 Models</span>
              </div>
              <div className="glass-subtle flex items-center gap-2 rounded-full px-4 py-2 shadow-sm transition-all hover:shadow-md">
                <CheckCircleIcon className="h-5 w-5 text-success" />
                <span className="font-semibold text-text-primary">Unlimited Tasks</span>
              </div>
              <div className="glass-premium flex items-center gap-2 rounded-full px-4 py-2 shadow-md">
                <BoltIcon className="h-4 w-4 animate-pulse text-brand-cyan" />
                <span className="text-sm font-medium text-text-secondary">
                  Powered by{' '}
                  <span className="text-gradient-brand font-semibold">Claude by Anthropic</span>
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Workflow Visualization */}
        <div className="glass-subtle relative overflow-hidden rounded-xl p-6 shadow-card md:p-8">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-teal-500/5 via-transparent to-brand-cyan/5" />

          <div className="relative mb-8 text-center">
            <h2
              className={`mb-2 text-2xl font-bold text-text-primary ${hasMounted ? 'animate-slide-up' : 'opacity-0'}`}
            >
              Workflow Pipeline
            </h2>
            <p
              className={`text-text-secondary ${hasMounted ? 'stagger-1 animate-slide-up' : 'opacity-0'}`}
            >
              Watch how agents collaborate to deliver exceptional results
            </p>
          </div>

          {/* Desktop: Horizontal Flow */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute top-16 right-0 left-0 z-0 h-0.5">
                <div className="h-full w-full bg-linear-to-r from-amber-500 to-purple-500 opacity-20" />
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-amber-500 to-purple-500"
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
                      {/* Icon Circle - Enhanced with glow */}
                      <div
                        className={`group/node relative mb-4 flex h-32 w-32 cursor-pointer items-center justify-center rounded-full bg-linear-to-br ${agent.iconGradient} p-0.5 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-surface transition-all group-hover/node:bg-surface/90">
                          <agent.icon
                            className={`h-12 w-12 transition-transform group-hover/node:scale-110 ${agent.color}`}
                          />
                        </div>
                        {/* Status Indicator - Alive pulse */}
                        <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface shadow-md">
                          <div className="status-dot-premium status-alive" />
                        </div>
                        {/* Hover glow ring */}
                        <div
                          className="pointer-events-none absolute inset-0 rounded-full opacity-0 ring-4 ring-current transition-opacity group-hover/node:opacity-20"
                          style={{ color: 'var(--color-brand-teal-500)' }}
                        />
                      </div>

                      {/* Agent Info */}
                      <h3 className="mb-1 text-center text-sm font-semibold text-text-primary transition-colors group-hover/node:text-primary">
                        {agent.name}
                      </h3>
                      <Badge variant="success" size="sm" className="animate-pulse text-xs">
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
                <div className="h-full w-full bg-linear-to-b from-amber-500 to-purple-500 opacity-20" />
                <motion.div
                  className="absolute inset-0 bg-linear-to-b from-amber-500 to-purple-500"
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
                  {/* Icon Circle - Mobile enhanced */}
                  <div
                    className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${agent.iconGradient} p-0.5 shadow-lg`}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-surface">
                      <agent.icon className={`h-10 w-10 ${agent.color}`} />
                    </div>
                    {/* Status Indicator - Alive pulse */}
                    <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow-md">
                      <div className="status-dot-premium status-alive" />
                    </div>
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1">
                    <h3 className="mb-1 text-sm font-semibold text-text-primary">{agent.name}</h3>
                    <Badge variant="success" size="sm" className="text-xs">
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
                  className={`group relative overflow-hidden border ${agent.borderColor} hover-lift-premium glass-subtle shadow-card transition-all duration-300 hover:border-primary/30`}
                >
                  {/* Gradient Accent Border - Animated on hover */}
                  <div
                    className={`absolute top-0 left-0 h-1 w-full bg-linear-to-r ${agent.iconGradient} transition-all duration-300 group-hover:h-1.5`}
                  />

                  {/* Subtle hover glow */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:from-brand-teal-500/5 group-hover:to-transparent group-hover:opacity-100" />

                  <CardContent className="relative p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                      {/* Icon - Enhanced with hover animation */}
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br ${agent.iconGradient} p-0.5 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}
                      >
                        <div
                          className={`flex h-full w-full items-center justify-center rounded-xl ${agent.bgColor}`}
                        >
                          <IconComponent
                            className={`h-8 w-8 transition-transform duration-300 group-hover:scale-110 ${agent.color}`}
                          />
                        </div>
                      </div>

                      {/* Model Badge & Status */}
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant="default"
                          size="sm"
                          className="text-xs font-medium shadow-sm"
                        >
                          {agent.model}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <div className="status-dot-premium status-alive" />
                          <span className="text-xs font-medium text-success">Ready</span>
                        </div>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="mb-2 text-xl font-bold text-text-primary transition-colors group-hover:text-primary">
                      {agent.name}
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
                      {agent.description}
                    </p>

                    {/* Capabilities */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold tracking-wide text-text-tertiary uppercase">
                        Capabilities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {agent.capabilities.map((capability, capIndex) => (
                          <div
                            key={capability}
                            className={`flex items-center gap-1.5 rounded-full ${agent.bgColor} px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-105 ${agent.color}`}
                            style={{ transitionDelay: `${capIndex * 25}ms` }}
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
        <div className="glass-subtle relative overflow-hidden rounded-xl p-6 shadow-card md:p-8">
          {/* Background accent */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-teal-500/5 via-transparent to-brand-cyan/5" />
          <div className="orb orb-teal pointer-events-none absolute -top-32 -right-32 h-64 w-64 opacity-10" />

          <div className="relative mb-8 text-center">
            <h2
              className={`mb-2 text-2xl font-bold text-text-primary ${hasMounted ? 'animate-slide-up' : 'opacity-0'}`}
            >
              How It Works
            </h2>
            <p
              className={`text-text-secondary ${hasMounted ? 'stagger-1 animate-slide-up' : 'opacity-0'}`}
            >
              The agents work together in a coordinated pipeline to complete your tasks
            </p>
          </div>

          <div className="relative mx-auto max-w-3xl">
            {/* Timeline Line - Gradient animated */}
            <div className="absolute top-0 bottom-0 left-4 w-0.5 md:left-8">
              <div className="h-full w-full bg-linear-to-b from-amber-500/30 via-blue-500/30 via-green-500/30 to-purple-500/30" />
              <motion.div
                className="absolute inset-0 bg-linear-to-b from-amber-500 via-blue-500 via-green-500 to-purple-500"
                initial={{ scaleY: 0, transformOrigin: 'top' }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 2, ease: 'easeOut', delay: 0.5 }}
                style={{ width: '2px' }}
              />
            </div>

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
                    className="group relative flex gap-4 md:gap-8"
                  >
                    {/* Number Circle with Icon - Enhanced */}
                    <div className="relative z-10 flex shrink-0 flex-col items-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br ${step.agent.iconGradient} p-0.5 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}
                      >
                        <div
                          className={`flex h-full w-full items-center justify-center rounded-xl ${step.agent.bgColor}`}
                        >
                          <IconComponent
                            className={`h-7 w-7 transition-transform group-hover:scale-110 ${step.agent.color}`}
                          />
                        </div>
                      </div>
                      <div
                        className={`absolute -bottom-2 flex h-6 w-6 items-center justify-center rounded-full ${step.agent.bgColor} border-2 border-surface text-xs font-bold shadow-sm ${step.agent.color}`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Content Card - Enhanced */}
                    <div className="flex-1 pb-8">
                      <Card
                        className={`border ${step.agent.borderColor} hover-lift-premium glass-subtle shadow-sm transition-all duration-300`}
                      >
                        <CardContent className="p-4">
                          <h3 className="mb-1 text-lg font-semibold text-text-primary transition-colors group-hover:text-primary">
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
