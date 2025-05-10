
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TerritoryStatistics } from "@/types/territory-types";

interface DashboardStatCardsProps {
  adminCount: number | null;
  isLoading: boolean;
  territoryStats: TerritoryStatistics;
}

const DashboardStatCards: React.FC<DashboardStatCardsProps> = ({ 
  adminCount, 
  isLoading, 
  territoryStats 
}) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
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
            Territorios Expirados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-red-600">{territoryStats.expired_territories}</div>
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
  );
};

export default DashboardStatCards;
