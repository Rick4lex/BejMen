"use client";

import { useState, useMemo } from "react";
import { format, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Sun, Moon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getShiftType } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

import type { Shift, Messenger, Client } from "@/lib/types";

interface MessengerViewProps {
  messengers: Messenger[];
  clients: Client[];
  shifts: Shift[];
  month: Date[];
}

const WEEKDAYS = ["Domingos", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábados"];

export function MessengerView({
  messengers,
  clients,
  shifts,
  month,
}: MessengerViewProps) {
  const [selectedMessengerId, setSelectedMessengerId] = useState<string | null>(messengers[0]?.id || null);
  const [selectedWeekday, setSelectedWeekday] = useState<number>(new Date().getDay());

  const selectedMessenger = useMemo(() => {
    return messengers.find((m) => m.id === selectedMessengerId);
  }, [selectedMessengerId, messengers]);
  
  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name || "Cliente Desconocido";

  const shiftsForWeekdayInMonth = useMemo(() => {
    if (!selectedMessengerId || !month || month.length === 0) return [];

    const monthDatesForWeekday = month.filter(day => getDay(day) === selectedWeekday);

    return monthDatesForWeekday.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayShifts = shifts.filter(shift => shift.messengerId === selectedMessengerId && shift.date === dateKey)
                                .sort((a,b) => a.time.localeCompare(b.time));
        return {
            date: day,
            shifts: dayShifts
        };
    });
  }, [selectedMessengerId, shifts, month, selectedWeekday]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-4 max-w-sm">
            <label htmlFor="messenger-select" className="font-semibold whitespace-nowrap">
            Seleccionar Mensajero:
            </label>
            <Select
            value={selectedMessengerId ?? undefined}
            onValueChange={setSelectedMessengerId}
            >
            <SelectTrigger id="messenger-select" className="w-[250px]">
                {selectedMessenger ? (
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

      {selectedMessengerId ? (
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-4 pb-4">
            {shiftsForWeekdayInMonth.map(({ date, shifts: dayShifts }) => (
                <Card key={format(date, 'yyyy-MM-dd')} className="flex-shrink-0 w-80">
                <CardHeader className="p-4 bg-muted/50">
                    <CardTitle className="text-base text-center capitalize">
                        {format(date, "eeee, d 'de' MMMM", { locale: es })}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-80">
                        <div className="p-2 space-y-2">
                            {dayShifts.length > 0 ? (
                                dayShifts.map((shift) => {
                                    const shiftType = getShiftType(shift.time);
                                    return (
                                    <div key={shift.id} className="p-2 rounded-lg text-sm border bg-card">
                                        <div className="flex items-center gap-2 font-semibold">
                                            {shiftType === 'day' ? (
                                                <Sun className="h-4 w-4 text-amber-500" />
                                            ) : (
                                                <Moon className="h-4 w-4 text-blue-300" />
                                            )}
                                            <span>{shift.time}</span>
                                        </div>
                                        <p className="pl-5 text-muted-foreground">{getClientName(shift.clientId)}</p>
                                        {shift.notes && (
                                            <div className="pl-5 mt-1 pt-1 border-t prose prose-sm max-w-none text-muted-foreground">
                                               <ReactMarkdown components={{p: ({children}) => <p className="text-xs m-0">{children}</p>}}>
                                                {shift.notes.split('\n')[0]}
                                               </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                )})
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-8">
                                    Sin turnos
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                </Card>
            ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          Por favor, seleccione un mensajero para ver su agenda mensual.
        </div>
      )}
    </div>
  );
}
