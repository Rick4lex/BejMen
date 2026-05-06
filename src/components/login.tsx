"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Truck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function Login() {
  const [token, setToken] = useState("");
  const { login, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(token);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Truck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Turno Maestro</CardTitle>
          <CardDescription>Por favor, introduce tu token de acceso para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token de Acceso</Label>
              <Input
                id="token"
                type="password"
                placeholder="••••••••••••"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            {error && (
               <Alert variant="destructive">
                  <AlertTitle>Error de Acceso</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Button type="submit" className="w-full">
              Acceder
            </Button>
          </form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
                Contacta al administrador si no tienes un token de acceso.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
