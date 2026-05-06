
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Wand2, PlusCircle, User, Briefcase, Copy, SlidersHorizontal, UserX, Clock, ListTodo, Download, KeyRound, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShiftTable } from "@/components/shift-table";
import { MessengerView } from "@/components/messenger-view";
import { AiSuggestionDialog } from "@/components/ai-suggestion-dialog";
import { Badge } from "@/components/ui/badge";
import { ShiftFormDialog } from "@/components/shift-form-dialog";
import { ManageMessengersDialog } from "@/components/manage-messengers-dialog";
import { ManageClientsDialog } from "@/components/manage-clients-dialog";
import { CopyShiftsDialog } from "@/components/copy-shifts-dialog";
import { ExportDialog } from "@/components/export-dialog";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/hooks/use-data";
import type { Shift, Messenger, Client } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


type GroupByOption = "none" | "client" | "messenger";

export function DashboardClient() {
  const { 
    shifts, 
    messengers, 
    clients, 
    addShift, 
    updateShift, 
    deleteShift, 
    addShiftsBatch,
    deleteShiftsForDay,
    deleteShiftsForWeek
  } = useData();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isManageMessengersOpen, setIsManageMessengersOpen] = useState(false);
  const [isManageClientsOpen, setIsManageClientsOpen] = useState(false);
  const [isCopyShiftsDialogOpen, setIsCopyShiftsDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [isDeleteDayDialogOpen, setIsDeleteDayDialogOpen] = useState(false);
  const [isDeleteWeekDialogOpen, setIsDeleteWeekDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { generateToken } = useAuth();
  
  const [week, setWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Filter and grouping states
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("time");

  const daysInWeek = useMemo(() => eachDayOfInterval({ start: week, end: endOfWeek(week, { weekStartsOn: 1 }) }), [week]);
  const shiftsThisWeekCount = useMemo(() => {
    const weekStartStr = format(daysInWeek[0], 'yyyy-MM-dd');
    const weekEndStr = format(daysInWeek[6], 'yyyy-MM-dd');
    return shifts.filter(s => s.date >= weekStartStr && s.date <= weekEndStr).length;
  }, [shifts, daysInWeek]);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    shifts.forEach(shift => {
        const dateKey = shift.date;
        if (!map.has(dateKey)) {
            map.set(dateKey, []);
        }
        map.get(dateKey)!.push(shift);
    });
    return map;
  }, [shifts]);

  const dailySummary = useMemo(() => {
    const shiftsForDay = shifts.filter(s => isSameDay(parseISO(s.date), selectedDate));
    const unassignedCount = shiftsForDay.filter(s => !s.messengerId).length;
    const totalHours = shiftsForDay.reduce((acc, shift) => {
      try {
        const [start, end] = shift.time.split(' - ');
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        const diff = (endH * 60 + endM) - (startH * 60 + startM);
        return acc + diff / 60;
      } catch {
        return acc;
      }
    }, 0);

    return {
      totalShifts: shiftsForDay.length,
      unassignedShifts: unassignedCount,
      totalHours: Math.round(totalHours * 10) / 10,
    }
  }, [shifts, selectedDate]);
  
  const handleSaveShift = (shiftData: Omit<Shift, 'id'>) => {
    if (editingShift) {
      updateShift({ ...editingShift, ...shiftData });
      toast({ title: "Turno Actualizado", description: "El turno ha sido actualizado correctamente." });
    } else {
      addShift({ ...shiftData, id: uuidv4() });
      toast({ title: "Turno Creado", description: "El nuevo turno ha sido añadido." });
    }
    setEditingShift(null);
    setIsShiftFormOpen(false);
  };
  
  const handleCopyShifts = (destinationDate: Date) => {
    const sourceDateStr = format(selectedDate, 'yyyy-MM-dd');
    const destinationDateStr = format(destinationDate, 'yyyy-MM-dd');

    const shiftsToCopy = shifts.filter(s => s.date === sourceDateStr);

    if (shiftsToCopy.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay turnos para copiar",
        description: "El día seleccionado no tiene turnos para copiar.",
      });
      return;
    }

    const newShifts = shiftsToCopy.map(shift => ({
      ...shift,
      id: uuidv4(),
      date: destinationDateStr,
    }));

    addShiftsBatch(newShifts);
    setIsCopyShiftsDialogOpen(false);
    
    toast({
      title: "Turnos Copiados Correctamente",
      description: `Se copiaron ${newShifts.length} turnos al ${format(destinationDate, "d 'de' MMMM, yyyy", { locale: es })}.`,
    });
  };

  const handleAddNewShift = () => {
    setEditingShift(null);
    setIsShiftFormOpen(true);
  }

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setIsShiftFormOpen(true);
  }

  const handleDeleteShift = (shiftId: string) => {
    deleteShift(shiftId);
    toast({ title: "Turno Eliminado", description: "El turno ha sido eliminado." });
  }

  const handleDeleteDayShifts = () => {
    deleteShiftsForDay(selectedDate);
    toast({ title: "Turnos del Día Eliminados", description: `Todos los turnos del ${format(selectedDate, "d 'de' MMMM", { locale: es })} han sido eliminados.` });
    setIsDeleteDayDialogOpen(false);
  }

  const handleDeleteWeekShifts = () => {
    deleteShiftsForWeek(week);
    toast({ title: "Turnos de la Semana Eliminados", description: `Se eliminaron ${shiftsThisWeekCount} turnos de la semana actual.` });
    setIsDeleteWeekDialogOpen(false);
  }
  
  const handleUpdateShiftInTable = useCallback((updatedShift: Partial<Shift> & { id: string }) => {
    updateShift(updatedShift);
  }, [updateShift]);

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    if (format(startOfMonth(day), 'yyyy-MM') !== format(currentMonth, 'yyyy-MM')) {
        setCurrentMonth(startOfMonth(day));
    }
  };
  
  const goToPreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    const newWeekStart = startOfWeek(newMonth, { weekStartsOn: 1 });
    setWeek(newWeekStart);
    setSelectedDate(newWeekStart);
  };

  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    const newWeekStart = startOfWeek(newMonth, { weekStartsOn: 1 });
    setWeek(newWeekStart);
    setSelectedDate(newWeekStart);
  };
  
  const goToPreviousWeek = () => {
      const newWeekStart = subWeeks(week, 1);
      setWeek(newWeekStart);
      setSelectedDate(newWeekStart);
      if (format(startOfMonth(newWeekStart), 'yyyy-MM') !== format(currentMonth, 'yyyy-MM')) {
          setCurrentMonth(startOfMonth(newWeekStart));
      }
  }

  const goToNextWeek = () => {
      const newWeekStart = addWeeks(week, 1);
      setWeek(newWeekStart);
      setSelectedDate(newWeekStart);
      if (format(startOfMonth(newWeekStart), 'yyyy-MM') !== format(currentMonth, 'yyyy-MM')) {
          setCurrentMonth(startOfMonth(newWeekStart));
      }
  }

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setWeek(startOfWeek(today, { weekStartsOn: 1 }));
    setCurrentMonth(startOfMonth(today));
  }
  
  const filteredAndSortedShifts = useMemo(() => {
    let dayShifts = shifts.filter((shift) => isSameDay(parseISO(shift.date), selectedDate));

    if (filterUnassigned) {
      dayShifts = dayShifts.filter(s => !s.messengerId);
    }

    if (clientFilter !== 'all') {
      dayShifts = dayShifts.filter(s => s.clientId === clientFilter);
    }
    
    switch (sortOrder) {
      case 'client-asc':
        dayShifts.sort((a, b) => {
          const clientA = clients.find(c => c.id === a.clientId)?.name || '';
          const clientB = clients.find(c => c.id === b.clientId)?.name || '';
          return clientA.localeCompare(clientB);
        });
        break;
      case 'client-desc':
        dayShifts.sort((a, b) => {
          const clientA = clients.find(c => c.id === a.clientId)?.name || '';
          const clientB = clients.find(c => c.id === b.clientId)?.name || '';
          return clientB.localeCompare(clientA);
        });
        break;
      case 'time':
      default:
        dayShifts.sort((a,b) => a.time.localeCompare(b.time));
        break;
    }

    return dayShifts;
  }, [shifts, selectedDate, filterUnassigned, clientFilter, sortOrder, clients]);

  const groupedShifts = useMemo(() => {
    if (groupBy === 'none' || filteredAndSortedShifts.length === 0) {
      return [{ groupTitle: '', shifts: filteredAndSortedShifts }];
    }
    
    const groups: { [key: string]: Shift[] } = {};
    filteredAndSortedShifts.forEach(shift => {
        let key = 'zz_unassigned'; // Prefix to sort unassigned last
        if (groupBy === 'client' && shift.clientId) {
            key = clients.find(c => c.id === shift.clientId)?.name || 'Cliente Desconocido';
        } else if (groupBy === 'messenger' && shift.messengerId) {
            key = messengers.find(m => m.id === shift.messengerId)?.name || 'zz_unassigned';
        }

        if (key === 'zz_unassigned' || (groupBy === 'messenger' && !shift.messengerId) ) key = 'Sin Asignar';

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(shift);
    });

    return Object.entries(groups)
      .map(([groupTitle, shifts]) => ({ groupTitle, shifts }))
      .sort((a, b) => {
        if (a.groupTitle === 'Sin Asignar') return 1;
        if (b.groupTitle === 'Sin Asignar') return -1;
        return a.groupTitle.localeCompare(b.groupTitle)
      });

  }, [filteredAndSortedShifts, groupBy, clients, messengers]);


  const daysInMonth = useMemo(() => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }), [currentMonth]);

  if (!shifts || !messengers || !clients) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Cargando datos...</div>
      </div>
    );
  }

  return (
    <>
      <Card className="w-full shadow-lg rounded-xl overflow-hidden">
        <Tabs defaultValue="schedule" className="w-full">
          <CardHeader className="flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold font-headline">
                  Panel de Turnos
                </CardTitle>
                <CardDescription>Gestión de turnos, mensajeros y clientes.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => setIsManageClientsOpen(true)} variant="outline" size="sm"><Briefcase className="mr-2"/>Gestionar Clientes</Button>
                <Button onClick={() => setIsManageMessengersOpen(true)} variant="outline" size="sm"><User className="mr-2"/>Gestionar Mensajeros</Button>
                <Button onClick={() => setIsExportDialogOpen(true)} variant="outline" size="sm"><Download className="mr-2"/>Exportar</Button>
                <Button onClick={() => setIsTokenDialogOpen(true)} variant="outline" size="sm"><KeyRound className="mr-2"/>Token</Button>
                <TabsList className="bg-[#E19938]">
                  <TabsTrigger value="schedule" className="dark:text-white data-[state=active]:text-foreground dark:data-[state=active]:text-foreground">Agenda</TabsTrigger>
                  <TabsTrigger value="messenger" className="text-white data-[state=active]:text-foreground dark:data-[state=active]:text-foreground">Vista por Mensajero</TabsTrigger>
                </TabsList>
                <Button onClick={() => setIsAiDialogOpen(true)} variant="outline">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Sugerencias IA
                </Button>
              </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="schedule">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-secondary dark:bg-card">
                   <div className="flex items-center gap-2">
                     <Button variant="default" size="icon" onClick={goToPreviousMonth} className="bg-[#222286] text-primary-foreground hover:bg-[#222286]/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                       <ChevronLeft className="h-4 w-4" />
                     </Button>
                     <h2 className="text-lg font-semibold text-center w-48 capitalize">
                       {format(currentMonth, "MMMM yyyy", { locale: es })}
                     </h2>
                     <Button variant="default" size="icon" onClick={goToNextMonth} className="bg-[#222286] text-primary-foreground hover:bg-[#222286]/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                       <ChevronRight className="h-4 w-4" />
                     </Button>
                   </div>
                   <div className="flex items-center gap-2">
                     <Button variant="default" onClick={goToPreviousWeek} className="bg-[#222286] text-primary-foreground hover:bg-[#222286]/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                       <ChevronLeft className="h-4 w-4 mr-2" /> Sem. Ant.
                     </Button>
                     <Button variant="default" onClick={goToToday} className="bg-[#222286] text-primary-foreground hover:bg-[#222286]/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">Hoy</Button>
                     <Button variant="default" onClick={goToNextWeek} className="bg-[#222286] text-primary-foreground hover:bg-[#222286]/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                       Sem. Sig. <ChevronRight className="h-4 w-4 ml-2" />
                     </Button>
                   </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                    {daysInWeek.map((day) => {
                      const dayShiftsCount = shiftsByDate.get(format(day, 'yyyy-MM-dd'))?.length ?? 0;
                      return (
                          <Button
                              key={day.toString()}
                              variant={isSameDay(day, selectedDate) ? "default" : "outline"}
                              onClick={() => handleSelectDay(day)}
                              className={cn(
                                  "h-20 flex flex-col items-center justify-center relative p-1 capitalize", 
                                  isToday(day) && "border-2 border-primary",
                                  format(day, 'M') !== format(currentMonth, 'M') && 'text-muted-foreground/50'
                              )}
                          >
                              <span className="text-sm">{format(day, "eee", { locale: es })}</span>
                              <span className="text-2xl font-bold">{format(day, "d")}</span>
                              {dayShiftsCount > 0 && (
                              <Badge variant={isSameDay(day, selectedDate) ? "secondary" : "default"} className="absolute top-1 right-1 text-xs px-1.5 py-0.5 h-auto">
                                  {dayShiftsCount}
                              </Badge>
                              )}
                        </Button>
                      )
                    })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Turnos</CardTitle>
                      <ListTodo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dailySummary.totalShifts}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Turnos sin Asignar</CardTitle>
                      <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dailySummary.unassignedShifts}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Horas Programadas</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dailySummary.totalHours}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold capitalize">Turnos para el {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}</h3>
                    <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm"><SlidersHorizontal className="mr-2 h-4 w-4"/>Filtros y Agrupación</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                             <div className="grid gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium leading-none">Opciones de Visualización</h4>
                                  <p className="text-sm text-muted-foreground">Ajusta la visualización de la tabla de turnos.</p>
                                </div>
                                <div className="grid gap-2">
                                  <div className="flex items-center justify-between">
                                      <Label htmlFor="unassigned-filter">Mostrar solo sin asignar</Label>
                                      <Switch id="unassigned-filter" checked={filterUnassigned} onCheckedChange={setFilterUnassigned}/>
                                  </div>
                                   <Separator />
                                   <Label>Agrupar por</Label>
                                   <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
                                      <SelectTrigger><SelectValue/></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">Ninguno</SelectItem>
                                        <SelectItem value="client">Cliente</SelectItem>
                                        <SelectItem value="messenger">Mensajero</SelectItem>
                                      </SelectContent>
                                   </Select>
                                   <Label>Ordenar por</Label>
                                   <Select value={sortOrder} onValueChange={setSortOrder}>
                                      <SelectTrigger><SelectValue/></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="time">Hora</SelectItem>
                                        <SelectItem value="client-asc">Cliente (A-Z)</SelectItem>
                                        <SelectItem value="client-desc">Cliente (Z-A)</SelectItem>
                                      </SelectContent>
                                   </Select>
                                   <Label>Filtrar por Cliente</Label>
                                   <Select value={clientFilter} onValueChange={setClientFilter}>
                                      <SelectTrigger><SelectValue/></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all">Todos los Clientes</SelectItem>
                                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                      </SelectContent>
                                   </Select>
                                </div>
                             </div>
                          </PopoverContent>
                        </Popover>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">Acciones</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem 
                              onClick={() => setIsCopyShiftsDialogOpen(true)}
                              disabled={filteredAndSortedShifts.length === 0}
                            >
                                <Copy className="mr-2 h-4 w-4"/>
                                Copiar Turnos del Día
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="font-bold text-[#B95A5A] focus:text-[#B95A5A] focus:bg-destructive/10"
                              onClick={() => setIsDeleteDayDialogOpen(true)}
                              disabled={filteredAndSortedShifts.length === 0}
                            >
                              <Trash2 className="mr-2 h-4 w-4"/>
                              Eliminar Turnos del Día
                            </DropdownMenuItem>
                             <DropdownMenuItem 
                              className="font-bold text-[#B95A5A] focus:text-[#B95A5A] focus:bg-destructive/10"
                              onClick={() => setIsDeleteWeekDialogOpen(true)}
                              disabled={shiftsThisWeekCount === 0}
                            >
                              <Trash2 className="mr-2 h-4 w-4"/>
                              Eliminar Turnos de la Semana
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button onClick={handleAddNewShift} size="sm"><PlusCircle className="mr-2"/>Añadir Turno</Button>
                    </div>
                  </div>
                  <ShiftTable
                    groupedData={groupedShifts}
                    messengers={messengers}
                    clients={clients}
                    day={selectedDate}
                    onUpdateShift={handleUpdateShiftInTable}
                    onEditShift={handleEditShift}
                    onDeleteShift={handleDeleteShift}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="messenger">
              <MessengerView
                messengers={messengers}
                clients={clients}
                shifts={shifts}
                month={daysInMonth}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
      
      <AiSuggestionDialog
        isOpen={isAiDialogOpen}
        onOpenChange={setIsAiDialogOpen}
        messengers={messengers}
      />

      {isShiftFormOpen && (
        <ShiftFormDialog
            isOpen={isShiftFormOpen}
            onOpenChange={setIsShiftFormOpen}
            onSave={handleSaveShift}
            messengers={messengers}
            clients={clients}
            shift={editingShift}
            selectedDate={selectedDate}
        />
      )}

      {isCopyShiftsDialogOpen && (
        <CopyShiftsDialog
          isOpen={isCopyShiftsDialogOpen}
          onOpenChange={setIsCopyShiftsDialogOpen}
          sourceDate={selectedDate}
          onCopy={handleCopyShifts}
          shiftsOnSourceDate={filteredAndSortedShifts.length}
        />
      )}
      
      {isExportDialogOpen && (
        <ExportDialog
          isOpen={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          shifts={shifts}
          messengers={messengers}
          clients={clients}
        />
      )}

      {isManageMessengersOpen && (
        <ManageMessengersDialog
          isOpen={isManageMessengersOpen}
          onOpenChange={setIsManageMessengersOpen}
        />
      )}

      {isManageClientsOpen && (
        <ManageClientsDialog
          isOpen={isManageClientsOpen}
          onOpenChange={setIsManageClientsOpen}
        />
      )}

      <AlertDialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Token de Acceso de Administrador</AlertDialogTitle>
            <AlertDialogDescription>
              Usa este token para acceder a la aplicación desde otros dispositivos.
              ¡Trátalo como una contraseña!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4 bg-muted rounded-md">
            <pre className="text-sm font-semibold text-center select-all">{generateToken()}</pre>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsTokenDialogOpen(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDayDialogOpen} onOpenChange={setIsDeleteDayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminarán {filteredAndSortedShifts.length} turnos del día <strong className="capitalize">{format(selectedDate, "d 'de' MMMM", { locale: es })}</strong>. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDayShifts} className="bg-[#B95A5A] hover:bg-[#B95A5A]/90 font-bold">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteWeekDialogOpen} onOpenChange={setIsDeleteWeekDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminarán los {shiftsThisWeekCount} turnos de la semana del <strong className="capitalize">{format(daysInWeek[0], "d 'de' MMMM", { locale: es })}</strong> al <strong className="capitalize">{format(daysInWeek[6], "d 'de' MMMM", { locale: es })}</strong>. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWeekShifts} className="bg-[#B95A5A] hover:bg-[#B95A5A]/90 font-bold">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
