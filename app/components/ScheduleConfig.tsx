'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar, Clock } from 'lucide-react';

interface ScheduleConfigProps {
  onGenerate: (startDate: string, durationWeeks: number) => void;
  onDurationChange: (weeks: number) => void;
  minWorkers: number;
  minProfessionals: number;
}

export function ScheduleConfig({
  onGenerate,
  onDurationChange,
  minWorkers,
  minProfessionals,
}: ScheduleConfigProps) {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [durationWeeks, setDurationWeeks] = useState(4);

  const handleDurationChange = (value: string) => {
    const weeks = parseInt(value, 10);
    if (!isNaN(weeks) && weeks > 0) {
      setDurationWeeks(weeks);
      onDurationChange(weeks);
    }
  };

  const handleGenerate = () => {
    onGenerate(startDate, durationWeeks);
  };

  const canGenerate = minWorkers >= 2 && minProfessionals >= 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration (weeks)
            </Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={52}
              value={durationWeeks}
              onChange={(e) => handleDurationChange(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-2">
          {!canGenerate ? (
            <div className="text-sm text-destructive mb-2">
              {minWorkers < 2 && (
                <p>Need at least 2 workers (currently {minWorkers})</p>
              )}
              {minProfessionals < 1 && (
                <p>Need at least 1 professional (currently {minProfessionals})</p>
              )}
            </div>
          ) : null}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full"
          >
            Generate Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
