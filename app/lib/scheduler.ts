import { Worker, Supervisor, WeekSchedule, ScheduleConfig, AssignmentStats, ScheduleResult, OnCallRole } from '@/app/types';

interface WorkerStats {
  worker: Worker;
  firstOnCallCount: number;
  secondOnCallCount: number;
}

interface SupervisorStats {
  supervisor: Supervisor;
  count: number;
}

// Constraint checking functions
function hadAnyRoleLastWeek(schedule: WeekSchedule[], currentWeek: number, workerId: string): boolean {
  if (currentWeek <= 1) return false;
  const lastWeek = schedule.find(s => s.weekNumber === currentWeek - 1);
  return lastWeek?.firstOnCall?.id === workerId || lastWeek?.secondOnCall?.id === workerId;
}

function hasAnyRoleForPastTwoWeeks(schedule: WeekSchedule[], currentWeek: number, workerId: string): boolean {
  if (currentWeek <= 2) return false;
  const week1 = schedule.find(s => s.weekNumber === currentWeek - 2);
  const week2 = schedule.find(s => s.weekNumber === currentWeek - 1);
  
  const hadRoleWeek1 = week1?.firstOnCall?.id === workerId || week1?.secondOnCall?.id === workerId;
  const hadRoleWeek2 = week2?.firstOnCall?.id === workerId || week2?.secondOnCall?.id === workerId;
  
  return hadRoleWeek1 && hadRoleWeek2;
}

// Supervisor constraint: Cannot be supervisor for 2 consecutive weeks
function wasSupervisorLastWeek(schedule: WeekSchedule[], currentWeek: number, supervisorId: string): boolean {
  if (currentWeek <= 1) return false;
  const lastWeek = schedule.find(s => s.weekNumber === currentWeek - 1);
  return lastWeek?.supervisor?.id === supervisorId;
}

