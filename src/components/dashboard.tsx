import { Header } from "@/components/header";
import { DashboardClient } from "@/components/dashboard-client";

export function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <DashboardClient />
      </main>
    </div>
  );
}
