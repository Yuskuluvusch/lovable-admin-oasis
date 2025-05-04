
import React from "react";
import { useParams } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicTerritory } from "@/hooks/usePublicTerritory";
import TerritoryInfo from "@/components/territory/TerritoryInfo";
import TerritoryStatusAlerts from "@/components/territory/TerritoryStatusAlerts";
import OtherTerritoriesList from "@/components/territory/OtherTerritoriesList";
import TerritoryMapView from "@/components/territory/TerritoryMapView";

const PublicTerritory = () => {
  const { token } = useParams();
  const { loading, error, territoryData, otherTerritories } = usePublicTerritory(token);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Fecha no disponible";
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const getDaysRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container py-4">
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4 mb-2" />
        </div>
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!territoryData) {
    return (
      <div className="container py-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Territorio no encontrado</AlertTitle>
          <AlertDescription>El enlace proporcionado no es válido o ha expirado.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const daysRemaining = territoryData.expires_at ? getDaysRemaining(territoryData.expires_at) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container py-4">
        <TerritoryInfo 
          territoryName={territoryData.territory_name}
          publisherName={territoryData.publisher_name}
          dangerLevel={territoryData.danger_level}
          warnings={territoryData.warnings}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {territoryData.expires_at && (
            <>
              <Calendar className="h-4 w-4" />
              <span>Fecha de vencimiento: <span className="font-medium">{formatDate(territoryData.expires_at)}</span></span>
            </>
          )}
        </div>

        <TerritoryStatusAlerts 
          isExpired={territoryData.is_expired}
          expiryDate={territoryData.expires_at}
          daysRemaining={daysRemaining}
        />

        {territoryData.is_expired && otherTerritories.length > 0 && (
          <OtherTerritoriesList territories={otherTerritories} />
        )}
      </div>

      {!territoryData.is_expired && territoryData.google_maps_link && (
        <TerritoryMapView 
          googleMapsLink={territoryData.google_maps_link}
          territoryName={territoryData.territory_name}
        />
      )}
    </div>
  );
};

export default PublicTerritory;
