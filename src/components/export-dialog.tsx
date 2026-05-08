"use client";

import { useState, useRef } from "react";
import { format } from 'date-fns';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { Upload, Download, Save, FolderDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/hooks/use-data";
import type { Shift, Messenger, Client } from "@/lib/types";
import { Separator } from "./ui/separator";


type ExportDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  shifts: Shift[];
  messengers: Messenger[];
  clients: Client[];
};

type DateRangeOption = "today" | "this_week" | "this_month" | "last_month" | "all";

export function ExportDialog({
  isOpen,
  onOpenChange,
  shifts,
  messengers,
  clients,
}: ExportDialogProps) {
  const { toast } = useToast();
  const { importData } = useData();
  const [dateRange, setDateRange] = useState<DateRangeOption>("this_week");
  const [messengerFilter, setMessengerFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFilteredShifts = () => {
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateRange) {
      case "today":
        startDate = today;
        endDate = today;
        break;
      case "this_week":
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "this_month":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "last_month":
        const startOfThisMonth = startOfMonth(today);
        startDate = startOfMonth(subMonths(startOfThisMonth, 1));
        endDate = endOfMonth(startDate);
        break;
      case "all":
        break;
    }

    let dateFilteredShifts = shifts.filter(shift => {
      if (!startDate || !endDate) return true;
      const shiftDate = new Date(shift.date + "T00:00:00");
      return shiftDate >= startDate && shiftDate <= endDate;
    });

    return dateFilteredShifts.filter(shift => {
      const messengerMatch = messengerFilter === "all" || shift.messengerId === messengerFilter;
      return messengerMatch;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startTime.localeCompare(b.startTime));
  };

  const handleExportCSV = () => {
    const filteredShifts = getFilteredShifts();
    if (filteredShifts.length === 0) {
        toast({ variant: "destructive", title: "No hay datos", description: "No hay turnos que coincidan con los filtros seleccionados." });
        return;
    }

    const getClientName = (id: string) => clients.find(c => c.id === id)?.name || "N/A";
    const getMessengerName = (id?: string) => messengers.find(m => m.id === id)?.name || "Sin Asignar";

    const headers = ["Fecha", "Hora", "Cliente", "Mensajero", "Notas"];
    const rows = filteredShifts.map(s => [
        s.date,
        `${s.startTime} - ${s.endTime}`,
        `"${getClientName(s.clientId)}"`,
        `"${getMessengerName(s.messengerId)}"`,
        `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `turnos_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onOpenChange(false);
  };

  const handleExportPDF = () => {
    const filteredShifts = getFilteredShifts();
    if (filteredShifts.length === 0) {
        toast({ variant: "destructive", title: "No hay datos", description: "No hay turnos que coincidan con los filtros seleccionados." });
        return;
    }

    const getClientName = (id: string) => clients.find(c => c.id === id)?.name || "N/A";
    const getMessengerName = (id?: string) => messengers.find(m => m.id === id)?.name || "Sin Asignar";

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Reporte de Turnos", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    const messengerName = messengerFilter !== 'all' ? getMessengerName(messengerFilter) : 'Todos';
    const dateRangeText = {
        'today': 'Hoy', 'this_week': 'Esta Semana', 'this_month': 'Este Mes', 'last_month': 'Mes Pasado', 'all': 'Todos'
    }[dateRange];
    
    doc.text(`Mensajero: ${messengerName}`, 14, 30);
    doc.text(`Rango: ${dateRangeText}`, 14, 36);

    autoTable(doc, {
      startY: 50,
      head: [["Fecha", "Hora", "Cliente", "Mensajero", "Notas"]],
      body: filteredShifts.map(s => [
        s.date,
        `${s.startTime} - ${s.endTime}`,
        getClientName(s.clientId),
        getMessengerName(s.messengerId),
        s.notes || "-"
      ]),
      theme: 'striped',
      headStyles: { fillColor: [34, 34, 134] },
    });
    
    doc.save(`reporte_turnos_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    onOpenChange(false);
  };
  
  const handleExportJSON = () => {
    const allData = { shifts, messengers, clients };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(allData, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "backup_turnos.json";
    link.click();
    onOpenChange(false);
  }

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isCSV = file.name.toLowerCase().endsWith('.csv');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          let data: any = { shifts: [], messengers: [], clients: [] };

          if (isCSV) {
            const results = Papa.parse<any>(text, { header: true, skipEmptyLines: true });
            if (results.errors.length > 0) {
              console.error("PapaParse errors:", results.errors);
              toast({
                variant: "destructive",
                title: "Advertencia en formato CSV",
                description: "Se encontraron problemas al leer el archivo. Algunas filas podrían tener un formato inválido.",
              });
            }
            
            // Determinar tipo de CSV basado en cabeceras
            const firstRow = results.data[0] || {};
            if ('date' in firstRow || 'startTime' in firstRow || 'clientId' in firstRow) {
                data.shifts = results.data;
            } else if ('status' in firstRow || 'avatarUrl' in firstRow || 'availableWeekdays' in firstRow || 'shiftPreference' in firstRow) {
                data.messengers = results.data;
            } else {
                data.clients = results.data;
            }
          } else {
            // Asumimos que es JSON
            data = JSON.parse(text);
          }

          if (!Array.isArray(data.shifts)) data.shifts = [];
          if (!Array.isArray(data.messengers)) data.messengers = [];
          if (!Array.isArray(data.clients)) data.clients = [];

          // Saneamiento estricto de IDs y datos vacíos
          const sanitizeId = (item: any) => {
              if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
                  return { ...item, id: crypto.randomUUID() };
              }
              return item;
          };
          
          const sanitizeString = (val: any) => (val === null || val === undefined) ? "" : String(val).trim();

          const sanitizedClients = data.clients.map((c: any) => {
              const client = sanitizeId(c);
              client.name = sanitizeString(client.name);
              return client;
          });

          const sanitizedMessengers = data.messengers.map((m: any) => {
              const msgr = sanitizeId(m);
              msgr.name = sanitizeString(msgr.name);
              msgr.avatarUrl = sanitizeString(msgr.avatarUrl);
              msgr.status = sanitizeString(msgr.status) || 'active';
              msgr.shiftPreference = sanitizeString(msgr.shiftPreference) || 'any';
              
              if (typeof msgr.availableWeekdays === 'string') {
                  try {
                      msgr.availableWeekdays = JSON.parse(msgr.availableWeekdays);
                  } catch {
                      msgr.availableWeekdays = [];
                  }
              }
              if (!Array.isArray(msgr.availableWeekdays)) msgr.availableWeekdays = [];
              return msgr;
          });

          const sanitizedShifts = data.shifts.map((shift: any) => {
              const s = sanitizeId(shift);
              s.clientId = sanitizeString(s.clientId);
              s.date = sanitizeString(s.date);
              s.startTime = sanitizeString(s.startTime);
              s.endTime = sanitizeString(s.endTime);
              s.notes = sanitizeString(s.notes);
              
              if (!s.messengerId || String(s.messengerId).trim() === '') {
                s.messengerId = undefined;
              } else {
                s.messengerId = sanitizeString(s.messengerId);
              }
              return s;
          });

          importData({
            shifts: sanitizedShifts,
            messengers: sanitizedMessengers,
            clients: sanitizedClients
          });
          toast({ title: "Importación Exitosa", description: "Los datos se han cargado y saneado correctamente." });
          onOpenChange(false);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error de Importación",
          description: error instanceof Error ? error.message : "No se pudo procesar el archivo.",
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar / Importar</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="report">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="report">Reportes</TabsTrigger>
                <TabsTrigger value="backup">Backup</TabsTrigger>
            </TabsList>
            <TabsContent value="report">
                <DialogDescription className="py-2">
                    Selecciona los filtros para generar tu reporte en PDF o CSV.
                </DialogDescription>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Rango de Fechas</Label>
                        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeOption)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Hoy</SelectItem>
                                <SelectItem value="this_week">Esta Semana</SelectItem>
                                <SelectItem value="this_month">Este Mes</SelectItem>
                                <SelectItem value="last_month">Mes Pasado</SelectItem>
                                <SelectItem value="all">Todos los Turnos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Filtrar por Mensajero</Label>
                        <Select value={messengerFilter} onValueChange={setMessengerFilter}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Mensajeros</SelectItem>
                                {messengers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={handleExportCSV}>
                        Exportar a CSV
                    </Button>
                    <Button type="submit" onClick={handleExportPDF}>
                        Exportar a PDF
                    </Button>
                </DialogFooter>
            </TabsContent>
            <TabsContent value="backup">
                 <DialogDescription className="py-2">
                    Guarda o restaura todos los datos de la aplicación.
                </DialogDescription>
                    <h3 className="font-semibold text-lg text-center mb-4">Copia de Seguridad Local (JSON)</h3>
                    <div className="flex w-full gap-4 max-w-sm">
                      <Button onClick={handleExportJSON} className="w-full h-12 text-base">
                          <Download className="mr-2"/> Descargar
                      </Button>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full h-12 text-base">
                          <Upload className="mr-2"/> Restaurar
                      </Button>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".json,.csv" onChange={handleImportJSON} />
                    </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
