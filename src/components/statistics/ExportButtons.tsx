
import React from "react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardFooter } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { Download } from "lucide-react";

interface ExportButtonsProps {
  onExportAssignments: () => void;
  onExportHistory: () => void;
  isLoading: boolean;
  exporting: boolean;
  selectedTerritory: string | "all";
  selectedPublisher: string | "all";
  dateRange: DateRange | undefined;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportAssignments,
  onExportHistory,
  isLoading,
  exporting,
  selectedTerritory,
  selectedPublisher,
  dateRange,
}) => {
  return (
    <>
      <CardFooter>
        <Button 
          onClick={onExportAssignments} 
          disabled={exporting || isLoading}
          className="w-full"
        >
          {exporting ? "Exportando..." : "Exportar Asignaciones"} <Download className="ml-2" />
        </Button>
      </CardFooter>
      <CardFooter className="flex-col items-start border-t pt-6">
        <CardDescription className="mb-4">
          Exporta el historial completo de asignaciones de territorios.
        </CardDescription>
        <Button 
          onClick={onExportHistory} 
          disabled={exporting || isLoading}
          className="w-full"
        >
          {exporting ? "Exportando..." : "Exportar Historial"} <Download className="ml-2" />
        </Button>
      </CardFooter>
    </>
  );
};

export default ExportButtons;
