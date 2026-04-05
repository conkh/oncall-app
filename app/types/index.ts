export type OnCallRole = 'first' | 'second';

export interface Person {
  id: string;
  name: string;
  unavailableWeeks: number[];
}

export interface Worker extends Person {
  role: 'worker';
  preAssignments: { weekNumber: number; role: OnCallRole }[];
}

export interface Supervisor extends Person {
  role: 'supervisor';
  preAssignments: number[]; // Array of week numbers where supervisor is pre-assigned
}

export interface WeekSchedule {
  weekNumber: number;
  startDate: string;
  firstOnCall: Worker;
  secondOnCall: Worker;
  supervisor: Supervisor;
  isPreAssigned: {
    firstOnCall: boolean;
    secondOnCall: boolean;
    supervisor: boolean;
  };
}

export interface ScheduleConfig {
  startDate: string;
  durationWeeks: number;
}

export interface AssignmentStats {
  personId: string;
  personName: string;
  role: 'worker' | 'supervisor';
  firstOnCallCount: number;
  secondOnCallCount: number;
  supervisorCount: number;
  total: number;
}

export interface ScheduleResult {
  schedule: WeekSchedule[];
  stats: AssignmentStats[];
  generatedAt: string;
}

export interface Constraint {
  personId: string;
  weekNumber: number;
}

export interface PreAssignment {
  workerId: string;
  workerName: string;
  weekNumber: number;
  role: OnCallRole;
}
