
import React from "react";
import { Link } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, ArrowRight } from "lucide-react";

interface OtherTerritory {
  id: string;
  name: string;
  token: string;
}

interface OtherTerritoriesListProps {
  territories: OtherTerritory[];
}

const OtherTerritoriesList: React.FC<OtherTerritoriesListProps> = ({ territories }) => {
  if (territories.length === 0) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-800 mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>Actualmente dispones de otro territorio asignado</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          {territories.map(territory => (
            <div key={territory.id} className="flex justify-between items-center">
              <span>{territory.name}</span>
              <Button 
                variant="outline" 
                size="sm"
                className="border-blue-300 hover:bg-blue-100"
                asChild
              >
                <Link to={`/territorio/${territory.token}`}>
                  Acceder <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default OtherTerritoriesList;
