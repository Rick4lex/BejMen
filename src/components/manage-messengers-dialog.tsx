import { useState, useMemo, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, Search, Sun, Moon, Upload, Download } from 'lucide-react';
import type { Messenger, MessengerStatus, ShiftPreference } from '@/lib/types';
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
} from "@/components/ui/alert-dialog"
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const STATUS_OPTIONS: { value: MessengerStatus; label: string }[] = [
    { value: 'active', label: 'Activo' },
    { value: 'on_leave', label: 'Descanso' },
    { value: 'incapacitated', label: 'Incapacitado' },
    { value: 'stranded', label: 'Varado' },
];

interface ManageMessengersDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  defaultMessengerId?: string | null;
}

export function ManageMessengersDialog({ isOpen, onOpenChange, defaultMessengerId }: ManageMessengersDialogProps) {
  const { messengers, setMessengers } = useData();
  const { toast } = useToast();
  const [editingMessenger, setEditingMessenger] = useState<Messenger | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [status, setStatus] = useState<MessengerStatus>('active');
  const [availableWeekdays, setAvailableWeekdays] = useState<number[]>([]);
  const [shiftPreference, setShiftPreference] = useState<ShiftPreference>('any');

  const filteredMessengers = useMemo(() => {
    return messengers.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [messengers, searchTerm]);

  const resetForm = () => {
    setName('');
    setAvatarUrl('');
    setStatus('active');
    setAvailableWeekdays([]);
    setShiftPreference('any');
  }

  const handleAddNew = () => {
    setEditingMessenger(null);
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (messenger: Messenger) => {
    setEditingMessenger(messenger);
    setName(messenger.name);
    setAvatarUrl(messenger.avatarUrl);
    setStatus(messenger.status);
    setAvailableWeekdays(messenger.availableWeekdays);
    setShiftPreference(messenger.shiftPreference);
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (isOpen && defaultMessengerId) {
        const messengerToEdit = messengers.find(m => m.id === defaultMessengerId);
        if (messengerToEdit) {
            handleEdit(messengerToEdit);
        }
    }
  }, [isOpen, defaultMessengerId, messengers]);

  const handleDelete = (messengerId: string) => {
    setMessengers(messengers.filter((m) => m.id !== messengerId));
  };

  const handleSave = () => {
    const finalAvatarUrl = avatarUrl || `https://placehold.co/100x100.png?text=${name.split(' ').map(n => n[0]).join('')}`;
    const messengerData = { name, avatarUrl: finalAvatarUrl, status, availableWeekdays, shiftPreference };
    
    if (editingMessenger) {
      setMessengers(messengers.map((m) => (m.id === editingMessenger.id ? { ...m, ...messengerData } : m)));
    } else {
      setMessengers([...messengers, { id: uuidv4(), ...messengerData }]);
    }
    setIsFormOpen(false);
    setEditingMessenger(null);
    resetForm();
  };
  
  const handleExportCSV = () => {
    if (messengers.length === 0) {
      toast({ variant: "destructive", title: "No hay mensajeros para exportar." });
      return;
    }
    const headers = ["id", "name", "avatarUrl", "status", "availableWeekdays", "shiftPreference"];
    const rows = messengers.map(m => [
        m.id,
        `"${m.name.replace(/"/g, '""')}"`,
        m.avatarUrl,
        m.status,
        `"${m.availableWeekdays.join('|')}"`, // Use a different separator
        m.shiftPreference
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mensajeros_backup.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const headers = rows.shift()?.split(',').map(h => h.trim()) || [];

        if (headers.length < 6 || headers[0] !== 'id' || headers[1] !== 'name') {
          throw new Error("El archivo CSV tiene un formato incorrecto. Faltan cabeceras requeridas.");
        }

        const newMessengers: Messenger[] = rows.map(row => {
          const values = row.split(',');
          return {
            id: values[0],
            name: values[1].replace(/"/g, ''),
            avatarUrl: values[2],
            status: values[3] as MessengerStatus,
            availableWeekdays: values[4].replace(/"/g, '').split('|').map(Number),
            shiftPreference: values[5] as ShiftPreference,
          };
        });

        setMessengers(newMessengers);
        toast({ title: "Importación Exitosa", description: `${newMessengers.length} mensajeros importados.` });

      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error de Importación",
          description: error instanceof Error ? error.message : "No se pudo procesar el archivo CSV.",
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar Mensajeros</DialogTitle>
        </DialogHeader>
        
        {!isFormOpen ? (
          <>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar mensajero..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                />
            </div>
            <ScrollArea className="h-72">
              <div className="space-y-2 pr-4">
                {filteredMessengers.map((messenger) => (
                  <div key={messenger.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                        <Avatar>
                            <AvatarImage src={messenger.avatarUrl} alt={messenger.name} data-ai-hint="person portrait"/>
                            <AvatarFallback>{messenger.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{messenger.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(messenger)}>
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
                              Esta acción no se puede deshacer. Esto eliminará permanentemente al mensajero.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(messenger.id)} className="bg-[#B95A5A] hover:bg-[#B95A5A]/90 font-bold">Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                <div className="flex w-full gap-2">
                    <Button variant="outline" onClick={handleExportCSV} className="w-full"><Download/>Exportar a CSV</Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full"><Upload/>Importar desde CSV</Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                </div>
                <Button onClick={handleAddNew} className="w-full"><PlusCircle/>Añadir Nuevo Mensajero</Button>
            </DialogFooter>
          </>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-6">
              <h3 className="font-semibold">{editingMessenger ? 'Editar Mensajero' : 'Añadir Nuevo Mensajero'}</h3>
              <div className="space-y-2">
                <Label htmlFor="messenger-name">Nombre</Label>
                <Input id="messenger-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Perez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar-url">URL del Avatar (Opcional)</Label>
                <Input id="avatar-url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://placehold.co/100x100.png" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="messenger-status">Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as MessengerStatus)}>
                  <SelectTrigger id="messenger-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Días Laborales</Label>
                <div className="grid grid-cols-4 gap-2">
                  {WEEKDAYS.map((day, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${index}`}
                        checked={availableWeekdays.includes(index)}
                        onCheckedChange={(checked) => {
                          setAvailableWeekdays(prev => 
                            checked ? [...prev, index] : prev.filter(d => d !== index)
                          );
                        }}
                      />
                      <Label htmlFor={`day-${index}`} className="text-sm font-normal">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Preferencia de Turno</Label>
                <RadioGroup value={shiftPreference} onValueChange={(v) => setShiftPreference(v as ShiftPreference)} className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="day" id="day-pref" />
                    <Label htmlFor="day-pref" className="font-normal flex items-center gap-1"><Sun className="h-4 w-4"/> Día</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="night" id="night-pref" />
                    <Label htmlFor="night-pref" className="font-normal flex items-center gap-1"><Moon className="h-4 w-4"/> Noche</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="any-pref" />
                    <Label htmlFor="any-pref" className="font-normal">Cualquiera</Label>
                  </div>
                </RadioGroup>
              </div>

              <DialogFooter className="pt-4">
                  <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={!name.trim()}>Guardar</Button>
              </DialogFooter>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
