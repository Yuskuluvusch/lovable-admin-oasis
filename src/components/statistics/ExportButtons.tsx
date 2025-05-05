
import React from "react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardFooter } from "@/components/ui/card";

interface ExportButtonsProps {
  onExportAssignments: () => void;
  onExportHistory: () => void;
  isLoading: boolean;
  exporting: boolean;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportAssignments,
  onExportHistory,
  isLoading,
  exporting,
}) => {
  return (
    <>
      <CardFooter>
        <Button 
          onClick={onExportAssignments} 
          disabled={exporting || isLoading}
          className="w-full"
        >
          {exporting ? "Exportando..." : "Exportar Asignaciones"}
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
          {exporting ? "Exportando..." : "Exportar Historial"}
        </Button>
      </CardFooter>
    </>
  );
};

export default ExportButtons;
