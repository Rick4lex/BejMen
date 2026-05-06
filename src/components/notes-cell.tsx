"use client"

import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NotesCellProps {
  note: string;
  onSave: (newNote: string) => void;
}

export function NotesCell({ note, onSave }: NotesCellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState(note);

    const handleOpen = () => {
        setCurrentNote(note);
        setIsOpen(true);
    }
    
    const handleSave = () => {
        onSave(currentNote);
        setIsOpen(false);
    }

    return (
        <>
            <Button variant="outline" size="sm" onClick={handleOpen} className="w-full">
                Ver/Editar
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl flex flex-col h-[600px]">
                    <DialogHeader>
                        <DialogTitle>Nota del Turno</DialogTitle>
                        <DialogDescription>
                            Puedes usar Markdown para dar formato. Ej: **negrita**, *cursiva*, - listas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                        <div className="space-y-2 flex flex-col">
                            <h4 className="font-semibold">Editar</h4>
                             <Textarea 
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                maxLength={1000}
                                className="flex-grow h-full resize-none"
                            />
                            <div className={cn("text-xs text-right pr-2", currentNote.length > 1000 ? 'text-destructive' : 'text-muted-foreground')}>
                                {currentNote.length} / 1000
                            </div>
                        </div>

                        <div className="space-y-2 flex flex-col">
                             <h4 className="font-semibold">Vista Previa</h4>
                             <ScrollArea className="h-full rounded-md border p-4 flex-grow">
                                 <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                                    {currentNote || "Sin contenido."}
                                 </ReactMarkdown>
                             </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={currentNote.length > 1000}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
