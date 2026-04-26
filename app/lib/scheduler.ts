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

interface SolverState {
  schedule: WeekSchedule[];
  workerStats: WorkerStats[];
  supervisorStats: SupervisorStats[];
}

function initializeScheduleWithPreAssignments(
  config: ScheduleConfig,
  workers: Worker[],
  supervisors: Supervisor[]
): SolverState {
  const { startDate, durationWeeks } = config;
  const schedule: WeekSchedule[] = [];

  const workerStats: WorkerStats[] = workers.map(w => ({
    worker: w,
    firstOnCallCount: 0,
    secondOnCallCount: 0,
  }));

  const supervisorStats: SupervisorStats[] = supervisors.map(s => ({
    supervisor: s,
    count: 0,
  }));

  for (let weekNum = 1; weekNum <= durationWeeks; weekNum++) {
    const weekSchedule: WeekSchedule = {
      weekNumber: weekNum,
      startDate: addWeeks(startDate, weekNum - 1),
      firstOnCall: null as any,
      secondOnCall: null as any,
      supervisor: null as any,
      isPreAssigned: { firstOnCall: false, secondOnCall: false, supervisor: false },
    };

    for (const ws of workerStats) {
      const preAssignment = ws.worker.preAssignments.find(pa => pa.weekNumber === weekNum);
      if (preAssignment) {
        if (preAssignment.role === 'first') {
          weekSchedule.firstOnCall = ws.worker;
          weekSchedule.isPreAssigned.firstOnCall = true;
          ws.firstOnCallCount++;
        } else {
          weekSchedule.secondOnCall = ws.worker;
          weekSchedule.isPreAssigned.secondOnCall = true;
          ws.secondOnCallCount++;
        }
      }
    }

    const preAssignedSupervisor = supervisorStats.find(ss =>
      ss.supervisor.preAssignments.includes(weekNum)
    );
    if (preAssignedSupervisor) {
      weekSchedule.supervisor = preAssignedSupervisor.supervisor;
      weekSchedule.isPreAssigned.supervisor = true;
      preAssignedSupervisor.count++;
    }

    schedule.push(weekSchedule);
  }

  return { schedule, workerStats, supervisorStats };
}

function calculateBalanceScore(state: SolverState): number {
  const workerTotals = state.workerStats.map(ws => ws.firstOnCallCount + ws.secondOnCallCount);
  const supervisorTotals = state.supervisorStats.map(ss => ss.count);

  if (workerTotals.length === 0 || supervisorTotals.length === 0) return Infinity;

  const workerMean = workerTotals.reduce((a, b) => a + b, 0) / workerTotals.length;
  const supervisorMean = supervisorTotals.reduce((a, b) => a + b, 0) / supervisorTotals.length;

  const workerVariance = workerTotals.reduce((sum, t) => sum + (t - workerMean) ** 2, 0);
  const supervisorVariance = supervisorTotals.reduce((sum, t) => sum + (t - supervisorMean) ** 2, 0);

  return workerVariance + supervisorVariance;
}

function cloneSchedule(schedule: WeekSchedule[]): WeekSchedule[] {
  return schedule.map(week => ({
    ...week,
    isPreAssigned: { ...week.isPreAssigned },
  }));
}

function recalculateStats(state: SolverState, schedule: WeekSchedule[]) {
  for (const ws of state.workerStats) {
    ws.firstOnCallCount = 0;
    ws.secondOnCallCount = 0;
  }
  for (const ss of state.supervisorStats) {
    ss.count = 0;
  }

  for (const week of schedule) {
    const firstWs = state.workerStats.find(ws => ws.worker.id === week.firstOnCall.id);
    if (firstWs) firstWs.firstOnCallCount++;

    const secondWs = state.workerStats.find(ws => ws.worker.id === week.secondOnCall.id);
    if (secondWs) secondWs.secondOnCallCount++;

    const sup = state.supervisorStats.find(ss => ss.supervisor.id === week.supervisor.id);
    if (sup) sup.count++;
  }
}

