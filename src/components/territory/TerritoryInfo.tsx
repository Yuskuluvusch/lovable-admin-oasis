
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
      <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-2">
        <h1 className="text-xl font-semibold">Territorio: {territoryName}</h1>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Asignado a: <span className="font-medium">{publisherName}</span></span>
        </div>
      </div>
      
      {dangerLevel && (
        <div className="mb-3">
          <DangerLevelBadge level={dangerLevel} />
        </div>
      )}

      {warnings && (
        <div className="mb-2">
          <WarningsTooltip 
            warnings={warnings} 
            showAsTooltip={false} 
            variant="alert" 
          />
        </div>
      )}
    </div>
  );
};

export default TerritoryInfo;
