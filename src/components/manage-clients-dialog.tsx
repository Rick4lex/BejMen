import { useState, useMemo, useRef } from 'react';
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
import { PlusCircle, Edit, Trash2, Search, Upload, Download } from 'lucide-react';
import type { Client } from '@/lib/types';
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
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';


interface ManageClientsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ManageClientsDialog({ isOpen, onOpenChange }: ManageClientsDialogProps) {
  const { clients, setClients } = useData();
  const { toast } = useToast();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const filteredClients = useMemo(() => {
    return clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleAddNew = () => {
    setEditingClient(null);
    setClientName('');
    setIsFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setClientName(client.name);
    setIsFormOpen(true);
  };

  const handleDelete = (clientId: string) => {
    setClients(clients.filter((c) => c.id !== clientId));
  };

  const handleSave = () => {
    if (editingClient) {
      setClients(clients.map((c) => (c.id === editingClient.id ? { ...c, name: clientName } : c)));
    } else {
      setClients([...clients, { id: uuidv4(), name: clientName }]);
    }
    setIsFormOpen(false);
    setEditingClient(null);
    setClientName('');
  };
  
  const handleExportCSV = () => {
    if (clients.length === 0) {
      toast({ variant: "destructive", title: "No hay clientes para exportar." });
      return;
    }
    const headers = ["id", "name"];
    const rows = clients.map(c => [c.id, `"${c.name.replace(/"/g, '""')}"`]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes_backup.csv");
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
        
        if (headers[0] !== 'id' || headers[1] !== 'name') {
          throw new Error("El archivo CSV debe tener las columnas 'id' y 'name'.");
        }

        const newClients: Client[] = rows.map(row => {
          const [id, name] = row.split(',');
          return { id, name: name.replace(/"/g, '') };
        });
        
        setClients(newClients);
        toast({ title: "Importación Exitosa", description: `${newClients.length} clientes importados.` });

      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error de Importación",
          description: error instanceof Error ? error.message : "No se pudo procesar el archivo CSV.",
        });
      } finally {
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gestionar Clientes</DialogTitle>
        </DialogHeader>
        
        {!isFormOpen ? (
          <>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                />
            </div>
            <ScrollArea className="h-72">
              <div className="space-y-2 pr-4">
                {filteredClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{client.name}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(client)}>
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
                              Esta acción no se puede deshacer. Esto eliminará permanentemente el cliente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(client.id)} className="bg-[#B95A5A] hover:bg-[#B95A5A]/90 font-bold">Eliminar</AlertDialogAction>
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
                <Button onClick={handleAddNew} className="w-full"><PlusCircle />Añadir Nuevo Cliente</Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold">{editingClient ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</h3>
            <div>
              <Label htmlFor="client-name">Nombre del Cliente</Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Global Exports"
              />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!clientName.trim()}>Guardar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
