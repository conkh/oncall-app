'use client';

import { useState, useEffect } from 'react';
import { Worker, Supervisor, WeekSchedule, AssignmentStats, OnCallRole } from '@/app/types';
import {
  getWorkers,
  getSupervisors,
  addWorker,
  addSupervisor,
  removeWorker,
  removeSupervisor,
  updateWorker,
  updateSupervisor,
  addPreAssignment,
  removePreAssignment,
  addSupervisorPreAssignment,
  removeSupervisorPreAssignment,
  saveSchedule,
  getSchedule,
} from '@/app/lib/storage';
import { generateSchedule } from '@/app/lib/scheduler';
import { PersonManager } from '@/app/components/PersonManager';
import { ConstraintManager } from '@/app/components/ConstraintManager';
import { PreAssignmentManager } from '@/app/components/PreAssignmentManager';
import { SupervisorPreAssignmentManager } from '@/app/components/SupervisorPreAssignmentManager';
import { ScheduleConfig } from '@/app/components/ScheduleConfig';
import { ScheduleView } from '@/app/components/ScheduleView';
import { StatsPanel } from '@/app/components/StatsPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Home() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [schedule, setSchedule] = useState<WeekSchedule[]>([]);
  const [stats, setStats] = useState<AssignmentStats[]>([]);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    setWorkers(getWorkers());
    setSupervisors(getSupervisors());
    const savedSchedule = getSchedule();
    if (savedSchedule) {
      setSchedule(savedSchedule.schedule);
      setStats(savedSchedule.stats);
    }
  }, []);

  const handleAddWorker = (name: string) => {
    const worker = addWorker(name);
    setWorkers(prev => [...prev, worker]);
    setError(null);
  };

  const handleAddSupervisor = (name: string) => {
    const supervisor = addSupervisor(name);
    setSupervisors(prev => [...prev, supervisor]);
    setError(null);
  };

  const handleRemoveWorker = (id: string) => {
    removeWorker(id);
    setWorkers(workers.filter(w => w.id !== id));
  };

  const handleRemoveSupervisor = (id: string) => {
    removeSupervisor(id);
    setSupervisors(supervisors.filter(s => s.id !== id));
  };

  const handleUpdateWorker = (worker: Worker) => {
    updateWorker(worker);
    setWorkers(workers.map(w => w.id === worker.id ? worker : w));
  };

  const handleUpdateSupervisor = (supervisor: Supervisor) => {
    updateSupervisor(supervisor);
    setSupervisors(supervisors.map(s => s.id === supervisor.id ? supervisor : s));
  };

  const handleAddPreAssignment = (workerId: string, weekNumber: number, role: OnCallRole) => {
    addPreAssignment(workerId, weekNumber, role);
    setWorkers(getWorkers());
  };

  const handleRemovePreAssignment = (workerId: string, weekNumber: number) => {
    removePreAssignment(workerId, weekNumber);
    setWorkers(getWorkers());
  };

  const handleAddSupervisorPreAssignment = (supervisorId: string, weekNumber: number) => {
    addSupervisorPreAssignment(supervisorId, weekNumber);
    setSupervisors(getSupervisors());
  };

  const handleRemoveSupervisorPreAssignment = (supervisorId: string, weekNumber: number) => {
    removeSupervisorPreAssignment(supervisorId, weekNumber);
    setSupervisors(getSupervisors());
  };

  const handleGenerateSchedule = (startDate: string, weeks: number) => {
    try {
      setError(null);
      const result = generateSchedule(
        { startDate, durationWeeks: weeks },
        workers,
        supervisors
      );
      setSchedule(result.schedule);
      setStats(result.stats);
      saveSchedule(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule');
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            On-Call Scheduler
          </h1>
          <p className="text-muted-foreground">
            Schedule workers and supervisors with balanced assignments and constraints
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <PersonManager
              workers={workers}
              supervisors={supervisors}
              onAddWorker={handleAddWorker}
              onAddSupervisor={handleAddSupervisor}
              onRemoveWorker={handleRemoveWorker}
              onRemoveSupervisor={handleRemoveSupervisor}
            />

            <PreAssignmentManager
              workers={workers}
              durationWeeks={durationWeeks}
              onAddPreAssignment={handleAddPreAssignment}
              onRemovePreAssignment={handleRemovePreAssignment}
            />

            <SupervisorPreAssignmentManager
              supervisors={supervisors}
              durationWeeks={durationWeeks}
              onAddPreAssignment={handleAddSupervisorPreAssignment}
              onRemovePreAssignment={handleRemoveSupervisorPreAssignment}
            />

            <ConstraintManager
              workers={workers}
              supervisors={supervisors}
              durationWeeks={durationWeeks}
              onUpdateWorker={handleUpdateWorker}
              onUpdateSupervisor={handleUpdateSupervisor}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <ScheduleConfig
              onGenerate={handleGenerateSchedule}
              onDurationChange={setDurationWeeks}
              minWorkers={workers.length}
              minProfessionals={supervisors.length}
            />

            {stats.length > 0 && <StatsPanel stats={stats} />}
          </div>
        </div>

        {/* Schedule View - Full Width */}
        {schedule.length > 0 && (
          <ScheduleView schedule={schedule} />
        )}

        {/* Empty State */}
        {schedule.length === 0 && workers.length >= 2 && supervisors.length >= 1 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Configure your schedule and click &quot;Generate Schedule&quot; to create an on-call rotation
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
