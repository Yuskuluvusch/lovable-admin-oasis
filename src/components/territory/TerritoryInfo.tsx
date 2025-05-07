
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DangerLevelBadge from "@/components/territory/DangerLevelBadge";
import WarningsTooltip from "@/components/territory/WarningsTooltip";

interface TerritoryInfoProps {
  territoryName: string;
  publisherName: string;
  dangerLevel: string | null;
  warnings: string | null;
}

const TerritoryInfo: React.FC<TerritoryInfoProps> = ({
  territoryName,
  publisherName,
  dangerLevel,
  warnings
}) => {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Territorio: {territoryName}</h1>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Info className="h-4 w-4" />
            <span>Asignado a: <span className="font-medium">{publisherName}</span></span>
          </div>
          
          {dangerLevel && (
            <div className="mt-2">
              <DangerLevelBadge level={dangerLevel} />
            </div>
          )}
        </div>
        
        {warnings && (
          <div className="flex-shrink-0 max-w-md">
            <WarningsTooltip 
              warnings={warnings} 
              showAsTooltip={false} 
              variant="alert" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TerritoryInfo;
