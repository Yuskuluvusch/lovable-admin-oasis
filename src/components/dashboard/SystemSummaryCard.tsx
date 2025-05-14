
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

const SystemSummaryCard: React.FC = () => {
  return (
    <Card className="office-shadow">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Resumen del Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-lg bg-accent p-3">
              <p className="text-xs font-medium text-muted-foreground">Versión</p>
              <p className="text-sm font-medium">1.1.0</p>
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
  );
};

export default SystemSummaryCard;
