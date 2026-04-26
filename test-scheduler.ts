import { generateSchedule } from './app/lib/scheduler';
import { Worker, Supervisor } from './app/types';

const workers: Worker[] = Array.from({ length: 7 }, (_, i) => ({
  id: 'w' + (i + 1),
  name: 'Worker ' + (i + 1),
  role: 'worker' as const,
  unavailableWeeks: i === 0 ? [5, 6, 7, 8, 9, 10, 11, 12, 13, 14] : [],
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
  {
    id: 's2',
    name: 'Supervisor 2',
    role: 'supervisor' as const,
    unavailableWeeks: [],
    preAssignments: [],
  },
];

const result = generateSchedule(
  { startDate: '2026-01-05', durationWeeks: 14 },
  workers,
  supervisors
);

console.log('Schedule:');
console.log('Week | Date       | 1st On-Call    | 2nd On-Call    | Supervisor');
console.log('-----+------------+----------------+----------------+-----------');
result.schedule.forEach(w => {
  const pre = w.isPreAssigned.firstOnCall || w.isPreAssigned.secondOnCall ? ' [Pre]' : '';
  console.log(
    String(w.weekNumber).padStart(2) +
    '   | ' + w.startDate +
    ' | ' + w.firstOnCall.name.padEnd(14) +
    ' | ' + w.secondOnCall.name.padEnd(14) +
    ' | ' + w.supervisor.name + pre
  );
});

console.log('\nStats:');
console.log('Name            | Total | 1st | 2nd | Sup');
console.log('----------------+-------+-----+-----+----');
result.stats.forEach(s => {
  console.log(
    s.personName.padEnd(15) +
    ' | ' + String(s.total).padStart(3) +
    '   | ' + String(s.firstOnCallCount).padStart(2) +
    '   | ' + String(s.secondOnCallCount).padStart(2) +
    '   | ' + String(s.supervisorCount).padStart(2)
  );
});
