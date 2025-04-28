
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get display name for the user, fallback to email or "Admin"
  const getDisplayName = () => {
    if (!currentUser) return "Admin";
    return currentUser.email || "Admin";
  };

  useEffect(() => {
    const fetchAdminCount = async () => {
      try {
        setIsLoading(true);
        const { count, error } = await supabase
          .from("administrators")
          .select("*", { count: "exact" });

        if (error) {
          console.error("Error fetching admin count:", error);
          return;
        }

        setAdminCount(count || 0);
      } catch (error) {
        console.error("Error fetching admin count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminCount();
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
              Usuarios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>

        <Card className="office-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accesos Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>

        <Card className="office-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm font-medium">Activo</span>
            </div>
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
