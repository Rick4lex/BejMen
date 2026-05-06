// This is the root component that handles authentication routing.
// It will show a loading screen, the login page, or the main dashboard
// based on the authentication state provided by AuthProvider.
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Dashboard } from "@/components/dashboard";
import { Login } from "@/components/login";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
        <p className="text-lg">Verificando acceso...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Dashboard />;
}
