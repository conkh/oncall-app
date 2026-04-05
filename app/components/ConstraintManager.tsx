'use client';

import { useState } from 'react';
import { Worker, Supervisor } from '@/app/types';
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
import { CalendarX2, Users, Shield } from 'lucide-react';

interface ConstraintManagerProps {
  workers: Worker[];
  supervisors: Supervisor[];
  durationWeeks: number;
  onUpdateWorker: (worker: Worker) => void;
  onUpdateSupervisor: (supervisor: Supervisor) => void;
}

export function ConstraintManager({
  workers,
  supervisors,
  durationWeeks,
  onUpdateWorker,
  onUpdateSupervisor,
}: ConstraintManagerProps) {
  const [selectedType, setSelectedType] = useState<'worker' | 'supervisor'>('worker');
  const [selectedId, setSelectedId] = useState<string>('');

  const people = selectedType === 'worker' ? workers : supervisors;
  const selectedPerson = people.find(p => p.id === selectedId);

  const handleToggleWeek = (weekNum: number) => {
    if (!selectedPerson) return;

    const currentUnavailable = selectedPerson.unavailableWeeks;
    const newUnavailable = currentUnavailable.includes(weekNum)
      ? currentUnavailable.filter(w => w !== weekNum)
      : [...currentUnavailable, weekNum].sort((a, b) => a - b);

    const updatedPerson = { ...selectedPerson, unavailableWeeks: newUnavailable };

    if (selectedType === 'worker') {
      onUpdateWorker(updatedPerson as Worker);
    } else {
      onUpdateSupervisor(updatedPerson as Supervisor);
    }
  };

  const getUnavailableCount = (person: Worker | Supervisor) => {
    return person.unavailableWeeks.length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarX2 className="h-5 w-5" />
          Constraints & Time-Off
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={selectedType}
              onValueChange={(value: 'worker' | 'supervisor' | null) => {
                if (value) {
                  setSelectedType(value);
                  setSelectedId('');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker" className="flex items-center gap-2">
                  <Users className="h-4 w-4 inline mr-2" />
                  Worker
                </SelectItem>
                <SelectItem value="supervisor" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 inline mr-2" />
                  Supervisor
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{selectedType === 'worker' ? 'Worker' : 'Supervisor'}</Label>
            <Select value={selectedId} onValueChange={(value: string | null) => value && setSelectedId(value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${selectedType}...`}>
                  {selectedPerson?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {people.length === 0 ? (
                  <SelectItem value="" disabled>
                    No {selectedType}s available
                  </SelectItem>
                ) : (
                  people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{person.name}</span>
                        {getUnavailableCount(person) > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {getUnavailableCount(person)} off
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedPerson && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{selectedPerson.name}</h4>
              <span className="text-sm text-muted-foreground">
                Select unavailable weeks (Time-Off):
              </span>
            </div>
            
            {/* Warning for pre-assigned weeks */}
            {(() => {
              const preAssignedWeeks = selectedType === 'worker'
                ? (selectedPerson as Worker).preAssignments.map(pa => pa.weekNumber)
                : (selectedPerson as Supervisor).preAssignments;
              return preAssignedWeeks.length > 0 ? (
                <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  <span className="font-medium">Note:</span> Weeks with pre-assignments ({preAssignedWeeks.map(w => `W${w}`).join(', ')}) cannot be marked as time-off.
                </div>
              ) : null;
            })()}
            
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: durationWeeks }, (_, i) => i + 1).map((weekNum) => {
                const isUnavailable = selectedPerson.unavailableWeeks.includes(weekNum);
                // Check if worker has pre-assignment for this week
                const hasPreAssignment = selectedType === 'worker' 
                  ? (selectedPerson as Worker).preAssignments.some(pa => pa.weekNumber === weekNum)
                  : (selectedPerson as Supervisor).preAssignments.includes(weekNum);
                return (
                  <Button
                    key={weekNum}
                    variant={isUnavailable ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleWeek(weekNum)}
                    disabled={hasPreAssignment}
                    title={hasPreAssignment ? 'Cannot set time-off: person has pre-assignment for this week' : ''}
                    className={`h-10 relative ${isUnavailable ? 'bg-destructive hover:bg-destructive/90' : ''} ${hasPreAssignment ? 'opacity-50 cursor-not-allowed border-orange-400' : ''}`}
                  >
                    W{weekNum}
                    {hasPreAssignment && <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />}
                  </Button>
                );
              })}
            </div>

            {selectedPerson.unavailableWeeks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Time-Off:</span>
                {selectedPerson.unavailableWeeks.map(weekNum => (
                  <Badge key={weekNum} variant="destructive">
                    Week {weekNum}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedPerson && people.length > 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            Select a person to set their time-off weeks
          </p>
        )}

        {people.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            Add {selectedType}s first to set time-off
          </p>
        )}
      </CardContent>
    </Card>
  );
}
