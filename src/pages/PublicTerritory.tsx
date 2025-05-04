
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, Info, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import DangerLevelBadge from "@/components/territory/DangerLevelBadge";
import WarningsTooltip from "@/components/territory/WarningsTooltip";

interface OtherTerritory {
  id: string;
  name: string;
  token: string;
}

const PublicTerritory = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [territoryData, setTerritoryData] = useState<{
    territory_name: string;
    google_maps_link: string | null;
    danger_level: string | null;
    warnings: string | null;
    expires_at: string | null;
    publisher_name: string;
    publisher_id: string;
    is_expired: boolean;
  } | null>(null);
  const [otherTerritories, setOtherTerritories] = useState<OtherTerritory[]>([]);

  useEffect(() => {
    const fetchTerritoryByToken = async () => {
      if (!token) {
        setError("Token no proporcionado");
        setLoading(false);
        return;
      }

      try {
        // First, fetch the assignment with the given token
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("assigned_territories")
          .select("id, territory_id, publisher_id, expires_at, status, token, returned_at")
          .eq("token", token)
          .single();

        if (assignmentError || !assignmentData) {
          console.error("Error fetching assignment data:", assignmentError);
          setError("Territorio no encontrado o enlace inválido.");
          setLoading(false);
          return;
        }

        // Then fetch the territory and publisher details separately
        const [territoryResult, publisherResult] = await Promise.all([
          supabase
            .from("territories")
            .select("name, google_maps_link, danger_level, warnings")
            .eq("id", assignmentData.territory_id)
            .single(),
          supabase
            .from("publishers")
            .select("name")
            .eq("id", assignmentData.publisher_id)
            .single()
        ]);

        if (territoryResult.error || !territoryResult.data) {
          console.error("Error fetching territory:", territoryResult.error);
          setError("Error al cargar datos del territorio");
          setLoading(false);
          return;
        }

        if (publisherResult.error || !publisherResult.data) {
          console.error("Error fetching publisher:", publisherResult.error);
          setError("Error al cargar datos del publicador");
          setLoading(false);
          return;
        }

        const isExpired =
          !assignmentData.expires_at ||
          new Date(assignmentData.expires_at) < new Date() ||
          assignmentData.status !== "assigned" ||
          assignmentData.returned_at !== null;

        setTerritoryData({
          territory_name: territoryResult.data.name,
          google_maps_link: territoryResult.data.google_maps_link,
          danger_level: territoryResult.data.danger_level,
          warnings: territoryResult.data.warnings,
          expires_at: assignmentData.expires_at,
          publisher_name: publisherResult.data.name,
          publisher_id: assignmentData.publisher_id,
          is_expired: isExpired,
        });

        // If the territory is expired, check for other active territories for this publisher
        if (isExpired) {
          const { data: otherAssignments, error: otherAssignmentsError } = await supabase
            .from("assigned_territories")
            .select(`
              id, token, territory_id,
              territories(id, name)
            `)
            .eq("publisher_id", assignmentData.publisher_id)
            .eq("status", "assigned")
            .is("returned_at", null)
            .gt("expires_at", new Date().toISOString())
            .neq("token", token);
          
          if (!otherAssignmentsError && otherAssignments && otherAssignments.length > 0) {
            const validTerritories = otherAssignments
              .filter(assignment => assignment.territories && typeof assignment.territories !== 'string')
              .map(assignment => {
                const territoryData = assignment.territories as { id: string; name: string };
                return {
                  id: territoryData.id,
                  name: territoryData.name,
                  token: assignment.token
                };
              });
            
            setOtherTerritories(validTerritories);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching territory:", err);
        setError("Error al cargar datos del territorio");
        setLoading(false);
      }
    };

    fetchTerritoryByToken();
  }, [token]);

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
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-2">
          <h1 className="text-xl font-semibold">Territorio: {territoryData.territory_name}</h1>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Asignado a: <span className="font-medium">{territoryData.publisher_name}</span></span>
          </div>
        </div>
        
        {territoryData.danger_level && (
          <div className="mb-3">
            <DangerLevelBadge level={territoryData.danger_level} />
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {territoryData.expires_at && (
            <>
              <Calendar className="h-4 w-4" />
              <span>Fecha de vencimiento: <span className="font-medium">{formatDate(territoryData.expires_at)}</span></span>
            </>
          )}
        </div>

        {territoryData.warnings && (
          <div className="mb-4">
            <WarningsTooltip 
              warnings={territoryData.warnings} 
              showAsTooltip={false} 
              variant="alert" 
            />
          </div>
        )}

        {daysRemaining !== null && !territoryData.is_expired && (
          <Alert className={`${daysRemaining < 7 ? "border-amber-500 bg-amber-50 text-amber-800" : "border-green-500 bg-green-50 text-green-800"} mb-4`}>
            <Calendar className="h-4 w-4" />
            <AlertTitle>
              {daysRemaining === 0 
                ? "¡El territorio vence hoy!" 
                : `Faltan ${daysRemaining} días para el vencimiento`}
            </AlertTitle>
          </Alert>
        )}

        {territoryData.is_expired && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Territorio caducado</AlertTitle>
            <AlertDescription>
              Este territorio ha expirado. Por favor, solicite otro territorio.
            </AlertDescription>
          </Alert>
        )}
        
        {territoryData.is_expired && otherTerritories.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-800 mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Actualmente dispones de otro territorio asignado</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                {otherTerritories.map(territory => (
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
        )}
      </div>

      {!territoryData.is_expired && territoryData.google_maps_link && (
        <div className="w-full h-[80vh]">
          <iframe
            src={territoryData.google_maps_link}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title={`Mapa del territorio ${territoryData.territory_name}`}
          />
        </div>
      )}
    </div>
  );
};

export default PublicTerritory;
