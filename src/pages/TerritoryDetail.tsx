
import React from "react";
import { useParams } from "react-router-dom";
import { useTerritoryDetail } from "@/hooks/useTerritoryDetail";
import TerritoryHeader from "@/components/territory/TerritoryHeader";
import TerritoryMap from "@/components/territory/TerritoryMap";
import TerritoryHistory from "@/components/territory/TerritoryHistory";
import TerritoryDetailLoader from "@/components/territory/TerritoryDetailLoader";
import TerritoryNotFound from "@/components/territory/TerritoryNotFound";

const TerritoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { territory, history, isLoading } = useTerritoryDetail(id);

  if (isLoading) {
    return <TerritoryDetailLoader />;
  }

  if (!territory) {
    return <TerritoryNotFound />;
  }

  return (
    <div className="space-y-6">
      <TerritoryHeader territory={territory} history={history} />
      
      {territory.google_maps_link && (
        <TerritoryMap 
          mapLink={territory.google_maps_link} 
          territoryName={territory.name} 
        />
      )}
      
      <TerritoryHistory history={history} />
    </div>
  );
};

export default TerritoryDetail;
