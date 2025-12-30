import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import { useEstimateMonthlyCost } from '@/hooks/api/metrics/mutations/use-estimate-monthly-cost';

const formatCurrency = (amount: number): string => {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export function CostEstimator() {
  const [dailyTokens, setDailyTokens] = useState<number>(5000000);
  const [inputRatio, setInputRatio] = useState<number>(0.67);
  const estimateMutation = useEstimateMonthlyCost();

  const handleEstimate = () => {
    estimateMutation.mutate({
      body: {
        daily_tokens: dailyTokens,
        input_ratio: inputRatio,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalculatorIcon className="h-5 w-5 text-brand-cyan" />
          <CardTitle>Monthly Cost Estimator</CardTitle>
        </div>
        <CardDescription>Estimate your monthly costs based on projected usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="daily-tokens">Daily Tokens</Label>
            <Input
              id="daily-tokens"
              type="number"
              min="1000"
              step="1000"
              value={dailyTokens}
              onChange={(e) => setDailyTokens(Number(e.target.value))}
              placeholder="5000000"
            />
            <p className="text-xs text-text-tertiary">Average daily token usage</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="input-ratio">Input Ratio</Label>
            <Input
              id="input-ratio"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={inputRatio}
              onChange={(e) => setInputRatio(Number(e.target.value))}
              placeholder="0.67"
            />
            <p className="text-xs text-text-tertiary">Ratio of input tokens (default 2/3)</p>
          </div>
        </div>

        <Button onClick={handleEstimate} disabled={estimateMutation.isPending} className="w-full">
          {estimateMutation.isPending ? 'Calculating...' : 'Calculate Estimate'}
        </Button>

        {estimateMutation.isSuccess && estimateMutation.data && (
          <div className="bg-bg-elevated mt-4 rounded-lg border border-border p-4">
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-sm text-text-secondary">Monthly Tokens</div>
                <div className="text-2xl font-bold text-brand-cyan">
                  {formatNumber(estimateMutation.data.monthly_tokens)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
                <div>
                  <div className="text-xs text-text-tertiary">Input Tokens</div>
                  <div className="font-semibold">
                    {formatNumber(estimateMutation.data.input_tokens)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary">Output Tokens</div>
                  <div className="font-semibold">
                    {formatNumber(estimateMutation.data.output_tokens)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="mb-2 text-xs font-medium text-text-secondary">Cost Breakdown</div>
                <div className="flex justify-between text-sm">
                  <span>Local (vLLM)</span>
                  <span>{formatCurrency(estimateMutation.data.costs.local_cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Claude Haiku</span>
                  <span>{formatCurrency(estimateMutation.data.costs.claude_haiku)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Claude Sonnet</span>
                  <span>{formatCurrency(estimateMutation.data.costs.claude_sonnet)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Claude Opus</span>
                  <span>{formatCurrency(estimateMutation.data.costs.claude_opus)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
