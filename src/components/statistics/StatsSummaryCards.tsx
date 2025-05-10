
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TerritoryStatistics } from "@/types/territory-types";

interface StatsSummaryCardsProps {
  stats: TerritoryStatistics;
  isLoading: boolean;
}

const StatsSummaryCards: React.FC<StatsSummaryCardsProps> = ({ stats, isLoading }) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
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
            <div className="text-2xl font-bold">{stats.total}</div>
          )}
        </CardContent>
      </Card>

      <Card>
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
            <div className="text-2xl font-bold">{stats.assigned}</div>
          )}
        </CardContent>
      </Card>

      <Card>
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
            <div className="text-2xl font-bold">{stats.expired_territories}</div>
          )}
        </CardContent>
      </Card>

      <Card>
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
            <div className="text-2xl font-bold">{stats.available}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSummaryCards;
