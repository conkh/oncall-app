'use client';

import { WeekSchedule } from '@/app/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileJson, FileSpreadsheet, CalendarDays } from 'lucide-react';
import { formatDate } from '@/app/lib/utils';
import { exportToCSV, exportToJSON, downloadFile } from '@/app/lib/scheduler';

interface ScheduleViewProps {
  schedule: WeekSchedule[];
}

export function ScheduleView({ schedule }: ScheduleViewProps) {
  const handleExportCSV = () => {
    const csv = exportToCSV(schedule);
    downloadFile(csv, 'oncall-schedule.csv', 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportToJSON(schedule);
    downloadFile(json, 'oncall-schedule.json', 'application/json');
  };

  const getWeekDateRange = (startDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${formatDate(startDate)} - ${formatDate(end.toISOString().split('T')[0])}`;
  };

  if (schedule.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Generated Schedule
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <FileJson className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Week</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>
                  <Badge variant="default" className="font-semibold">
                    1st On-Call
                  </Badge>
                </TableHead>
                <TableHead>
                  <Badge variant="secondary" className="font-semibold">
                    2nd On-Call
                  </Badge>
                </TableHead>
                <TableHead>
                  <Badge variant="outline" className="font-semibold">
                    Supervisor
                  </Badge>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((week) => {
                const isPreAssigned = week.isPreAssigned || { firstOnCall: false, secondOnCall: false };
                return (
                  <TableRow key={week.weekNumber}>
                    <TableCell className="font-medium">{week.weekNumber}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {getWeekDateRange(week.startDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {week.firstOnCall.name}
                        {isPreAssigned.firstOnCall && (
                          <Badge variant="outline" className="text-xs">Pre</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-secondary" />
                        {week.secondOnCall.name}
                        {isPreAssigned.secondOnCall && (
                          <Badge variant="outline" className="text-xs">Pre</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        {(week.supervisor || (week as any).professional)?.name || 'N/A'}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
