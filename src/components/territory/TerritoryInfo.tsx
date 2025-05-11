
import React from "react";
import { Info } from "lucide-react";
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
      <div className="mb-2">
        <h1 className="text-xl font-semibold mb-1">Territorio: {territoryName}</h1>
        
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Asignado a: <span className="font-medium">{publisherName}</span>
          </span>
          
          {dangerLevel && (
            <DangerLevelBadge level={dangerLevel} showText={false} size="sm" />
          )}
        </div>
      </div>
      
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
