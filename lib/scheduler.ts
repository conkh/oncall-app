export interface Worker {
  id: string;
  name: string;
}

export interface TimeOffRequest {
  workerId: string;
  weekIndex: number;
}

export interface WeeklySchedule {
  weekIndex: number;
  primary: string | null;
  secondary: string | null;
  supervisor: string | null;
}

export interface ScheduleResult {
  schedule: WeeklySchedule[];
  summaries: Record<string, { first: number; second: number }>;
  supervisorSummaries: Record<string, number>;
}

export function generateSchedule(
  workers: Worker[],
  supervisors: Worker[],
  numOfWeeks: number,
  timeOff: TimeOffRequest[]
): ScheduleResult {
  const weeks = numOfWeeks;
  const schedule: WeeklySchedule[] = [];

  const primaryCount: Record<string, number> = {};
  const totalCount: Record<string, number> = {};
  const supervisorCount: Record<string, number> = {};

  for (const w of workers) {
    primaryCount[w.id] = 0;
    totalCount[w.id] = 0;
  }
  for (const s of supervisors) {
    supervisorCount[s.id] = 0;
  }

  for (let w = 0; w < weeks; w++) {
    const offThisWeek = new Set(
      timeOff.filter((t) => t.weekIndex === w).map((t) => t.workerId)
    );

    const primaryLastWeek = w > 0 ? schedule[w - 1].primary : null;

    const onCallLastWeek =
      w > 0
        ? [schedule[w - 1].primary, schedule[w - 1].secondary].filter(Boolean)
        : [];
    const onCallTwoWeeksAgo =
      w > 1
        ? [schedule[w - 2].primary, schedule[w - 2].secondary].filter(Boolean)
        : [];

    const onCallConsecutive2 = onCallLastWeek.filter((id) =>
      onCallTwoWeeksAgo.includes(id)
    );

    const primaryCandidates = workers.filter(
      (worker) =>
        !offThisWeek.has(worker.id) &&
        worker.id !== primaryLastWeek &&
        !onCallConsecutive2.includes(worker.id)
    );

    primaryCandidates.sort((a, b) => {
      if (primaryCount[a.id] !== primaryCount[b.id]) {
        return primaryCount[a.id] - primaryCount[b.id];
      }
      return totalCount[a.id] - totalCount[b.id];
    });

    const primary =
      primaryCandidates.length > 0 ? primaryCandidates[0].id : null;
    if (primary) {
      primaryCount[primary]++;
      totalCount[primary]++;
    }

    const secondaryCandidates = workers.filter(
      (worker) =>
        !offThisWeek.has(worker.id) &&
        worker.id !== primary &&
        !onCallConsecutive2.includes(worker.id)
    );

    secondaryCandidates.sort((a, b) => {
      if (primaryCount[a.id] !== primaryCount[b.id]) {
        // Prefer picking someone who has MORE primary assignments for secondary,
        // so that those with FEWER primary assignments are kept available for future primary slots.
        return primaryCount[b.id] - primaryCount[a.id];
      }
      return totalCount[a.id] - totalCount[b.id];
    });

    const secondary =
      secondaryCandidates.length > 0 ? secondaryCandidates[0].id : null;
    if (secondary) {
      totalCount[secondary]++;
    }

    const supervisorLastWeek = w > 0 ? schedule[w - 1].supervisor : null;
    const supervisorCandidates = supervisors.filter(
      (supervisor) =>
        !offThisWeek.has(supervisor.id) && supervisor.id !== supervisorLastWeek
    );
    supervisorCandidates.sort(
      (a, b) => supervisorCount[a.id] - supervisorCount[b.id]
    );

    const supervisor =
      supervisorCandidates.length > 0 ? supervisorCandidates[0].id : null;
    if (supervisor) {
      supervisorCount[supervisor]++;
    }

    schedule.push({
      weekIndex: w,
      primary,
      secondary,
      supervisor,
    });
  }

  const summaries: Record<string, { first: number; second: number }> = {};
  for (const w of workers) {
    summaries[w.id] = {
      first: primaryCount[w.id] || 0,
      second: (totalCount[w.id] || 0) - (primaryCount[w.id] || 0),
    };
  }

  const supervisorSummaries: Record<string, number> = {};
  for (const s of supervisors) {
    supervisorSummaries[s.id] = supervisorCount[s.id] || 0;
  }

  return { schedule, summaries, supervisorSummaries };
}

export function getMonthName(weekIndex: number) {
  const monthIndex = Math.floor(weekIndex / 4);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[monthIndex % 12];
}
