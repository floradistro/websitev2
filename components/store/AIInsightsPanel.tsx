'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIInsight {
  type: 'trend' | 'opportunity' | 'alert' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action?: string;
}

interface AIInsightsPanelProps {
  insights: AIInsight[];
  isLoading?: boolean;
  onRefresh?: () => void;
  generatedAt?: string;
}

export default function AIInsightsPanel({
  insights,
  isLoading = false,
}: AIInsightsPanelProps) {
  // Only show top 2 high priority insights
  const topInsights = insights.filter((i) => i.priority === 'high').slice(0, 2);

  if (isLoading || topInsights.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-1 py-2 text-xs text-white/40">
      <Sparkles className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{topInsights[0].title}</span>
      {topInsights[1] && (
        <>
          <span className="text-white/20">•</span>
          <span className="truncate">{topInsights[1].title}</span>
        </>
      )}
    </div>
  );
}
