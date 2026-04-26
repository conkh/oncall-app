import { generateSchedule } from './app/lib/scheduler';
import { Worker, Supervisor, ScheduleConfig } from './app/types';

const workers: Worker[] = Array.from({ length: 7 }, (_, i) => ({
  id: `w${i + 1}`,
  name: `Worker ${i + 1}`,
  role: 'worker' as const,
  unavailableWeeks: [],
  preAssignments: [],
}));

const supervisors: Supervisor[] = [
  {
    id: 's1',
    name: 'Supervisor 1',
    role: 'supervisor' as const,
    unavailableWeeks: [],
    preAssignments: [],
  },
];

const config: ScheduleConfig = {
  startDate: '2026-01-05',
  durationWeeks: 14,
};

const result = generateSchedule(config, workers, supervisors);

console.log('Week | First On-Call    | Second On-Call   | Supervisor');
console.log('-----|------------------|------------------|------------');
for (const week of result.schedule) {
  console.log(
    `${week.weekNumber.toString().padStart(4)} | ${week.firstOnCall.name.padEnd(16)} | ${week.secondOnCall.name.padEnd(16)} | ${week.supervisor.name}`
  );
}

console.log('\n--- Assignment Stats ---');
for (const stat of result.stats.filter(s => s.role === 'worker')) {
  console.log(
    `${stat.personName.padEnd(10)} | First: ${stat.firstOnCallCount} | Second: ${stat.secondOnCallCount} | Total: ${stat.total}`
  );
}
