
import React from "react";

interface TerritoryMapViewProps {
  googleMapsLink: string;
  territoryName: string;
}

const TerritoryMapView: React.FC<TerritoryMapViewProps> = ({ 
  googleMapsLink,
  territoryName
}) => {
  if (!googleMapsLink) {
    return (
      <div className="flex items-center justify-center h-[50vh] bg-gray-100">
        <p className="text-gray-500">Este territorio no tiene un mapa asociado.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[80vh]">
      <iframe
        src={googleMapsLink}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        title={`Mapa del territorio ${territoryName}`}
      />
    </div>
  );
};

export default TerritoryMapView;
