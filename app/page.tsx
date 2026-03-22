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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const [weeks, setWeeks] = useState<number>(12);
  const [startDate, setStartDate] = useState<string>("2024-07-01");
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);

  const { schedule, summaries, supervisorSummaries } = useMemo(
    () => generateSchedule(workers, supervisors, weeks, timeOff),
    [workers, supervisors, weeks, timeOff, startDate]
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
    const start = new Date(startDate);
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


        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 flex flex-col lg:flex-row items-start gap-8 overflow-auto">
          {/* Left Cards */}
          <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>{workers.length} members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Current On-Call</h3>
                  <div className="space-y-4">
                    {[
                      { person: getWorker(schedule[0]?.primary), role: "Primary On-Call", color: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
                      { person: getWorker(schedule[0]?.secondary), role: "Backup On-Call", color: "bg-amber-100 text-amber-800 hover:bg-amber-100" }
                    ].map((entry, i) => entry.person && (
                      <div key={entry.person.id + '-' + i} className="flex items-center gap-3">
                        <Avatar name={entry.person.name} />
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold">{entry.person.name}</span>
                          <Badge variant="secondary" className={`mt-1 text-[10px] py-0 px-2 leading-tight ${entry.color}`}>
                            {entry.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-3 tracking-wider uppercase">All Members</h3>
                  <div className="space-y-3">
                    {workers.map((w) => (
                      <div key={w.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Avatar name={w.name} />
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-sm font-medium leading-none">{w.name}</span>
                            <div className="flex gap-1">
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[9px] font-bold py-0 px-1 rounded-sm">1st: {summaries[w.id]?.first || 0}</Badge>
                              <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 text-[9px] font-bold py-0 px-1 rounded-sm">2nd: {summaries[w.id]?.second || 0}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive shrink-0"
                          onClick={() => setWorkers(workers.filter(worker => worker.id !== w.id))}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Input 
                      placeholder="Add new member... (Press Enter)" 
                      className="h-8 text-xs bg-muted/30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setWorkers([...workers, { id: Date.now().toString(), name: e.currentTarget.value.trim() }]);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
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
                  <h3 className="text-xs font-bold text-muted-foreground mb-3 tracking-wider">Current Supervisor</h3>
                  <div className="flex items-center gap-3">
                    <Avatar name={getSupervisor(schedule[0]?.supervisor)?.name || "Unassigned"} />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">{getSupervisor(schedule[0]?.supervisor)?.name || "None"}</span>
                      <Badge variant="secondary" className="mt-1 text-[10px] py-0 px-2 leading-tight bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                        On-Call/Indigo
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-3 tracking-wider">Up Next (Week 2)</h3>
                  <div className="flex items-center gap-3 mb-6">
                    <Avatar name={getSupervisor(schedule[1]?.supervisor)?.name || "Unassigned"} />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">{getSupervisor(schedule[1]?.supervisor)?.name || "None"}</span>
                      <Badge variant="secondary" className="mt-1 text-[10px] py-0 px-2 leading-tight bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        Active/Green
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-3 tracking-wider uppercase">All Supervisors</h3>
                  <div className="space-y-3">
                    {supervisors.map((s) => (
                      <div key={s.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} />
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-sm font-medium leading-none">{s.name}</span>
                            <div className="flex gap-1">
                              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[9px] font-bold py-0 px-1 rounded-sm">Assigned: {supervisorSummaries?.[s.id] || 0}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => setSupervisors(supervisors.filter(sup => sup.id !== s.id))}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Input 
                      placeholder="Add new supervisor... (Press Enter)" 
                      className="h-8 text-xs bg-muted/30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setSupervisors([...supervisors, { id: 's' + Date.now().toString(), name: e.currentTarget.value.trim() }]);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
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
              <h1 className="text-2xl font-bold">Generated Schedule</h1>
              <div className="flex gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">New Schedule</Button>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters & Config</span>
              <div className="flex gap-3 items-center">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[140px] shadow-sm h-8 text-sm"
                />
                <Button variant="outline" size="sm" className="h-8 shadow-sm">
                  Team <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
                <div className="flex flex-row items-center border border-input bg-background shadow-sm rounded-md h-8 focus-within:ring-1 focus-within:ring-ring">
                  <Input 
                    type="number" 
                    value={weeks || ""}
                    min={1}
                    onChange={(e) => setWeeks(parseInt(e.target.value) || 0)}
                    onBlur={() => setWeeks(Math.max(1, weeks))}
                    className="w-14 h-full border-0 focus-visible:ring-0 shadow-none text-center px-1 text-sm bg-transparent !appearance-none"
                  />
                  <span className="text-sm font-medium pr-2 text-muted-foreground select-none">wks</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="px-2 border-l border-input hover:bg-accent hover:text-accent-foreground h-full rounded-r-md transition-colors flex items-center justify-center outline-none cursor-pointer">
                      <ChevronDown className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setWeeks(4)}>4 Weeks (~1 Month)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setWeeks(12)}>12 Weeks (~3 Months)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setWeeks(24)}>24 Weeks (~6 Months)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setWeeks(52)}>52 Weeks (~1 Year)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <Card className="overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[50px] font-bold">#</TableHead>
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
                  {schedule.map((week, idx) => {
                    const pWorker = getWorker(week.primary);
                    const sWorker = getWorker(week.secondary);
                    const supervisor = getSupervisor(week.supervisor);

                    const bg = idx % 2 === 0 ? "bg-slate-50/50 hover:bg-slate-50" : "hover:bg-slate-50/50";

                    return (
                      <TableRow key={idx} className={bg}>
                        <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
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
