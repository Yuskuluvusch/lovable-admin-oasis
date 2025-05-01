
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TerritoryNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-8">
      <p className="text-lg text-muted-foreground">Territorio no encontrado.</p>
      <Button onClick={() => navigate("/estadisticas")} variant="outline" className="mt-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Estadísticas
      </Button>
    </div>
  );
};

export default TerritoryNotFound;
