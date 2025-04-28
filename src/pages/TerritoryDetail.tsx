
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Territory, TerritoryHistory } from "@/types/territory-types";
import TerritoryDetailExport from "@/components/statistics/TerritoryDetailExport";

const TerritoryDetail = () => {
  const { territoryId } = useParams<{ territoryId: string }>();
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [history, setHistory] = useState<TerritoryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (territoryId) {
      fetchTerritoryDetails(territoryId);
    }
  }, [territoryId]);

  const fetchTerritoryDetails = async (id: string) => {
    try {
      setIsLoading(true);

      // Get territory details
      const { data: territoryData, error: territoryError } = await supabase
        .from("territories")
        .select(`
          *,
          zone:zones(id, name)
        `)
        .eq("id", id)
        .single();

      if (territoryError) throw territoryError;

      // Get all assignments history for this territory
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select(`
          id,
          territory_id,
          publisher_id,
          assigned_at,
          expires_at,
          status,
          publishers!assigned_territories_publisher_id_fkey(name)
        `)
        .eq("territory_id", id)
        .order("assigned_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Format the history data
      const formattedHistory = assignmentsData.map((assignment) => ({
        id: assignment.id,
        territory_id: assignment.territory_id,
        publisher_id: assignment.publisher_id,
        publisher_name: assignment.publishers?.name || "Desconocido",
        assigned_at: assignment.assigned_at,
        expires_at: assignment.expires_at,
        status: assignment.status,
      }));

      setTerritory(territoryData);
      setHistory(formattedHistory);
    } catch (error) {
      console.error("Error fetching territory details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información del territorio",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd MMM yyyy", { locale: es });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "assigned":
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Asignado
          </div>
        );
      case "returned":
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Devuelto
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Desconocido
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/estadisticas")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Estadísticas
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight mt-4">
            Territorio: {territory?.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Zona: {territory?.zone?.name || "Sin zona asignada"}
          </p>
        </div>
        {history.length > 0 && (
          <TerritoryDetailExport 
            territory={territory} 
            history={history}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de asignaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Este territorio no tiene historial de asignaciones
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Publicador</TableHead>
                    <TableHead>Fecha de asignación</TableHead>
                    <TableHead>Fecha de devolución</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.publisher_name}
                      </TableCell>
                      <TableCell>
                        {formatDate(record.assigned_at)}
                      </TableCell>
                      <TableCell>
                        {record.status === "returned"
                          ? formatDate(record.expires_at)
                          : "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {territory?.google_maps_link && (
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => window.open(territory.google_maps_link!, "_blank")}
              >
                Ver en Google Maps
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TerritoryDetail;
