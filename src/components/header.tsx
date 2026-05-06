import { LogOut, Truck } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
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


export function Header() {
  const { logout } = useAuth();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Truck className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold font-headline">Turno Maestro</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon">
                <LogOut className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que quieres salir?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tu sesión se cerrará y tendrás que volver a introducir el token de acceso.
                  <p className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-md text-sm font-medium">
                    ¡Importante! Recuerda hacer una copia de seguridad (Exportar > Backup) si has realizado cambios importantes.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={logout}>Salir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}
