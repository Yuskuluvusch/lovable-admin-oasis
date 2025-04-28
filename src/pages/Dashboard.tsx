
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin } from "lucide-react";
import { TerritoryStatistics } from "@/types/territory-types";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [territoryStats, setTerritoryStats] = useState<TerritoryStatistics>({
    total: 0,
    assigned: 0,
    available: 0
  });

  // Get display name for the user, fallback to email or "Admin"
  const getDisplayName = () => {
    if (!currentUser) return "Admin";
    return currentUser.email || "Admin";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch admin count
        const { count: adminCount, error: adminError } = await supabase
          .from("administrators")
          .select("*", { count: "exact" });

        if (adminError) {
          console.error("Error fetching admin count:", adminError);
          return;
        }
        
        // Get total count of territories
        const { count: totalTerritories, error: totalError } = await supabase
          .from("territories")
          .select("*", { count: "exact" });
        
        if (totalError) {
          console.error("Error fetching territories count:", totalError);
          return;
        }

        // Get count of assigned territories
        const { count: assignedTerritories, error: assignedError } = await supabase
          .from("assigned_territories")
          .select("*", { count: "exact" })
          .eq("status", "assigned");
        
        if (assignedError) {
          console.error("Error fetching assigned territories:", assignedError);
          return;
        }

        setAdminCount(adminCount || 0);
        setTerritoryStats({
          total: totalTerritories || 0,
          assigned: assignedTerritories || 0,
          available: (totalTerritories || 0) - (assignedTerritories || 0)
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido, {getDisplayName()}. Aquí está tu resumen administrativo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="office-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{adminCount}</div>
            )}
          </CardContent>
        </Card>

        <Card className="office-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Territorios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{territoryStats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card className="office-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Territorios Asignados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{territoryStats.assigned}</div>
            )}
          </CardContent>
        </Card>

        <Card className="office-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Territorios Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{territoryStats.available}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="office-shadow">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-2">
                <p className="text-sm font-medium">Inicio de sesión</p>
                <p className="text-xs text-muted-foreground">
                  {getDisplayName()} • {new Date().toLocaleString()}
                </p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm font-medium">Sistema iniciado</p>
                <p className="text-xs text-muted-foreground">
                  Sistema • {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="office-shadow">
          <CardHeader>
            <CardTitle>Resumen del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-accent p-3">
                  <p className="text-xs font-medium text-muted-foreground">Versión</p>
                  <p className="text-sm font-medium">1.0.0</p>
                </div>
                <div className="rounded-lg bg-accent p-3">
                  <p className="text-xs font-medium text-muted-foreground">Última Actualización</p>
                  <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="rounded-lg bg-accent p-3">
                  <p className="text-xs font-medium text-muted-foreground">Servidor</p>
                  <p className="text-sm font-medium">Activo</p>
                </div>
                <div className="rounded-lg bg-accent p-3">
                  <p className="text-xs font-medium text-muted-foreground">Base de datos</p>
                  <p className="text-sm font-medium">Conectada</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
