
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TerritoryMapProps {
  mapLink: string;
  territoryName: string;
}

const TerritoryMap = ({ mapLink, territoryName }: TerritoryMapProps) => {
  if (!mapLink) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl">Mapa del Territorio</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[60vh] sm:h-[80vh]">
          <iframe
            src={mapLink}
            title={`Mapa del territorio ${territoryName}`}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TerritoryMap;
