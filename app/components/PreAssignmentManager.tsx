'use client';

import { useState } from 'react';
import { Worker, OnCallRole } from '@/app/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, Users, Trash2 } from 'lucide-react';

interface PreAssignmentManagerProps {
  workers: Worker[];
  durationWeeks: number;
  onAddPreAssignment: (workerId: string, weekNumber: number, role: OnCallRole) => void;
  onRemovePreAssignment: (workerId: string, weekNumber: number) => void;
}

export function PreAssignmentManager({
  workers,
  durationWeeks,
  onAddPreAssignment,
  onRemovePreAssignment,
}: PreAssignmentManagerProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<OnCallRole>('first');

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  const handleAdd = () => {
    if (selectedWorkerId && selectedWeek) {
      onAddPreAssignment(selectedWorkerId, parseInt(selectedWeek), selectedRole);
      setSelectedWeek('');
      setSelectedRole('first');
    }
  };

  // Get all pre-assignments across all workers
  const allPreAssignments = workers.flatMap(worker =>
    worker.preAssignments.map(pa => ({
      ...pa,
      workerId: worker.id,
      workerName: worker.name,
    }))
  ).sort((a, b) => a.weekNumber - b.weekNumber || a.workerName.localeCompare(b.workerName));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5" />
          Pre-Requested Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Worker</Label>
            <Select value={selectedWorkerId} onValueChange={(value) => value && setSelectedWorkerId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select worker...">
                  {selectedWorker?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {workers.length === 0 ? (
                  <SelectItem value="" disabled>
                    No workers available
                  </SelectItem>
                ) : (
                  workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{worker.name}</span>
                        {worker.preAssignments.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {worker.preAssignments.length} pre
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Week</Label>
            <Select value={selectedWeek} onValueChange={(value) => value && setSelectedWeek(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select week..." />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: durationWeeks }, (_, i) => i + 1).map((weekNum) => {
                  // Check if this week already has a pre-assignment for this worker
                  const alreadyAssigned = selectedWorker?.preAssignments.some(
                    pa => pa.weekNumber === weekNum
                  );
                  // Check if this week is marked as time-off (unavailable)
                  const isTimeOff = selectedWorker?.unavailableWeeks.includes(weekNum);
                  return (
                    <SelectItem 
                      key={weekNum} 
                      value={weekNum.toString()}
                      disabled={alreadyAssigned || isTimeOff}
                    >
                      Week {weekNum}
                      {alreadyAssigned && ' (already assigned)'}
                      {isTimeOff && ' (time-off)'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select 
              value={selectedRole} 
              onValueChange={(value) => value && setSelectedRole(value as OnCallRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first">
                  <Badge variant="default" className="mr-2">1st</Badge>
                  First On-Call
                </SelectItem>
                <SelectItem value="second">
                  <Badge variant="secondary" className="mr-2">2nd</Badge>
                  Second On-Call
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleAdd}
          disabled={!selectedWorkerId || !selectedWeek}
          className="w-full"
        >
          Add Pre-Assignment
        </Button>

        {/* List of existing pre-assignments */}
        {allPreAssignments.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground">
              Current Pre-Assignments ({allPreAssignments.length})
            </h4>
            <div className="space-y-2">
              {allPreAssignments.map((pa, index) => (
                <div
                  key={`${pa.workerId}-${pa.weekNumber}`}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{pa.workerName}</span>
                    <Badge variant="outline">Week {pa.weekNumber}</Badge>
                    <Badge variant={pa.role === 'first' ? 'default' : 'secondary'}>
                      {pa.role === 'first' ? '1st On-Call' : '2nd On-Call'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemovePreAssignment(pa.workerId, pa.weekNumber)}
                    className="h-7 w-7 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {allPreAssignments.length === 0 && workers.length > 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            No pre-assignments yet. Select a worker, week, and role to add one.
          </p>
        )}

        {workers.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            Add workers first to create pre-assignments
          </p>
        )}
      </CardContent>
    </Card>
  );
}
