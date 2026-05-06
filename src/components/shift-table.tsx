"use client";

import React, { useMemo } from "react";
import { format, getDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertCircle, Ban, Bed, Construction, Sun, Moon, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { Shift, Messenger, Client, MessengerStatus } from "@/lib/types";
import { cn, getShiftType } from "@/lib/utils";
import { NotesCell } from "./notes-cell";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface GroupedData {
  groupTitle: string;
  shifts: Shift[];
}

interface ShiftTableProps {
  groupedData: GroupedData[];
  messengers: Messenger[];
  clients: Client[];
  day: Date;
  onUpdateShift: (updatedShift: Partial<Shift> & { id: string }) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
}

const statusIcons: Record<MessengerStatus, React.ReactElement | null> = {
  active: null,
  incapacitated: <Ban className="h-4 w-4 text-red-500" />,
  on_leave: <Bed className="h-4 w-4 text-blue-500" />,
  stranded: <Construction className="h-4 w-4 text-yellow-500" />,
};

const statusLabels: Record<MessengerStatus, string> = {
  active: 'Activo',
  incapacitated: 'Incapacitado',
  on_leave: 'Descanso',
  stranded: 'Varado',
}


export function ShiftTable({
  groupedData,
  messengers,
  clients,
  day,
  onUpdateShift,
  onEditShift,
  onDeleteShift,
}: ShiftTableProps) {
  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name || "Cliente Desconocido";
  
  const getMessenger = (messengerId?: string) => 
    messengers.find((m) => m.id === messengerId);

  const messengerShiftCounts = useMemo(() => {
    const counts = new Map<string, number>();
    groupedData.forEach(({ shifts }) => {
      shifts.forEach(shift => {
        if (shift.messengerId) {
          counts.set(shift.messengerId, (counts.get(shift.messengerId) || 0) + 1);
        }
      });
    });
    return counts;
  }, [groupedData]);
  
  const checkAvailability = (messenger: Messenger, shift: Shift, shiftDate: Date): boolean => {
      const shiftDay = getDay(shiftDate);
      if (!messenger.availableWeekdays.includes(shiftDay)) return false;

      const shiftType = getShiftType(shift.startTime);
      if (messenger.shiftPreference !== 'any' && messenger.shiftPreference !== shiftType) return false;

      return true;
  }
  
  return (
    <TooltipProvider>
    <div className="border rounded-lg overflow-hidden">
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[150px] border-r">Hora</TableHead>
            <TableHead className="border-r">Cliente</TableHead>
            <TableHead className="w-[250px] border-r">Mensajero</TableHead>
            <TableHead className="w-[120px] border-r">Notas</TableHead>
            <TableHead className="w-[120px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedData.length > 0 && groupedData.some(g => g.shifts.length > 0) ? (
            groupedData.map(({ groupTitle, shifts: groupShifts }) => (
               <React.Fragment key={groupTitle}>
                {groupTitle && (
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={5} className="font-semibold text-muted-foreground">
                            {groupTitle} ({groupShifts.length} turnos)
                        </TableCell>
                    </TableRow>
                )}
                {groupShifts.map((shift) => {
                  const messenger = getMessenger(shift.messengerId);
                  const isUnassigned = !shift.messengerId;
                  const shiftType = getShiftType(shift.startTime);
                  
                  return (
                    <TableRow key={shift.id} className="h-24">
                      <TableCell className="font-medium border-r align-middle">
                        <div className="flex items-center gap-2">
                           {shiftType === 'day' ? (
                                <Sun className="h-5 w-5 text-amber-500" />
                            ) : (
                                <Moon className="h-5 w-5 text-blue-300" />
                            )}
                            <span>{shift.startTime} - {shift.endTime}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-r align-middle">{getClientName(shift.clientId)}</TableCell>
                      <TableCell className="border-r">
                        <Select
                          value={shift.messengerId || "unassigned"}
                          onValueChange={(messengerId) =>
                            onUpdateShift({ id: shift.id, messengerId: messengerId === 'unassigned' ? undefined : messengerId })
                          }
                        >
                          <SelectTrigger className={cn(
                            "w-full",
                            isUnassigned && "border-purple-400 text-purple-600 focus:ring-purple-500"
                          )}>
                            {messenger ? (
                              <div className="flex items-center gap-2 text-card-foreground">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={messenger.avatarUrl} alt={messenger.name} data-ai-hint="person portrait" />
                                  <AvatarFallback>{messenger.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{messenger.name}</span>
                                {!checkAvailability(messenger, shift, day) && (
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Asignado fuera de su disponibilidad.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {(messengerShiftCounts.get(messenger.id) || 0) > 1 && (
                                  <span className="text-xs font-bold text-primary bg-primary/20 rounded-full px-2 py-0.5">
                                    x{messengerShiftCounts.get(messenger.id)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-purple-200 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 text-purple-600" />
                                </div>
                                <span>Asignar Mensajero</span>
                              </div>
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">
                              <div className="flex items-center gap-2 text-purple-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>Sin Asignar</span>
                              </div>
                            </SelectItem>
                            {messengers.map((m) => {
                                const isAvailable = m.status === 'active';
                                const availabilityWarning = !checkAvailability(m, shift, day);
                                const shiftCount = messengerShiftCounts.get(m.id) || 0;
                                return (
                                  <SelectItem key={m.id} value={m.id} disabled={!isAvailable}>
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage src={m.avatarUrl} alt={m.name} data-ai-hint="person portrait" />
                                            <AvatarFallback>{m.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <span className={cn(!isAvailable && "text-muted-foreground line-through")}>{m.name}</span>
                                          {availabilityWarning && isAvailable && (
                                            <Tooltip>
                                              <TooltipTrigger><ShieldAlert className="h-4 w-4 text-amber-500" /></TooltipTrigger>
                                              <TooltipContent><p>Fuera de disponibilidad preferida.</p></TooltipContent>
                                            </Tooltip>
                                          )}
                                          {shiftCount > 1 && (
                                              <span className="text-xs font-bold text-primary bg-primary/20 rounded-full px-2 py-0.5">
                                                  x{shiftCount}
                                              </span>
                                          )}
                                        </div>
                                        {!isAvailable && 
                                            <Tooltip>
                                                <TooltipTrigger>{statusIcons[m.status]}</TooltipTrigger>
                                                <TooltipContent><p>{statusLabels[m.status]}</p></TooltipContent>
                                            </Tooltip>
                                        }
                                    </div>
                                  </SelectItem>
                                )
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border-r align-middle">
                        <NotesCell 
                          note={shift.notes}
                          onSave={(newNote) => onUpdateShift({ id: shift.id, notes: newNote })}
                        />
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditShift(shift)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive dark:text-primary dark:hover:brightness-110">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el turno.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteShift(shift.id)} className="bg-[#B95A5A] hover:bg-[#B95A5A]/90 font-bold">Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-48 text-center text-muted-foreground capitalize">
                No hay turnos para la selección actual.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </TooltipProvider>
  );
}
