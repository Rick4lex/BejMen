"use client";

import { useState, useMemo } from "react";
import { format, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Sun, Moon, AlertTriangle, PlusCircle, Edit2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getShiftType } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Shift, Messenger, Client } from "@/lib/types";

interface MessengerViewProps {
  messengers: Messenger[];
  clients: Client[];
  shifts: Shift[];
  month: Date[];
  onEditShift?: (shift: Shift) => void;
  onAddShift?: (messengerId?: string, date?: Date) => void;
  onOpenMessengerEdit?: (messengerId: string) => void;
}

const WEEKDAYS = ["Domingos", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábados"];

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  stranded: "Inmovilizado",
  incapacitated: "De Baja",
  on_leave: "Vacaciones"
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  stranded: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  incapacitated: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  on_leave: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
};

function calculateHours(startTime: string, endTime: string) {
    try {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const diff = (endH * 60 + endM) - (startH * 60 + startM);
        return Math.round((diff / 60) * 10) / 10;
    } catch {
        return 0;
    }
}

function isOverlap(shift: Shift, otherShifts: Shift[]) {
    const getMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };
    const start = getMinutes(shift.startTime);
    const end = getMinutes(shift.endTime);
    
    return otherShifts.some(other => {
        if (other.id === shift.id) return false;
        const otherStart = getMinutes(other.startTime);
        const otherEnd = getMinutes(other.endTime);
        return (start < otherEnd && end > otherStart);
    });
}