export function generateSchedule(
  config: ScheduleConfig,
  workers: Worker[],
  supervisors: Supervisor[]
): ScheduleResult {
  if (workers.length < 2) {
    throw new Error('At least 2 workers are required');
  }
  if (supervisors.length < 1) {
    throw new Error('At least 1 supervisor is required');
  }

  const { startDate, durationWeeks } = config;
  const schedule: WeekSchedule[] = [];
  
  // Initialize stats tracking
  const workerStats: WorkerStats[] = workers.map(w => ({
    worker: w,
    firstOnCallCount: 0,
    secondOnCallCount: 0,
  }));
  
  const supervisorStats: SupervisorStats[] = supervisors.map(s => ({
    supervisor: s,
    count: 0,
  }));

  // Step 1: Process Pre-Assignments (Priority Override)
  for (let weekNum = 1; weekNum <= durationWeeks; weekNum++) {
    const weekSchedule: Partial<WeekSchedule> = {
      weekNumber: weekNum,
      startDate: addWeeks(startDate, weekNum - 1),
      isPreAssigned: { firstOnCall: false, secondOnCall: false, supervisor: false },
    };

    // Find worker pre-assignments for this week
    for (const ws of workerStats) {
      const preAssignment = ws.worker.preAssignments.find(pa => pa.weekNumber === weekNum);
      if (preAssignment) {
        if (preAssignment.role === 'first') {
          weekSchedule.firstOnCall = ws.worker;
          weekSchedule.isPreAssigned!.firstOnCall = true;
          ws.firstOnCallCount++;
        } else {
          weekSchedule.secondOnCall = ws.worker;
          weekSchedule.isPreAssigned!.secondOnCall = true;
          ws.secondOnCallCount++;
        }
      }
    }

    // Find supervisor pre-assignments for this week
    const preAssignedSupervisor = supervisorStats.find(ss => 
      ss.supervisor.preAssignments.includes(weekNum)
    );
    if (preAssignedSupervisor) {
      weekSchedule.supervisor = preAssignedSupervisor.supervisor;
      weekSchedule.isPreAssigned!.supervisor = true;
      preAssignedSupervisor.count++;
    }

    schedule.push(weekSchedule as WeekSchedule);
  }

  // Step 2: Fill First On-Call slots
  for (let weekNum = 1; weekNum <= durationWeeks; weekNum++) {
    const weekSchedule = schedule.find(s => s.weekNumber === weekNum)!;
    
    // Skip if already pre-assigned
    if (weekSchedule.isPreAssigned.firstOnCall) continue;

    // Get available workers for this week
    let availableWorkers = workerStats.filter(ws => {
      // Not on time-off
      if (ws.worker.unavailableWeeks.includes(weekNum)) return false;
      // Not already assigned as second on-call this week
      if (weekSchedule.secondOnCall?.id === ws.worker.id) return false;
      // Not pre-assigned as second on-call this week
      const preAssignedSecond = ws.worker.preAssignments.some(
        pa => pa.weekNumber === weekNum && pa.role === 'second'
      );
      if (preAssignedSecond) return false;
      return true;
    });

    // Apply Constraint 1: Cannot have ANY role for 2 consecutive weeks
    availableWorkers = availableWorkers.filter(ws => 
      !hadAnyRoleLastWeek(schedule, weekNum, ws.worker.id)
    );

    // Apply Constraint 2: Cannot have ANY role for 3 consecutive weeks
    availableWorkers = availableWorkers.filter(ws => 
      !hasAnyRoleForPastTwoWeeks(schedule, weekNum, ws.worker.id)
    );

    if (availableWorkers.length === 0) {
      throw new Error(
        `Week ${weekNum}: No available workers for First On-Call. ` +
        `All workers violate constraints (consecutive week rules) or are unavailable.`
      );
    }

    // Sort by first on-call count (ascending) to balance
    availableWorkers.sort((a, b) => {
      const firstDiff = a.firstOnCallCount - b.firstOnCallCount;
      if (firstDiff !== 0) return firstDiff;
      const totalA = a.firstOnCallCount + a.secondOnCallCount;
      const totalB = b.firstOnCallCount + b.secondOnCallCount;
      return totalA - totalB;
    });

    // Assign first on-call
    const selectedWorker = availableWorkers[0];
    weekSchedule.firstOnCall = selectedWorker.worker;
    selectedWorker.firstOnCallCount++;
  }

  // Step 3: Fill Second On-Call slots
  for (let weekNum = 1; weekNum <= durationWeeks; weekNum++) {
    const weekSchedule = schedule.find(s => s.weekNumber === weekNum)!;
    
    // Skip if already pre-assigned
    if (weekSchedule.isPreAssigned.secondOnCall) continue;

    // Get available workers for this week
    let availableWorkers = workerStats.filter(ws => {
      // Not on time-off
      if (ws.worker.unavailableWeeks.includes(weekNum)) return false;
      // Not already assigned as first on-call this week
      if (weekSchedule.firstOnCall?.id === ws.worker.id) return false;
      return true;
    });

    // Apply Constraint 1: Cannot have ANY role for 2 consecutive weeks
    availableWorkers = availableWorkers.filter(ws => 
      !hadAnyRoleLastWeek(schedule, weekNum, ws.worker.id)
    );

    // Apply Constraint 2: Cannot have ANY role for 3 consecutive weeks
    availableWorkers = availableWorkers.filter(ws => 
      !hasAnyRoleForPastTwoWeeks(schedule, weekNum, ws.worker.id)
    );

    if (availableWorkers.length === 0) {
      throw new Error(
        `Week ${weekNum}: No available workers for Second On-Call. ` +
        `All workers violate constraints (consecutive week rules) or are unavailable.`
      );
    }

    // Sort by total count (ascending) to balance overall workload
    availableWorkers.sort((a, b) => {
      const totalA = a.firstOnCallCount + a.secondOnCallCount;
      const totalB = b.firstOnCallCount + b.secondOnCallCount;
      return totalA - totalB;
    });

    // Assign second on-call
    const selectedWorker = availableWorkers[0];
    weekSchedule.secondOnCall = selectedWorker.worker;
    selectedWorker.secondOnCallCount++;
  }

  // Step 4: Assign Supervisors
  for (let weekNum = 1; weekNum <= durationWeeks; weekNum++) {
    const weekSchedule = schedule.find(s => s.weekNumber === weekNum)!;
    
    // Skip if already pre-assigned
    if (weekSchedule.isPreAssigned.supervisor) continue;

    // Get available supervisors for this week
    let availableSupervisors = supervisorStats.filter(ss => 
      !ss.supervisor.unavailableWeeks.includes(weekNum)
    );

    // Apply Constraint: Cannot be supervisor for 2 consecutive weeks
    availableSupervisors = availableSupervisors.filter(ss => 
      !wasSupervisorLastWeek(schedule, weekNum, ss.supervisor.id)
    );

    if (availableSupervisors.length === 0) {
      throw new Error(
        `Week ${weekNum}: No available supervisors. ` +
        `All supervisors violate the consecutive week constraint or are unavailable.`
      );
    }

    // Sort by count (ascending)
    availableSupervisors.sort((a, b) => a.count - b.count);
    
    // Assign supervisor
    const selectedSupervisor = availableSupervisors[0];
    weekSchedule.supervisor = selectedSupervisor.supervisor;
    selectedSupervisor.count++;
  }

  // Generate assignment statistics
  const stats: AssignmentStats[] = [
    ...workerStats.map(ws => ({
      personId: ws.worker.id,
      personName: ws.worker.name,
      role: 'worker' as const,
      firstOnCallCount: ws.firstOnCallCount,
      secondOnCallCount: ws.secondOnCallCount,
      supervisorCount: 0,
      total: ws.firstOnCallCount + ws.secondOnCallCount,
    })),
    ...supervisorStats.map(ss => ({
      personId: ss.supervisor.id,
      personName: ss.supervisor.name,
      role: 'supervisor' as const,
      firstOnCallCount: 0,
      secondOnCallCount: 0,
      supervisorCount: ss.count,
      total: ss.count,
    })),
  ];

  return {
    schedule,
    stats,
    generatedAt: new Date().toISOString(),
  };
}

function addWeeks(dateString: string, weeks: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().split('T')[0];
}

export function exportToCSV(schedule: WeekSchedule[]): string {
  const headers = ['Week', 'Start Date', 'First On-Call', 'Second On-Call', 'Supervisor', 'Pre-Assigned'];
  const rows = schedule.map(week => [
    week.weekNumber,
    week.startDate,
    week.firstOnCall.name,
    week.secondOnCall.name,
    week.supervisor.name,
    week.isPreAssigned.firstOnCall || week.isPreAssigned.secondOnCall ? 'Yes' : 'No',
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

export function exportToJSON(schedule: WeekSchedule[]): string {
  const simplified = schedule.map(week => ({
    weekNumber: week.weekNumber,
    startDate: week.startDate,
    firstOnCall: week.firstOnCall.name,
    secondOnCall: week.secondOnCall.name,
    supervisor: week.supervisor.name,
    isPreAssigned: week.isPreAssigned,
  }));
  return JSON.stringify(simplified, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
