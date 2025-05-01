
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft } from "lucide-react";
import { Territory } from "@/types/territory-types";
import TerritoryDetailExport from "@/components/statistics/TerritoryDetailExport";

interface TerritoryHeaderProps {
  territory: Territory;
  history: any[];
}

const TerritoryHeader = ({ territory, history }: TerritoryHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-2" 
          onClick={() => navigate("/estadisticas")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          Territorio: {territory?.name}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Zona: {territory?.zone?.name || "Sin zona asignada"}
        </p>
      </div>
      <TerritoryDetailExport territory={territory} history={history} />
    </div>
  );
};

export default TerritoryHeader;
