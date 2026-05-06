"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { format } from 'date-fns';
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { Shift, Messenger, Client } from "@/lib/types";

const formSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "La hora de ingreso debe estar en formato HH:mm."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "La hora de salida debe estar en formato HH:mm."),
  clientId: z.string().min(1, "El cliente es obligatorio."),
  messengerId: z.string().optional(),
  notes: z.string().max(1000, "Las notas deben tener 1000 caracteres o menos.").optional(),
});

type ShiftFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: Omit<Shift, "id">) => void;
  messengers: Messenger[];
  clients: Client[];
  shift: Shift | null;
  selectedDate: Date;
  prefilledMessengerId?: string | null;
};

export function ShiftFormDialog({
  isOpen,
  onOpenChange,
  onSave,
  messengers,
  clients,
  shift,
  selectedDate,
  prefilledMessengerId,
}: ShiftFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: "09:00",
      endTime: "17:00",
      clientId: "",
      messengerId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (shift) {
      form.reset({
        startTime: shift.startTime,
        endTime: shift.endTime,
        clientId: shift.clientId,
        messengerId: shift.messengerId || "",
        notes: shift.notes || "",
      });
    } else {
       form.reset({
        startTime: "09:00",
        endTime: "17:00",
        clientId: "",
        messengerId: prefilledMessengerId || "",
        notes: "",
      });
    }
  }, [shift, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave({
      ...values,
      date: format(shift?.date ? new Date(shift.date + 'T00:00:00') : selectedDate, 'yyyy-MM-dd'),
      notes: values.notes || '',
      messengerId: values.messengerId === "unassigned" ? undefined : values.messengerId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{shift ? "Editar Turno" : "Añadir Turno"}</DialogTitle>
          <DialogDescription className="capitalize">
            {shift ? "Actualiza los detalles de este turno." : `Añadiendo un nuevo turno para el ${format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Ingreso</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Salida</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="messengerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensajero (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Asigna un mensajero" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                      {messengers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade cualquier nota relevante para este turno..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                </Button>
                <Button type="submit">Guardar Turno</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
