'use client';

import { useState } from 'react';
import { Worker, Supervisor } from '@/app/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Users, Shield } from 'lucide-react';

interface PersonManagerProps {
  workers: Worker[];
  supervisors: Supervisor[];
  onAddWorker: (name: string) => void;
  onAddSupervisor: (name: string) => void;
  onRemoveWorker: (id: string) => void;
  onRemoveSupervisor: (id: string) => void;
}

export function PersonManager({
  workers,
  supervisors,
  onAddWorker,
  onAddSupervisor,
  onRemoveWorker,
  onRemoveSupervisor,
}: PersonManagerProps) {
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newSupervisorName, setNewSupervisorName] = useState('');

  const handleAddWorker = () => {
    if (newWorkerName.trim()) {
      onAddWorker(newWorkerName.trim());
      setNewWorkerName('');
    }
  };

  const handleAddSupervisor = () => {
    if (newSupervisorName.trim()) {
      onAddSupervisor(newSupervisorName.trim());
      setNewSupervisorName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'worker' | 'supervisor') => {
    if (e.key === 'Enter') {
      if (type === 'worker') {
        handleAddWorker();
      } else {
        handleAddSupervisor();
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage People</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="workers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="workers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Workers ({workers.length})
            </TabsTrigger>
            <TabsTrigger value="supervisors" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Supervisors ({supervisors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workers" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter worker name..."
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'worker')}
              />
              <Button onClick={handleAddWorker}>Add</Button>
            </div>
            <div className="space-y-2">
              {workers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No workers added yet. Add at least 2 workers.
                </p>
              ) : (
                workers.map((worker) => (
                  <div
                    key={worker.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="font-medium">{worker.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveWorker(worker.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="supervisors" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter supervisor name..."
                value={newSupervisorName}
                onChange={(e) => setNewSupervisorName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'supervisor')}
              />
              <Button onClick={handleAddSupervisor}>Add</Button>
            </div>
            <div className="space-y-2">
              {supervisors.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No supervisors added yet. Add at least 1 supervisor.
                </p>
              ) : (
                supervisors.map((supervisor) => (
                  <div
                    key={supervisor.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="font-medium">{supervisor.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveSupervisor(supervisor.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
