"use client";

import { useState, useMemo } from "react";
import { generateSchedule, Worker, TimeOffRequest, getMonthName } from "@/lib/scheduler";
import { Plus, Trash2, CalendarOff, Users, Calendar, AlertCircle } from "lucide-react";

export default function Home() {
  const [workers, setWorkers] = useState<Worker[]>([
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
    { id: "3", name: "Charlie" },
    { id: "4", name: "Diana" },
    { id: "5", name: "Edward" },
  ]);

  const [months, setMonths] = useState<number>(3);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    // Default to today as proper Start Date
    return d.toISOString().split("T")[0];
  });
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [newWorkerName, setNewWorkerName] = useState("");

  const getWeekDateRange = (weekIndex: number, startDateStr: string) => {
    // Treat the input string as a local date (e.g. "2026-03-21")
    const [year, month, day] = startDateStr.split("-").map(Number);
    const start = new Date(year, month - 1, day);
    start.setDate(start.getDate() + weekIndex * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}`;
  };

  const schedule = useMemo(
    () => generateSchedule(workers, months, timeOff),
    [workers, months, timeOff]
  );

  const workerStats = useMemo(() => {
    const stats: Record<string, { primary: number; secondary: number; total: number }> = {};
    workers.forEach(w => {
      stats[w.id] = { primary: 0, secondary: 0, total: 0 };
    });
    schedule.forEach(week => {
      if (week.primary && stats[week.primary]) {
        stats[week.primary].primary++;
        stats[week.primary].total++;
      }
      if (week.secondary && stats[week.secondary]) {
        stats[week.secondary].secondary++;
        stats[week.secondary].total++;
      }
    });
    return stats;
  }, [schedule, workers]);

  const addWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;
    setWorkers([
      ...workers,
      { id: Date.now().toString(), name: newWorkerName.trim() },
    ]);
    setNewWorkerName("");
  };

  const removeWorker = (id: string) => {
    setWorkers(workers.filter((w) => w.id !== id));
    setTimeOff(timeOff.filter((t) => t.workerId !== id));
  };

  const toggleTimeOff = (workerId: string, weekIndex: number) => {
    const exists = timeOff.find(
      (t) => t.workerId === workerId && t.weekIndex === weekIndex
    );
    if (exists) {
      setTimeOff(
        timeOff.filter(
          (t) => !(t.workerId === workerId && t.weekIndex === weekIndex)
        )
      );
    } else {
      setTimeOff([...timeOff, { workerId, weekIndex }]);
    }
  };

  const getWorkerName = (id: string | null) => {
    if (!id) return "Unassigned";
    return workers.find((w) => w.id === id)?.name || "Unknown";
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-8 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-neutral-200">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              On-Call Scheduler
            </h1>
            <p className="mt-2 text-neutral-600 font-medium">
              Fair and constraint-based assignments
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-6 lg:col-span-1">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-indigo-500" /> Workers
              </h2>
              <ul className="space-y-3 mb-4">
                {workers.map((worker) => {
                  const stats = workerStats[worker.id] || { primary: 0, secondary: 0, total: 0 };
                  return (
                    <li
                      key={worker.id}
                      className="flex flex-col bg-neutral-50 px-4 py-3 rounded-lg border border-neutral-100 gap-3 transition-all hover:border-neutral-200 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-800">
                          {worker.name}
                        </span>
                        <button
                          onClick={() => removeWorker(worker.id)}
                          className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Remove worker"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2 text-[11px] font-bold tracking-wide">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200" title="First On-Call">
                          1st: {stats.primary}
                        </span>
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded border border-indigo-200" title="Second On-Call">
                          2nd: {stats.secondary}
                        </span>
                        <span className="bg-neutral-200 text-neutral-800 px-2 py-1 rounded border border-neutral-300 ml-auto" title="Total Shifts">
                          Total: {stats.total}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <form onSubmit={addWorker} className="flex gap-2">
                <input
                  type="text"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="New worker name"
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </form>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-bold mb-4">Settings</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Duration: {months} {months === 1 ? "Month" : "Months"} (
                    {months * 4} weeks)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </section>

            <section className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
              <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" /> Constraints Active
              </h3>
              <ul className="text-sm text-amber-700 space-y-2 list-disc list-inside">
                <li>No consecutive primary shifts</li>
                <li>Max 2 consecutive shifts total</li>
                <li>Fair shift distribution</li>
                <li>Respects time-off requests</li>
              </ul>
            </section>
          </div>

          {/* Schedule View */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 overflow-x-auto">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CalendarOff className="w-6 h-6 text-emerald-500" /> Generated
                Schedule
              </h2>

              <table className="w-full text-left bg-white rounded-lg border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-200 text-neutral-500 text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold">Date Range</th>
                    <th className="p-4 font-semibold">Primary</th>
                    <th className="p-4 font-semibold">Secondary</th>
                    <th className="p-4 font-semibold">Time Off Requests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {schedule.map((week) => {
                    const weekTimeOff = timeOff.filter(
                      (t) => t.weekIndex === week.weekIndex
                    );

                    return (
                      <tr
                        key={week.weekIndex}
                        className="hover:bg-neutral-50 transition-colors group"
                      >
                        <td className="p-4">
                          <div className="font-bold text-neutral-900 whitespace-nowrap">
                            {getWeekDateRange(week.weekIndex, startDate)}
                          </div>
                          <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1 font-semibold">
                            Week {week.weekIndex + 1}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={
                              week.primary
                                ? "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800"
                                : "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800"
                            }
                          >
                            {getWorkerName(week.primary)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={
                              week.secondary
                                ? "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800"
                                : "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800"
                            }
                          >
                            {getWorkerName(week.secondary)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {workers.map((worker) => {
                              const isOff = weekTimeOff.some(
                                (t) => t.workerId === worker.id
                              );
                              return (
                                <button
                                  key={worker.id}
                                  onClick={() =>
                                    toggleTimeOff(worker.id, week.weekIndex)
                                  }
                                  className={`px-2 py-1 text-xs font-semibold rounded-md border transition-all ${
                                    isOff
                                      ? "bg-red-500 text-white border-red-600 shadow-sm"
                                      : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-100"
                                  }`}
                                  title={`Toggle time off for ${worker.name}`}
                                >
                                  {isOff ? "Off" : worker.name}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
