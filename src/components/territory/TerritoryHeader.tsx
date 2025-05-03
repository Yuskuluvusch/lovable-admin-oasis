
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Territory, TerritoryHistory } from "@/types/territory-types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import DangerLevelBadge from "@/components/territory/DangerLevelBadge";
import WarningsTooltip from "@/components/territory/WarningsTooltip";

interface TerritoryHeaderProps {
  territory: Territory;
  history: TerritoryHistory[];
}

const TerritoryHeader: React.FC<TerritoryHeaderProps> = ({ territory, history }) => {
  const currentAssignment = history.length > 0 ? history[0] : null;
  
  const formatDate = (date: string | null) => {
    if (!date) return "No disponible";
    return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between">
          <CardTitle className="text-2xl">{territory.name}</CardTitle>
          {territory.zone && (
            <Badge variant="outline" className="text-sm">
              Zona: {territory.zone.name}
            </Badge>
          )}
        </div>
        <CardDescription>
          <div className="flex flex-wrap gap-x-4 items-center mt-1">
            <div>
              Creado: {formatDate(territory.created_at)}
            </div>
            {territory.last_assigned_at && (
              <div className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center">
                      <span className="mr-1">Última asignación: {formatDate(territory.last_assigned_at)}</span>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fecha en que este territorio fue asignado por última vez</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 items-center">
          {territory.danger_level && (
            <DangerLevelBadge level={territory.danger_level} />
          )}
          
          {territory.warnings && (
            <WarningsTooltip warnings={territory.warnings} />
          )}
          
          {currentAssignment && (
            <div className="ml-auto">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">
                Asignado a: {currentAssignment.publisher_name}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TerritoryHeader;
