import { Worker, Supervisor, ScheduleResult, OnCallRole } from '@/app/types';

const STORAGE_KEYS = {
  WORKERS: 'oncall-workers',
  SUPERVISORS: 'oncall-supervisors',
  SCHEDULE: 'oncall-schedule',
  // Legacy keys for migration
  PROFESSIONALS: 'oncall-professionals',
};

// Migration: Convert old professionals to supervisors
function migrateProfessionalsToSupervisors(): void {
  if (typeof window === 'undefined') return;
  const oldData = localStorage.getItem(STORAGE_KEYS.PROFESSIONALS);
  if (oldData && !localStorage.getItem(STORAGE_KEYS.SUPERVISORS)) {
    const professionals = JSON.parse(oldData);
    const supervisors: Supervisor[] = professionals.map((p: any) => ({
      ...p,
      role: 'supervisor' as const,
    }));
    localStorage.setItem(STORAGE_KEYS.SUPERVISORS, JSON.stringify(supervisors));
  }
}

// Workers
export function getWorkers(): Worker[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.WORKERS);
  const workers = data ? JSON.parse(data) : [];
  // Ensure preAssignments field exists for backward compatibility
  return workers.map((w: any) => ({
    ...w,
    preAssignments: w.preAssignments || [],
  }));
}

export function saveWorkers(workers: Worker[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
}

export function addWorker(name: string): Worker {
  const workers = getWorkers();
  const newWorker: Worker = {
    id: Math.random().toString(36).substring(2, 15),
    name: name.trim(),
    role: 'worker',
    unavailableWeeks: [],
    preAssignments: [],
  };
  saveWorkers([...workers, newWorker]);
  return newWorker;
}

export function removeWorker(id: string): void {
  const workers = getWorkers();
  saveWorkers(workers.filter(w => w.id !== id));
}

export function updateWorker(worker: Worker): void {
  const workers = getWorkers();
  const index = workers.findIndex(w => w.id === worker.id);
  if (index !== -1) {
    workers[index] = worker;
    saveWorkers(workers);
  }
}

export function addPreAssignment(workerId: string, weekNumber: number, role: OnCallRole): void {
  const workers = getWorkers();
  const worker = workers.find(w => w.id === workerId);
  if (!worker) return;
  
  // Remove any existing pre-assignment for this week
  worker.preAssignments = worker.preAssignments.filter(pa => pa.weekNumber !== weekNumber);
  
  // Add new pre-assignment
  worker.preAssignments.push({ weekNumber, role });
  worker.preAssignments.sort((a, b) => a.weekNumber - b.weekNumber);
  
  saveWorkers(workers);
}

export function removePreAssignment(workerId: string, weekNumber: number): void {
  const workers = getWorkers();
  const worker = workers.find(w => w.id === workerId);
  if (!worker) return;
  
  worker.preAssignments = worker.preAssignments.filter(pa => pa.weekNumber !== weekNumber);
  saveWorkers(workers);
}

// Supervisor Pre-Assignments
export function addSupervisorPreAssignment(supervisorId: string, weekNumber: number): void {
  const supervisors = getSupervisors();
  const supervisor = supervisors.find(s => s.id === supervisorId);
  if (!supervisor) return;
  
  // Remove any existing pre-assignment for this week from other supervisors
  supervisors.forEach(s => {
    if (s.id !== supervisorId) {
      s.preAssignments = s.preAssignments.filter(w => w !== weekNumber);
    }
  });
  
  // Add new pre-assignment if not already present
  if (!supervisor.preAssignments.includes(weekNumber)) {
    supervisor.preAssignments.push(weekNumber);
    supervisor.preAssignments.sort((a, b) => a - b);
  }
  
  saveSupervisors(supervisors);
}

export function removeSupervisorPreAssignment(supervisorId: string, weekNumber: number): void {
  const supervisors = getSupervisors();
  const supervisor = supervisors.find(s => s.id === supervisorId);
  if (!supervisor) return;
  
  supervisor.preAssignments = supervisor.preAssignments.filter(w => w !== weekNumber);
  saveSupervisors(supervisors);
}

// Supervisors
export function getSupervisors(): Supervisor[] {
  if (typeof window === 'undefined') return [];
  migrateProfessionalsToSupervisors();
  const data = localStorage.getItem(STORAGE_KEYS.SUPERVISORS);
  const supervisors = data ? JSON.parse(data) : [];
  // Ensure preAssignments field exists for backward compatibility
  return supervisors.map((s: any) => ({
    ...s,
    preAssignments: s.preAssignments || [],
  }));
}

export function saveSupervisors(supervisors: Supervisor[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SUPERVISORS, JSON.stringify(supervisors));
}

export function addSupervisor(name: string): Supervisor {
  const supervisors = getSupervisors();
  const newSupervisor: Supervisor = {
    id: Math.random().toString(36).substring(2, 15),
    name: name.trim(),
    role: 'supervisor',
    unavailableWeeks: [],
    preAssignments: [],
  };
  saveSupervisors([...supervisors, newSupervisor]);
  return newSupervisor;
}

export function removeSupervisor(id: string): void {
  const supervisors = getSupervisors();
  saveSupervisors(supervisors.filter(s => s.id !== id));
}

export function updateSupervisor(supervisor: Supervisor): void {
  const supervisors = getSupervisors();
  const index = supervisors.findIndex(s => s.id === supervisor.id);
  if (index !== -1) {
    supervisors[index] = supervisor;
    saveSupervisors(supervisors);
  }
}

// Schedule
export function getSchedule(): ScheduleResult | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
  return data ? JSON.parse(data) : null;
}

export function saveSchedule(schedule: ScheduleResult): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
}

export function clearSchedule(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
}
