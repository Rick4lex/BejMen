"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAiSuggestions, type SuggestShiftAssignmentsOutput } from "@/app/actions";
import { ScrollArea } from "./ui/scroll-area";
import type { Messenger } from "@/lib/types";

const formSchema = z.object({
  messengerAvailability: z
    .string()
    .min(10, { message: "Por favor, describe la disponibilidad de los mensajeros con más detalle (al menos 10 caracteres)." }),
  shiftRequirements: z
    .string()
    .min(10, { message: "Por favor, describe los requisitos de los turnos con más detalle (al menos 10 caracteres)." }),
  otherConstraints: z.string().optional(),
});

type AiSuggestionDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  messengers: Messenger[];
};

export function AiSuggestionDialog({ isOpen, onOpenChange, messengers }: AiSuggestionDialogProps) {
  const { toast } = useToast();
  const [result, setResult] = useState<SuggestShiftAssignmentsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      messengerAvailability: "",
      shiftRequirements: "",
      otherConstraints: "",
    },
  });

  useEffect(() => {
    if (isOpen && messengers.length > 0) {
      const messengerNames = messengers.map((m) => m.name).join(", ");
      const availabilityText = `Mensajeros actuales: ${messengerNames}. Describe su disponibilidad semanal y cualquier restricción.`;
      form.setValue('messengerAvailability', availabilityText);
    }
  }, [isOpen, messengers, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);

    const response = await getAiSuggestions(values);
    setIsLoading(false);
    if (response.success && response.data) {
      setResult(response.data);
      toast({
        title: "Sugerencias de IA Generadas",
        description: "Revisa las asignaciones de turnos sugeridas a continuación.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error al Generar Sugerencias",
        description: response.error || "Ocurrió un error inesperado.",
      });
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        form.reset();
        setResult(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="text-primary" />
            Sugerencias de Turnos con IA
          </DialogTitle>
          <DialogDescription>
            Proporciona detalles sobre tus necesidades de programación y nuestra IA sugerirá asignaciones de turnos óptimas.
          </DialogDescription>
        </DialogHeader>
        
        {result ? (
          <div className="py-4">
            <h3 className="font-bold text-lg mb-2">Asignaciones Sugeridas</h3>
            <ScrollArea className="h-40 rounded-md border p-4 bg-muted/50">
                <pre className="text-sm whitespace-pre-wrap font-body">{result.suggestedAssignments}</pre>
            </ScrollArea>
             <h3 className="font-bold text-lg mt-4 mb-2">Justificación</h3>
             <ScrollArea className="h-28 rounded-md border p-4 bg-muted/50">
                <p className="text-sm">{result.reasoning}</p>
             </ScrollArea>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="messengerAvailability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidad de Mensajeros</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Juan está disponible de Lun-Vie, 8am-5pm. María prefiere turnos nocturnos. Carlos tiene los miércoles libres."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shiftRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos de los Turnos</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Se necesitan 2 turnos de mañana para la ruta del centro. Un turno de noche para recogida en el aeropuerto."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="otherConstraints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Otras Restricciones (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Máximo 40 horas por mensajero. Priorizar mensajeros con experiencia para el cliente X."
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        <DialogFooter>
          {result ? (
              <Button onClick={() => { form.reset(); setResult(null); }}>
                Hacer una Nueva Sugerencia
              </Button>
          ) : (
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Obtener Sugerencias"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
