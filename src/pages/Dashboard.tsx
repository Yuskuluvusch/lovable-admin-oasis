
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardStatCards from "@/components/dashboard/DashboardStatCards";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import SystemSummaryCard from "@/components/dashboard/SystemSummaryCard";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { adminCount, isLoading, territoryStats } = useDashboardData();

  // Get display name for the user, fallback to email or "Admin"
  const getDisplayName = () => {
    if (!currentUser) return "Admin";
    return currentUser.email || "Admin";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Bienvenido, {getDisplayName()}. Aquí está tu resumen administrativo.
        </p>
      </div>

      <DashboardStatCards 
        adminCount={adminCount}
        isLoading={isLoading}
        territoryStats={territoryStats}
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <RecentActivityCard displayName={getDisplayName()} />
        <SystemSummaryCard />
      </div>
    </div>
  );
};

export default Dashboard;
