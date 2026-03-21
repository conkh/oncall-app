"use client";

import { useState, useMemo } from "react";
import { generateSchedule, Worker, TimeOffRequest } from "@/lib/scheduler";
import { Plus, Trash2, CalendarOff, Users, Calendar, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    return d.toISOString().split("T")[0];
  });
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [newWorkerName, setNewWorkerName] = useState("");

  const getWeekDateRange = (weekIndex: number, startDateStr: string) => {
    const [year, month, day] = startDateStr.split("-").map(Number);
    const start = new Date(year, month - 1, day);
    start.setDate(start.getDate() + weekIndex * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const schedule = useMemo(
    () => generateSchedule(workers, months, timeOff),
    [workers, months, timeOff]
  );

  const workerStats = useMemo(() => {
    const stats: Record<string, { primary: number; secondary: number; total: number }> = {};
    workers.forEach((w) => {
      stats[w.id] = { primary: 0, secondary: 0, total: 0 };
    });
    schedule.forEach((week) => {
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
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 p-8 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              On-Call Scheduler
            </h1>
            <p className="mt-2 text-muted-foreground font-medium">
              Fair and constraint-based assignments.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Controls Panel */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" /> Team Members
                </CardTitle>
                <CardDescription>Manage the engineering pool.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-4">
                  {workers.map((worker) => {
                    const stats =
                      workerStats[worker.id] || { primary: 0, secondary: 0, total: 0 };
                    return (
                      <li
                        key={worker.id}
                        className="flex flex-col bg-muted/40 px-4 py-3 rounded-lg border gap-3 transition-colors hover:bg-muted/60"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {worker.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeWorker(worker.id)}
                            className="text-muted-foreground hover:text-destructive h-7 w-7"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 text-[11px] font-bold tracking-wide">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            1st: {stats.primary}
                          </Badge>
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                            2nd: {stats.secondary}
                          </Badge>
                          <Badge variant="outline" className="ml-auto bg-background">
                            Total: {stats.total}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <form onSubmit={addWorker} className="flex gap-2">
                  <Input
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    placeholder="New worker name"
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure the schedule length.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Schedule Duration</Label>
                    <span className="text-sm font-medium text-muted-foreground">
                      {months} {months === 1 ? "Month" : "Months"} ({months * 4} weeks)
                    </span>
                  </div>
                  <Slider
                    value={[months]}
                    min={1}
                    max={12}
                    step={1}
                    onValueChange={(vals) => setMonths(Array.isArray(vals) ? vals[0] : (vals as number))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-800 flex items-center gap-2 text-base">
                  <AlertCircle className="w-5 h-5" /> Rules Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-amber-900 space-y-1 mt-1 list-disc list-inside">
                  <li>No consecutive primary shifts</li>
                  <li>Max 2 consecutive shifts total</li>
                  <li>Fair shift distribution</li>
                  <li>Respects time-off requests</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Schedule View Panel */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CalendarOff className="w-5 h-5 text-emerald-500" />
                  Generated Schedule
                </CardTitle>
                <CardDescription>
                  Automatically balanced across {months * 4} weeks based on fair distribution parameters.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="uppercase text-xs tracking-wider">
                      <TableHead className="w-[180px]">Date Range</TableHead>
                      <TableHead>First On-Call</TableHead>
                      <TableHead>Second On-Call</TableHead>
                      <TableHead className="text-right">Time Off Manager</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((week) => {
                      const weekTimeOff = timeOff.filter(
                        (t) => t.weekIndex === week.weekIndex
                      );

                      return (
                        <TableRow key={week.weekIndex} className="group">
                          <TableCell>
                            <div className="font-bold whitespace-nowrap">
                              {getWeekDateRange(week.weekIndex, startDate)}
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase mt-1 font-semibold tracking-widest">
                              Week {week.weekIndex + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={week.primary ? "default" : "destructive"}
                              className={week.primary ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : ""}
                            >
                              {getWorkerName(week.primary)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={week.secondary ? "secondary" : "destructive"}
                              className={week.secondary ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200" : ""}
                            >
                              {getWorkerName(week.secondary)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap gap-1.5 justify-end">
                              {workers.map((worker) => {
                                const isOff = weekTimeOff.some(
                                  (t) => t.workerId === worker.id
                                );
                                return (
                                  <Button
                                    key={worker.id}
                                    variant={isOff ? "destructive" : "outline"}
                                    size="sm"
                                    onClick={() => toggleTimeOff(worker.id, week.weekIndex)}
                                    className={`h-7 px-2 text-[11px] ${
                                      !isOff ? "text-muted-foreground hover:bg-muted" : "shadow-sm"
                                    }`}
                                  >
                                    {isOff ? "Off" : worker.name}
                                  </Button>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