export function MessengerView({
  messengers,
  clients,
  shifts,
  month,
  onEditShift,
  onAddShift,
  onOpenMessengerEdit
}: MessengerViewProps) {
  const [selectedMessengerId, setSelectedMessengerId] = useState<string>("all");
  const [selectedWeekday, setSelectedWeekday] = useState<number>(new Date().getDay());

  const selectedMessenger = useMemo(() => {
    return messengers.find((m) => m.id === selectedMessengerId);
  }, [selectedMessengerId, messengers]);
  
  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name || "Cliente Desconocido";

  const monthDatesForWeekday = useMemo(() => {
    return month.filter(day => getDay(day) === selectedWeekday);
  }, [month, selectedWeekday]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-4 max-w-sm">
            <label htmlFor="messenger-select" className="font-semibold whitespace-nowrap">
            Seleccionar Mensajero:
            </label>
            <Select
            value={selectedMessengerId}
            onValueChange={setSelectedMessengerId}
            >
            <SelectTrigger id="messenger-select" className="w-[250px]">
                {selectedMessengerId === "all" ? (
                    <span>Todos los mensajeros</span>
                ) : selectedMessenger ? (
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedMessenger.avatarUrl} alt={selectedMessenger.name} data-ai-hint="person portrait"/>
                    <AvatarFallback>{selectedMessenger.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{selectedMessenger.name}</span>
                </div>
                ) : (
                    <SelectValue placeholder="Seleccione un mensajero" />
                )}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">
                    Todos los mensajeros
                </SelectItem>
                {messengers.map((messenger) => (
                <SelectItem key={messenger.id} value={messenger.id}>
                    <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                    <AvatarImage src={messenger.avatarUrl} alt={messenger.name} data-ai-hint="person portrait"/>
                    <AvatarFallback>{messenger.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{messenger.name}</span>
                </div>
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-4 max-w-sm">
            <label htmlFor="weekday-select" className="font-semibold">
                Mostrar todos los:
            </label>
            <Select value={String(selectedWeekday)} onValueChange={(val) => setSelectedWeekday(Number(val))}>
                <SelectTrigger id="weekday-select" className="w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {WEEKDAYS.map((day, index) => (
                        <SelectItem key={day} value={String(index)}>{day}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      {selectedMessengerId === "all" ? (
        <div className="space-y-6">
            {monthDatesForWeekday.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                return (
                    <Card key={dateKey} className="w-full">
                        <CardHeader className="p-4 bg-muted/50">
                            <CardTitle className="text-base capitalize">
                                {format(day, "EEEE, d 'de' MMMM", { locale: es })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mensajero</TableHead>
                                            <TableHead>Turnos</TableHead>
                                            <TableHead>Horas</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Alertas</TableHead>
                                            <TableHead className="text-right">Acción Ágil</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(() => {
                                            const unassignedShifts = shifts.filter(s => (!s.messengerId || s.messengerId.trim() === '') && s.date === dateKey);
                                            const activeMessengers = messengers.filter(m => shifts.some(s => s.messengerId === m.id && s.date === dateKey));
                                            
                                            if (activeMessengers.length === 0 && unassignedShifts.length === 0) {
                                                return (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                            Sin turnos programados
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }

                                            return (
                                                <>
                                                    {unassignedShifts.length > 0 && (
                                                        <TableRow className="bg-destructive/10 border-destructive/20 border-b-2">
                                                            <TableCell className="font-bold text-destructive">
                                                                <div className="flex items-center gap-2">
                                                                    <AlertTriangle className="h-4 w-4" />
                                                                    <span>Turnos sin Asignar</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-bold text-destructive">{unassignedShifts.length}</TableCell>
                                                            <TableCell className="font-bold text-destructive">
                                                                {unassignedShifts.reduce((acc, s) => acc + calculateHours(s.startTime, s.endTime), 0)}
                                                            </TableCell>
                                                            <TableCell>-</TableCell>
                                                            <TableCell></TableCell>
                                                            <TableCell className="text-right">
                                                                <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => onAddShift?.(undefined, day)}>
                                                                    Asignar
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                    {activeMessengers.map(messenger => {
                                                        const messengerShifts = shifts.filter(s => s.messengerId === messenger.id && s.date === dateKey);
                                                        const totalHours = messengerShifts.reduce((acc, s) => acc + calculateHours(s.startTime, s.endTime), 0);
                                                        
                                                        return (
                                                            <TableRow key={messenger.id}>
                                                                <TableCell className="font-medium">
                                                                    <Button variant="link" className="p-0 h-auto font-medium text-foreground hover:text-primary" onClick={() => onOpenMessengerEdit?.(messenger.id)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="h-6 w-6">
                                                                                <AvatarImage src={messenger.avatarUrl} alt={messenger.name} />
                                                                                <AvatarFallback>{messenger.name.charAt(0)}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span>{messenger.name}</span>
                                                                            <Edit2 className="h-3 w-3 opacity-50" />
                                                                        </div>
                                                                    </Button>
                                                                </TableCell>
                                                                <TableCell>{messengerShifts.length}</TableCell>
                                                                <TableCell>{totalHours}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className={STATUS_COLORS[messenger.status] || ""}>
                                                                        {STATUS_LABELS[messenger.status] || messenger.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {totalHours > 8 && (
                                                                        <Badge variant="destructive" className="flex w-max items-center gap-1">
                                                                            <AlertTriangle className="h-3 w-3" /> +8h
                                                                        </Badge>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button size="sm" variant="ghost" onClick={() => onAddShift?.(messenger.id, day)}>
                                                                        <PlusCircle className="h-4 w-4 mr-2"/>
                                                                        Añadir/Asignar
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </>
                                            );
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      ) : (
        <div className="space-y-6">
            {monthDatesForWeekday.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayShifts = shifts.filter(s => s.messengerId === selectedMessengerId && s.date === dateKey)
                                        .sort((a,b) => a.startTime.localeCompare(b.startTime));
                
                const totalHours = dayShifts.reduce((acc, s) => acc + calculateHours(s.startTime, s.endTime), 0);

                return (
                    <Card key={dateKey} className="w-full">
                        <CardHeader className="p-4 bg-muted/50">
                            <CardTitle className="text-base capitalize">
                                {format(day, "EEEE, d 'de' MMMM", { locale: es })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Turno</TableHead>
                                            <TableHead>Horas</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Alertas</TableHead>
                                            <TableHead className="text-right">Acción Ágil</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dayShifts.length > 0 ? dayShifts.map(shift => {
                                            const overlap = isOverlap(shift, dayShifts);
                                            return (
                                                <TableRow key={shift.id}>
                                                    <TableCell className="font-medium">{getClientName(shift.clientId)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getShiftType(shift.startTime) === 'day' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-blue-300" />}
                                                            <span>{shift.startTime} - {shift.endTime}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{calculateHours(shift.startTime, shift.endTime)}</TableCell>
                                                    <TableCell>
                                                        {/* TODO: Reemplazar valor estático cuando se implementen estados dinámicos en la interfaz Shift */}
                                                        <Badge variant="secondary">Programado</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {overlap && (
                                                            <Badge variant="destructive" className="flex w-max items-center gap-1">
                                                                <AlertTriangle className="h-3 w-3" /> Solapamiento
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="ghost" onClick={() => onEditShift?.(shift)}>
                                                            <Edit2 className="h-4 w-4 mr-2"/>
                                                            Editar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                    Sin turnos programados
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    <TableRow className="bg-muted/30">
                                        <TableCell className="font-bold">Total del Día</TableCell>
                                        <TableCell className="font-bold">{dayShifts.length} turnos</TableCell>
                                        <TableCell className="font-bold">{totalHours} hrs</TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => onAddShift?.(selectedMessengerId, day)}>
                                                <PlusCircle className="h-4 w-4 mr-2"/>
                                                Añadir Turno
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      )}
    </div>
  );
}
