"use client";

import { useState, useMemo } from "react";
import { generateSchedule, Worker, TimeOffRequest } from "@/lib/scheduler";
import {
  Users, Shield, Settings, Search, Bell, LayoutGrid,
  ArrowUpDown, Download, ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

const Avatar = ({ name }: { name: string }) => {
  const initials = getInitials(name);
  const colors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-purple-100 text-purple-700", "bg-indigo-100 text-indigo-700"];
  const col = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs shrink-0 ${col}`}>
      {initials}
    </div>
  );
};

export default function Home() {
  const [workers, setWorkers] = useState<Worker[]>([
    { id: "1", name: "Sarah Chen" },
    { id: "2", name: "Mark Thompson" },
    { id: "3", name: "Aisha Khan" },
    { id: "4", name: "John Doe" },
    { id: "5", name: "Chloe Bennet" },
  ]);
  const [supervisors, setSupervisors] = useState<Worker[]>([
    { id: "s1", name: "David Lee" },
    { id: "s2", name: "Maria Garcia" },
    { id: "s3", name: "Alex Carter" },
  ]);

  const [months, setMonths] = useState<number>(3);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);

  const schedule = useMemo(
    () => generateSchedule(workers, supervisors, months, timeOff),
    [workers, supervisors, months, timeOff]
  );

  const toggleTimeOff = (workerId: string, weekIndex: number) => {
    const exists = timeOff.find(
      (t) => t.workerId === workerId && t.weekIndex === weekIndex
    );
    if (exists) {
      setTimeOff(timeOff.filter((t) => !(t.workerId === workerId && t.weekIndex === weekIndex)));
    } else {
      setTimeOff([...timeOff, { workerId, weekIndex }]);
    }
  };

  const getWorker = (id: string | null) => workers.find((w) => w.id === id);
  const getSupervisor = (id: string | null) => supervisors.find((s) => s.id === id);

  const getWeekDateRange = (weekIndex: number) => {
    const start = new Date(2024, 6, 1);
    start.setDate(start.getDate() + weekIndex * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 bg-background border-b flex items-center justify-between px-6 shrink-0 z-10 hidden sm:flex">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 bg-white rounded-full translate-x-0.5" />
          </div>
          CallFlow
        </div>
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search"
              className="w-full bg-muted/50 border-muted-foreground/20 pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-5 text-muted-foreground">
          <Button variant="ghost" size="icon"><LayoutGrid className="w-5 h-5" /></Button>
          <div className="relative cursor-pointer">
            <Button variant="ghost" size="icon"><Bell className="w-5 h-5" /></Button>
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-destructive rounded-full" />
          </div>
          <Avatar name="Admin User" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Nav Rail */}
        <div className="w-20 bg-background border-r hidden md:flex flex-col items-center py-6 gap-6 text-muted-foreground shrink-0">
          <Button variant="ghost" className="flex flex-col items-center h-auto py-2 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium">Team</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center h-auto py-2 gap-1 hover:text-foreground">
            <Shield className="w-6 h-6" />
            <span className="text-[10px] font-medium">Supervisors</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center h-auto py-2 gap-1 hover:text-foreground">
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-medium">Settings</span>
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 flex flex-col lg:flex-row items-start gap-8 overflow-auto">
          {/* Left Cards */}
          <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>{workers.length} members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">Manage Members</Button>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Active/On-Call</h3>
                  <div className="space-y-4">
                    {workers.slice(0, 3).map((w, i) => (
                      <div key={w.id} className="flex items-center gap-3">
                        <Avatar name={w.name} />
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold">{w.name}</span>
                          <Badge variant="secondary" className={`mt-1 text-[10px] py-0 px-2 leading-tight ${i === 1 ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'}`}>
                            {i === 1 ? 'Away/Amber - Member' : 'Active/Green - Team'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Supervisors</CardTitle>
                <CardDescription>{supervisors.length} supervisors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-3 tracking-wider">Current Supervisors</h3>
                  <div className="flex items-center gap-3">
                    <Avatar name={supervisors[0]?.name || "Unassigned"} />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">{supervisors[0]?.name || "None"}</span>
                      <Badge variant="secondary" className="mt-1 text-[10px] py-0 px-2 leading-tight bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                        On-Call/Indigo
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-3 tracking-wider">Backup Supervisors</h3>
                  <div className="flex items-center gap-3 mb-6">
                    <Avatar name={supervisors[1]?.name || "Unassigned"} />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">{supervisors[1]?.name || "None"}</span>
                      <Badge variant="secondary" className="mt-1 text-[10px] py-0 px-2 leading-tight bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        Active/Green
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full">Manage Supervisors</Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-3 cursor-pointer hover:text-foreground transition"><Settings className="w-4 h-4" /> Configurations</div>
                  <div className="flex items-center gap-3 cursor-pointer hover:text-foreground transition"><Bell className="w-4 h-4" /> Notifications</div>
                  <div className="flex items-center gap-3 cursor-pointer hover:text-foreground transition"><LayoutGrid className="w-4 h-4" /> Integrations</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Table Area */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl font-bold">Generated Schedule - July 2024</h1>
              <div className="flex gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">New Schedule</Button>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</span>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="h-8 shadow-sm">
                  Team <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 shadow-sm">
                  Period <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[180px] font-bold">
                      <div className="flex items-center gap-2">Date Range <ArrowUpDown className="w-3 h-3" /></div>
                    </TableHead>
                    <TableHead className="font-bold">First On-Call</TableHead>
                    <TableHead className="font-bold">Second On-Call</TableHead>
                    <TableHead className="font-bold">Supervisor</TableHead>
                    <TableHead className="text-right font-bold">
                      <div className="flex items-center justify-end gap-2">Time Off Manager <ArrowUpDown className="w-3 h-3" /></div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.slice(0, 4).map((week, idx) => {
                    const pWorker = getWorker(week.primary);
                    const sWorker = getWorker(week.secondary);
                    const supervisor = getSupervisor(week.supervisor);

                    let bg = "";
                    if (idx === 0) bg = "bg-indigo-50/40 hover:bg-indigo-50/60";
                    if (idx === 1) bg = "bg-slate-50/50 hover:bg-slate-50";
                    if (idx === 2) bg = "bg-amber-50/40 hover:bg-amber-50/60";
                    if (idx === 3) bg = "bg-slate-50/50 hover:bg-slate-50";

                    return (
                      <TableRow key={idx} className={bg}>
                        <TableCell className="font-medium">
                          {getWeekDateRange(idx)}
                        </TableCell>
                        <TableCell>
                          {pWorker && (
                            <div className="flex items-center gap-3">
                              <Avatar name={pWorker.name} />
                              <div className="flex flex-col items-start gap-1">
                                <span className="text-sm font-semibold leading-none">{pWorker.name}</span>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-[10px] py-0 leading-tight">On-Call/Blue</Badge>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {sWorker && (
                            <div className="flex items-center gap-3">
                              <Avatar name={sWorker.name} />
                              <div className="flex flex-col items-start gap-1">
                                <span className="text-sm font-semibold leading-none">{sWorker.name}</span>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-[10px] py-0 leading-tight">Backup/Amber</Badge>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {supervisor && (
                            <div className="flex items-center gap-3">
                              <Avatar name={supervisor.name} />
                              <div className="flex flex-col items-start gap-1">
                                <span className="text-sm font-semibold leading-none">{supervisor.name}</span>
                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 text-[10px] py-0 leading-tight">On-Call/Indigo</Badge>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap gap-2 justify-end items-center py-2">
                            {workers.concat(supervisors).map(person => {
                              const isOff = timeOff.some(t => t.workerId === person.id && t.weekIndex === week.weekIndex);
                              return (
                                <button
                                  key={person.id}
                                  onClick={() => toggleTimeOff(person.id, week.weekIndex)}
                                  title={`Toggle Time Off for ${person.name}`}
                                  className={`rounded-full border-2 transition-transform hover:scale-110 flex shrink-0 ${isOff
                                      ? "border-red-400 opacity-100 saturate-100"
                                      : "border-transparent opacity-40 hover:opacity-100 grayscale hover:grayscale-0"
                                    }`}
                                >
                                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700 overflow-hidden shrink-0">
                                    {getInitials(person.name)}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
