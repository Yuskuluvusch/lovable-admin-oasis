
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Calendar, Map, AlertTriangle, Info } from "lucide-react";
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
        const { data, error: fetchError } = await supabase
          .from("assigned_territories")
          .select(`
            expires_at, 
            status,
            territory:territories!inner(name, google_maps_link),
            publisher:publishers!inner(name)
          `)
          .eq("token", token)
          .single();

        if (fetchError || !data) {
          setError("Territorio no encontrado o enlace inválido.");
          setLoading(false);
          return;
        }

        // Check if territory has expired
        const isExpired = 
          !data.expires_at || 
          new Date(data.expires_at) < new Date() || 
          data.status !== "assigned";

        setTerritoryData({
          territory_name: data.territory.name || "Territorio sin nombre",
          google_maps_link: data.territory.google_maps_link,
          expires_at: data.expires_at,
          publisher_name: data.publisher.name || "Sin asignar",
          is_expired: isExpired
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
      <div className="container py-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-2" />
        <Skeleton className="h-6 w-1/3 mb-8" />
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
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
      <div className="container py-8 max-w-4xl mx-auto">
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
    <div className="container py-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Territorio: {territoryData.territory_name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          <span>Asignado a: <span className="font-semibold">{territoryData.publisher_name}</span></span>
        </div>

        {territoryData.expires_at && (
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span>Fecha de vencimiento: <span className="font-semibold">{formatDate(territoryData.expires_at)}</span></span>
          </div>
        )}
      </div>

      {daysRemaining !== null && !territoryData.is_expired && (
        <Alert className={daysRemaining < 7 ? "border-amber-500 bg-amber-50 text-amber-800" : "border-green-500 bg-green-50 text-green-800"}>
          <Calendar className="h-4 w-4" />
          <AlertTitle>
            {daysRemaining === 0 
              ? "¡El territorio vence hoy!" 
              : `Faltan ${daysRemaining} días para el vencimiento`}
          </AlertTitle>
        </Alert>
      )}

      {territoryData.is_expired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Territorio caducado</AlertTitle>
          <AlertDescription>
            Este territorio ha expirado. Por favor, solicite otro territorio.
          </AlertDescription>
        </Alert>
      )}

      {!territoryData.is_expired && territoryData.google_maps_link && (
        <div className="border rounded-lg overflow-hidden mt-4">
          <h2 className="p-4 bg-muted font-medium flex items-center gap-2">
            <Map className="h-5 w-5" /> 
            Mapa del territorio
          </h2>
          <div className="aspect-[4/3] w-full">
            <iframe
              src={territoryData.google_maps_link}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa del territorio ${territoryData.territory_name}`}
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicTerritory;
