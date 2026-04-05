'use client';

import { useState } from 'react';
import { Supervisor } from '@/app/types';
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
import { CalendarCheck, Shield, Trash2 } from 'lucide-react';

interface SupervisorPreAssignmentManagerProps {
  supervisors: Supervisor[];
  durationWeeks: number;
  onAddPreAssignment: (supervisorId: string, weekNumber: number) => void;
  onRemovePreAssignment: (supervisorId: string, weekNumber: number) => void;
}

export function SupervisorPreAssignmentManager({
  supervisors,
  durationWeeks,
  onAddPreAssignment,
  onRemovePreAssignment,
}: SupervisorPreAssignmentManagerProps) {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  const selectedSupervisor = supervisors.find(s => s.id === selectedSupervisorId);

  const handleAdd = () => {
    if (selectedSupervisorId && selectedWeek) {
      onAddPreAssignment(selectedSupervisorId, parseInt(selectedWeek));
      setSelectedWeek('');
    }
  };

  // Get all pre-assignments across all supervisors
  const allPreAssignments = supervisors.flatMap(supervisor =>
    supervisor.preAssignments.map(weekNumber => ({
      weekNumber,
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
    }))
  ).sort((a, b) => a.weekNumber - b.weekNumber || a.supervisorName.localeCompare(b.supervisorName));

  // Check if a week is already pre-assigned to any supervisor
  const isWeekPreAssigned = (weekNum: number): boolean => {
    return supervisors.some(s => s.preAssignments.includes(weekNum));
  };

  // Get the supervisor name for a pre-assigned week
  const getPreAssignedSupervisorName = (weekNum: number): string | undefined => {
    const s = supervisors.find(sup => sup.preAssignments.includes(weekNum));
    return s?.name;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Supervisor Pre-Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Supervisor</Label>
            <Select value={selectedSupervisorId} onValueChange={(value) => value && setSelectedSupervisorId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select supervisor..." />
              </SelectTrigger>
              <SelectContent>
                {supervisors.length === 0 ? (
                  <SelectItem value="" disabled>
                    No supervisors available
                  </SelectItem>
                ) : (
                  supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{supervisor.name}</span>
                        {supervisor.preAssignments.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {supervisor.preAssignments.length} pre
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
                  // Check if this week already has a pre-assignment for this supervisor
                  const alreadyAssigned = selectedSupervisor?.preAssignments.includes(weekNum);
                  // Check if another supervisor has this week pre-assigned
                  const assignedToOther = !!selectedSupervisorId && !alreadyAssigned && isWeekPreAssigned(weekNum);
                  const otherSupervisorName = assignedToOther ? getPreAssignedSupervisorName(weekNum) : null;
                  
                  return (
                    <SelectItem 
                      key={weekNum} 
                      value={weekNum.toString()}
                      disabled={alreadyAssigned || assignedToOther}
                    >
                      Week {weekNum}
                      {alreadyAssigned && ' (already assigned)'}
                      {assignedToOther && ` (assigned to ${otherSupervisorName})`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleAdd}
          disabled={!selectedSupervisorId || !selectedWeek}
          className="w-full"
        >
          Add Supervisor Pre-Assignment
        </Button>

        {/* List of existing pre-assignments */}
        {allPreAssignments.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground">
              Current Supervisor Pre-Assignments ({allPreAssignments.length})
            </h4>
            <div className="space-y-2">
              {allPreAssignments.map((pa, index) => (
                <div
                  key={`${pa.supervisorId}-${pa.weekNumber}`}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{pa.supervisorName}</span>
                    <Badge variant="outline">Week {pa.weekNumber}</Badge>
                    <Badge variant="default" className="bg-purple-500">Supervisor</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemovePreAssignment(pa.supervisorId, pa.weekNumber)}
                    className="h-7 w-7 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {allPreAssignments.length === 0 && supervisors.length > 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            No supervisor pre-assignments yet. Select a supervisor and week to add one.
          </p>
        )}

        {supervisors.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            Add supervisors first to create pre-assignments
          </p>
        )}
      </CardContent>
    </Card>
  );
}