function solveWithBacktracking(
  state: SolverState,
  durationWeeks: number,
  maxIterations: number = 100000,
  timeoutMs: number = 3000
): WeekSchedule[] | null {
  let bestScore = Infinity;
  let bestSolution: WeekSchedule[] | null = null;
  let iterations = 0;
  const startTime = Date.now();

  function isTimeout(): boolean {
    return Date.now() - startTime > timeoutMs || iterations >= maxIterations;
  }

  function getAvailableSupervisors(weekNum: number): SupervisorStats[] {
    return state.supervisorStats.filter(ss => {
      if (ss.supervisor.unavailableWeeks.includes(weekNum)) return false;
      if (wasSupervisorLastWeek(state.schedule, weekNum, ss.supervisor.id)) return false;
      return true;
    }).sort((a, b) => a.count - b.count);
  }

  function getRemainingAvailability(worker: Worker, currentWeek: number): number {
    let count = 0;
    for (let w = currentWeek; w <= durationWeeks; w++) {
      if (!worker.unavailableWeeks.includes(w)) count++;
    }
    return count;
  }

  function getAvailableFirstOnCall(weekNum: number, secondOnCallId: string | null): WorkerStats[] {
    return state.workerStats.filter(ws => {
      if (ws.worker.id === secondOnCallId) return false;
      if (ws.worker.unavailableWeeks.includes(weekNum)) return false;

      const preAssignedSecond = ws.worker.preAssignments.some(
        pa => pa.weekNumber === weekNum && pa.role === 'second'
      );
      if (preAssignedSecond) return false;

      if (hadAnyRoleLastWeek(state.schedule, weekNum, ws.worker.id)) return false;
      if (hasAnyRoleForPastTwoWeeks(state.schedule, weekNum, ws.worker.id)) return false;

      return true;
    }).sort((a, b) => {
      // Prioritize workers with fewer remaining available weeks (upcoming time-off)
      const remainingA = getRemainingAvailability(a.worker, weekNum);
      const remainingB = getRemainingAvailability(b.worker, weekNum);
      const remainingDiff = remainingA - remainingB;
      if (remainingDiff !== 0) return remainingDiff;

      const firstDiff = a.firstOnCallCount - b.firstOnCallCount;
      if (firstDiff !== 0) return firstDiff;

      const totalA = a.firstOnCallCount + a.secondOnCallCount;
      const totalB = b.firstOnCallCount + b.secondOnCallCount;
      return totalA - totalB;
    });
  }

  function getAvailableSecondOnCall(weekNum: number, firstOnCallId: string): WorkerStats[] {
    return state.workerStats.filter(ws => {
      if (ws.worker.id === firstOnCallId) return false;
      if (ws.worker.unavailableWeeks.includes(weekNum)) return false;

      const preAssignedFirst = ws.worker.preAssignments.some(
        pa => pa.weekNumber === weekNum && pa.role === 'first'
      );
      if (preAssignedFirst) return false;

      if (hadAnyRoleLastWeek(state.schedule, weekNum, ws.worker.id)) return false;
      if (hasAnyRoleForPastTwoWeeks(state.schedule, weekNum, ws.worker.id)) return false;

      return true;
    }).sort((a, b) => {
      // Prioritize workers with fewer remaining available weeks (upcoming time-off)
      const remainingA = getRemainingAvailability(a.worker, weekNum);
      const remainingB = getRemainingAvailability(b.worker, weekNum);
      const remainingDiff = remainingA - remainingB;
      if (remainingDiff !== 0) return remainingDiff;

      const totalA = a.firstOnCallCount + a.secondOnCallCount;
      const totalB = b.firstOnCallCount + b.secondOnCallCount;
      return totalA - totalB;
    });
  }

  function backtrack(weekNum: number): void {
    if (isTimeout()) return;

    if (weekNum > durationWeeks) {
      iterations++;
      const score = calculateBalanceScore(state);
      if (score < bestScore) {
        bestScore = score;
        bestSolution = cloneSchedule(state.schedule);
      }
      return;
    }

    const weekSchedule = state.schedule[weekNum - 1];

    if (weekSchedule.isPreAssigned.firstOnCall &&
        weekSchedule.isPreAssigned.secondOnCall &&
        weekSchedule.isPreAssigned.supervisor) {
      backtrack(weekNum + 1);
      return;
    }

    iterations++;

    const supervisorCandidates = weekSchedule.isPreAssigned.supervisor
      ? [state.supervisorStats.find(ss => ss.supervisor.id === weekSchedule.supervisor.id)!]
      : getAvailableSupervisors(weekNum);

    if (!weekSchedule.isPreAssigned.supervisor && supervisorCandidates.length === 0) {
      return;
    }

    for (const supStat of supervisorCandidates) {
      const supervisorWasAssigned = !weekSchedule.isPreAssigned.supervisor;
      if (supervisorWasAssigned) {
        weekSchedule.supervisor = supStat.supervisor;
        supStat.count++;
      }

      const firstCandidates = weekSchedule.isPreAssigned.firstOnCall
        ? [state.workerStats.find(ws => ws.worker.id === weekSchedule.firstOnCall.id)!]
        : getAvailableFirstOnCall(weekNum, weekSchedule.isPreAssigned.secondOnCall ? weekSchedule.secondOnCall.id : null);

      if (!weekSchedule.isPreAssigned.firstOnCall && firstCandidates.length === 0) {
        if (supervisorWasAssigned) {
          weekSchedule.supervisor = null as any;
          supStat.count--;
        }
        continue;
      }

      for (const firstStat of firstCandidates) {
        const firstWasAssigned = !weekSchedule.isPreAssigned.firstOnCall;
        if (firstWasAssigned) {
          weekSchedule.firstOnCall = firstStat.worker;
          firstStat.firstOnCallCount++;
        }

        const secondCandidates = weekSchedule.isPreAssigned.secondOnCall
          ? [state.workerStats.find(ws => ws.worker.id === weekSchedule.secondOnCall.id)!]
          : getAvailableSecondOnCall(weekNum, weekSchedule.firstOnCall.id);

        if (!weekSchedule.isPreAssigned.secondOnCall && secondCandidates.length === 0) {
          if (firstWasAssigned) {
            weekSchedule.firstOnCall = null as any;
            firstStat.firstOnCallCount--;
          }
          continue;
        }

        for (const secondStat of secondCandidates) {
          const secondWasAssigned = !weekSchedule.isPreAssigned.secondOnCall;
          if (secondWasAssigned) {
            weekSchedule.secondOnCall = secondStat.worker;
            secondStat.secondOnCallCount++;
          }

          backtrack(weekNum + 1);

          if (secondWasAssigned) {
            weekSchedule.secondOnCall = null as any;
            secondStat.secondOnCallCount--;
          }
        }

        if (firstWasAssigned) {
          weekSchedule.firstOnCall = null as any;
          firstStat.firstOnCallCount--;
        }
      }

      if (supervisorWasAssigned) {
        weekSchedule.supervisor = null as any;
        supStat.count--;
      }
    }
  }

  backtrack(1);
  return bestSolution;
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

  const state = initializeScheduleWithPreAssignments(config, workers, supervisors);
  const solution = solveWithBacktracking(state, config.durationWeeks);

  if (!solution) {
    throw new Error('No valid schedule found. Constraints may be too restrictive.');
  }

  recalculateStats(state, solution);

  const stats: AssignmentStats[] = [
    ...state.workerStats.map(ws => ({
      personId: ws.worker.id,
      personName: ws.worker.name,
      role: 'worker' as const,
      firstOnCallCount: ws.firstOnCallCount,
      secondOnCallCount: ws.secondOnCallCount,
      supervisorCount: 0,
      total: ws.firstOnCallCount + ws.secondOnCallCount,
    })),
    ...state.supervisorStats.map(ss => ({
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
    schedule: solution,
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
