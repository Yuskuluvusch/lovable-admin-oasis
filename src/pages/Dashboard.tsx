
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido, {currentUser?.name}. Aquí está tu resumen administrativo.
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
            <div className="text-2xl font-bold">2</div>
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
                  {currentUser?.name} • {new Date().toLocaleString()}
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
