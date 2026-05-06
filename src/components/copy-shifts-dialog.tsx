"use client";

import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";

type CopyShiftsDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sourceDate: Date;
  onCopy: (destinationDate: Date) => void;
  shiftsOnSourceDate: number;
};

export function CopyShiftsDialog({
  isOpen,
  onOpenChange,
  sourceDate,
  onCopy,
  shiftsOnSourceDate
}: CopyShiftsDialogProps) {
  const [destinationDate, setDestinationDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const handleCopyClick = () => {
    if (!destinationDate) {
        toast({
            variant: "destructive",
            title: "Sin Fecha de Destino",
            description: "Por favor, selecciona una fecha a la que copiar los turnos.",
        });
        return;
    }
    onCopy(destinationDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copiar Turnos del Día</DialogTitle>
          <DialogDescription>
            Copiar los {shiftsOnSourceDate} turnos del <strong className="capitalize">{format(sourceDate, "d 'de' MMMM, yyyy", { locale: es })}</strong> a otra fecha.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
            <Calendar
                mode="single"
                selected={destinationDate}
                onSelect={setDestinationDate}
                disabled={(date) => date < new Date("1900-01-01")}
                initialFocus
                locale={es}
            />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleCopyClick} disabled={!destinationDate}>
            Copiar Turnos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
