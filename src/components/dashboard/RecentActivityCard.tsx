
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface RecentActivityCardProps {
  displayName: string;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ displayName }) => {
  return (
    <Card className="office-shadow">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-b pb-2">
            <p className="text-sm font-medium">Inicio de sesión</p>
            <p className="text-xs text-muted-foreground">
              {displayName} • {new Date().toLocaleString()}
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
  );
};

export default RecentActivityCard;
