
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, MapPin, Calendar } from "lucide-react";
import { TerritoryHistory, Territory } from "@/types/territory-types";
import TerritoryDetailExport from "@/components/statistics/TerritoryDetailExport";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TerritoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [history, setHistory] = useState<TerritoryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTerritoryDetails(id);
      fetchTerritoryHistory(id);
    }
  }, [id]);

  const fetchTerritoryDetails = async (territoryId: string) => {
    try {
      const { data, error } = await supabase
        .from("territories")
        .select(`
          id, name, zone_id, google_maps_link, created_at, updated_at,
          zone:zones(id, name)
        `)
        .eq("id", territoryId)
        .single();

      if (error) {
        console.error("Error fetching territory details:", error);
        return;
      }

      // Find the last assigned date
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select("assigned_at")
        .eq("territory_id", territoryId)
        .order("assigned_at", { ascending: false })
        .limit(1);

      if (assignmentsError) {
        console.error("Error fetching assignment history:", assignmentsError);
        return;
      }

      // Handle the potential error in the zone field
      const zoneData = data.zone && typeof data.zone !== 'string'
        ? data.zone 
        : null;

      // Set territory with complete data
      const territoryWithData: Territory = {
        ...data,
        zone: zoneData,
        last_assigned_at: assignments && assignments.length > 0 ? assignments[0].assigned_at : null,
        last_returned_at: null // This will be updated if needed
      };

      setTerritory(territoryWithData);
    } catch (error) {
      console.error("Error in fetchTerritoryDetails:", error);
    }
  };

  const fetchTerritoryHistory = async (territoryId: string) => {
    try {
      const { data, error } = await supabase
        .from("assigned_territories")
        .select(`
          id, territory_id, publisher_id, assigned_at, expires_at, status, token, returned_at,
          publishers:publishers!assigned_territories_publisher_id_fkey(name)
        `)
        .eq("territory_id", territoryId)
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Error fetching territory history:", error);
        return;
      }

      const historyData: TerritoryHistory[] = data.map((item: any) => ({
        id: item.id,
        territory_id: item.territory_id,
        publisher_id: item.publisher_id,
        publisher_name: item.publishers ? item.publishers.name : "Unknown",
        assigned_at: item.assigned_at,
        expires_at: item.expires_at,
        returned_at: item.returned_at,
        status: item.status,
      }));

      setHistory(historyData);
    } catch (error) {
      console.error("Error in fetchTerritoryHistory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd MMM yyyy", { locale: es });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!territory) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">Territorio no encontrado.</p>
        <Button onClick={() => navigate("/estadisticas")} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Estadísticas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2" 
            onClick={() => navigate("/estadisticas")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Territorio: {territory?.name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Zona: {territory?.zone?.name || "Sin zona asignada"}
          </p>
        </div>
        <TerritoryDetailExport territory={territory} history={history} />
      </div>

      {territory?.google_maps_link && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl">Mapa del Territorio</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full h-[60vh] sm:h-[80vh]">
              <iframe
                src={territory.google_maps_link}
                title={`Mapa del territorio ${territory.name}`}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Asignaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Este territorio nunca ha sido asignado.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Publicador</TableHead>
                      <TableHead>Fecha de Asignación</TableHead>
                      <TableHead>Fecha de Expiración</TableHead>
                      <TableHead>Fecha de Devolución</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.publisher_name}
                        </TableCell>
                        <TableCell>
                          {formatDate(item.assigned_at)}
                        </TableCell>
                        <TableCell>
                          {item.expires_at
                            ? formatDate(item.expires_at)
                            : "No definida"}
                        </TableCell>
                        <TableCell>
                          {item.returned_at
                            ? formatDate(item.returned_at)
                            : "No devuelto"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              item.status === "assigned"
                                ? "bg-green-100 text-green-800"
                                : item.status === "returned"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.status === "assigned"
                              ? "Asignado"
                              : item.status === "returned"
                              ? "Devuelto"
                              : item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TerritoryDetail;
