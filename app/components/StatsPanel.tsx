'use client';

import { AssignmentStats } from '@/app/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Shield } from 'lucide-react';

interface StatsPanelProps {
  stats: AssignmentStats[];
}

export function StatsPanel({ stats }: StatsPanelProps) {
  if (stats.length === 0) {
    return null;
  }

  const workerStats = stats.filter(s => s.role === 'worker');
  const supervisorStats = stats.filter(s => s.role === 'supervisor');

  const maxWorkerTotal = Math.max(...workerStats.map(s => s.total), 1);
  const maxSupervisorTotal = Math.max(...supervisorStats.map(s => s.total), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Assignment Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workers Section */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Workers
          </h4>
          {workerStats.map((stat) => (
            <div key={stat.personId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stat.personName}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    1st: {stat.firstOnCallCount}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    2nd: {stat.secondOnCallCount}
                  </Badge>
                  <span className="text-muted-foreground">Total: {stat.total}</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(stat.total / maxWorkerTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Supervisors Section */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Supervisors
          </h4>
          {supervisorStats.map((stat) => (
            <div key={stat.personId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stat.personName}</span>
                <span className="text-muted-foreground">Total: {stat.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(stat.total / maxSupervisorTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {workerStats.reduce((sum, s) => sum + s.firstOnCallCount, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total 1st On-Call</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {workerStats.reduce((sum, s) => sum + s.secondOnCallCount, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total 2nd On-Call</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
