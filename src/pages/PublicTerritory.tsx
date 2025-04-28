
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertTriangle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PublicTerritory = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [territoryData, setTerritoryData] = useState<{
    territory_name: string;
    google_maps_link: string | null;
    expires_at: string | null;
    publisher_name: string;
    is_expired: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchTerritoryByToken = async () => {
      if (!token) {
        setError("Token no proporcionado");
        setLoading(false);
        return;
      }

      try {
        // Using the correct syntax for joins with Supabase
        const { data, error: fetchError } = await supabase
          .from("assigned_territories")
          .select(`
            id, territory_id, publisher_id, expires_at, status, token,
            territories!assigned_territories_territory_id_fkey(name, google_maps_link),
            publishers!assigned_territories_publisher_id_fkey(name)
          `)
          .eq("token", token)
          .single();

        if (fetchError || !data) {
          console.error("Error fetching territory data:", fetchError);
          setError("Territorio no encontrado o enlace inválido.");
          setLoading(false);
          return;
        }

        // Check for data structure before accessing properties
        if (!data.territories || !data.publishers) {
          console.error("Missing territory or publisher data:", data);
          setError("Error en los datos del territorio.");
          setLoading(false);
          return;
        }

        const territory = data.territories;
        const publisher = data.publishers;
        
        const isExpired =
          !data.expires_at ||
          new Date(data.expires_at) < new Date() ||
          data.status !== "assigned";

        setTerritoryData({
          territory_name: territory.name,
          google_maps_link: territory.google_maps_link,
          expires_at: data.expires_at,
          publisher_name: publisher.name,
          is_expired: isExpired,
        });

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

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {territoryData.expires_at && (
            <>
              <Calendar className="h-4 w-4" />
              <span>Fecha de vencimiento: <span className="font-medium">{formatDate(territoryData.expires_at)}</span></span>
            </>
          )}
        </div>

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
      </div>

      {!territoryData.is_expired && territoryData.google_maps_link && (
        <div className="flex-1" style={{ height: "80vh" }}>
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
