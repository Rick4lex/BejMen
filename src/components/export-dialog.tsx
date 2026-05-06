"use client";

import { useState, useRef } from "react";
import { format } from 'date-fns';
import { es } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
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
import { saveBackup, loadBackup } from "@/app/actions";
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
  const [isDriveLoading, setIsDriveLoading] = useState(false);
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
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
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
        s.time,
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
        s.time,
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

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const data = JSON.parse(text);
          // Basic validation
          if (data.shifts && data.messengers && data.clients) {
            importData(data);
            toast({ title: "Importación Exitosa", description: "Los datos se han cargado correctamente." });
            onOpenChange(false);
          } else {
            throw new Error("Formato de archivo JSON inválido.");
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error de Importación",
          description: error instanceof Error ? error.message : "No se pudo leer el archivo JSON.",
        });
      }
    };
    reader.readAsText(file);
  }
  
  const handleSaveToDrive = async () => {
    setIsDriveLoading(true);
    const result = await saveBackup({ shifts, messengers, clients });
    setIsDriveLoading(false);

    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      onOpenChange(false);
    } else {
      toast({ variant: "destructive", title: "Error al Guardar", description: result.error });
    }
  }

  const handleLoadFromDrive = async () => {
    setIsDriveLoading(true);
    const result = await loadBackup();
    setIsDriveLoading(false);

    if (result.success && result.data) {
      importData(result.data);
      toast({ title: "Éxito", description: "Copia de seguridad cargada desde Drive." });
      onOpenChange(false);
    } else {
      toast({ variant: "destructive", title: "Error al Cargar", description: result.error });
    }
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
                <div className="py-4 flex flex-col items-center justify-center gap-4">
                    <h3 className="font-semibold">Copia Local (JSON)</h3>
                    <div className="flex w-full gap-2">
                      <Button onClick={handleExportJSON} className="w-full">
                          <Download className="mr-2"/> Exportar
                      </Button>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                          <Upload className="mr-2"/> Importar
                      </Button>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportJSON} />
                    </div>
                    <Separator className="my-2"/>
                    <h3 className="font-semibold">Copia en Google Drive</h3>
                     <div className="flex w-full gap-2">
                        <Button onClick={handleSaveToDrive} className="w-full" disabled={isDriveLoading}>
                            {isDriveLoading ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2" />}
                            Guardar en Drive
                        </Button>
                        <Button variant="outline" onClick={handleLoadFromDrive} className="w-full" disabled={isDriveLoading}>
                            {isDriveLoading ? <Loader2 className="mr-2 animate-spin"/> : <FolderDown className="mr-2" />}
                            Cargar desde Drive
                        </Button>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
