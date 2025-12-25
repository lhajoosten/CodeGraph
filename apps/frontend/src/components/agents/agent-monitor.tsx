import * as React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AgentCard } from './agent-card';
import { AgentLog } from './agent-log';
import { useAgentStream, type AgentUpdate } from '@/hooks';
import type { AgentType, AgentStatus } from '@/lib/guards';
import { cn } from '@/lib/utils';

interface AgentState {
  type: AgentType;
  status: AgentStatus;
  progress: number;
  message?: string;
}

const initialAgentStates: AgentState[] = [
  { type: 'planning', status: 'idle', progress: 0 },
  { type: 'coding', status: 'idle', progress: 0 },
  { type: 'testing', status: 'idle', progress: 0 },
  { type: 'review', status: 'idle', progress: 0 },
];

interface AgentMonitorProps {
  taskId: number;
  enabled?: boolean;
  className?: string;
}

export function AgentMonitor({ taskId, enabled = true, className }: AgentMonitorProps) {
  const [agents, setAgents] = React.useState<AgentState[]>(initialAgentStates);
  const [logs, setLogs] = React.useState<AgentUpdate[]>([]);

  const { status, messages, reconnect } = useAgentStream(taskId, enabled);

  // Process incoming messages
  React.useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];

    // Update agent states based on message
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.type === latestMessage.agent) {
          return {
            ...agent,
            status: latestMessage.status as AgentStatus,
            message: latestMessage.message,
            progress: latestMessage.status === 'completed' ? 100 : agent.progress + 25,
          };
        }
        return agent;
      })
    );

    // Add to logs
    setLogs(messages);
  }, [messages]);

  const isConnected = status === 'open';
  const isConnecting = status === 'connecting';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Connection status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <div className="flex items-center gap-3">
            {isConnecting ? (
              <Spinner size="sm" />
            ) : isConnected ? (
              <Wifi className="h-5 w-5 text-success" />
            ) : (
              <WifiOff className="h-5 w-5 text-danger" />
            )}
            <div>
              <h3 className="font-semibold text-text-primary">Agent Activity</h3>
              <p className="text-xs text-text-tertiary">
                {isConnecting
                  ? 'Connecting...'
                  : isConnected
                    ? 'Connected - receiving live updates'
                    : 'Disconnected'}
              </p>
            </div>
          </div>

          {!isConnected && !isConnecting && (
            <Button
              variant="outline"
              size="sm"
              onClick={reconnect}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Reconnect
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* Agent cards */}
      <div
        className={`
          grid gap-4
          md:grid-cols-2
        `}
      >
        {agents.map((agent) => (
          <AgentCard
            key={agent.type}
            type={agent.type}
            status={agent.status}
            progress={agent.progress}
            message={agent.message}
          />
        ))}
      </div>

      {/* Activity log */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-text-primary">Activity Log</h3>
          </CardHeader>
          <CardContent>
            <AgentLog updates={logs} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
