
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, MapPin, Calendar, FileSpreadsheet } from "lucide-react";
import { Territory, TerritoryHistory, TerritorySafeData } from "@/types/territory-types";
import * as XLSX from 'xlsx';

const TerritoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [territory, setTerritory] = useState<TerritorySafeData | null>(null);
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
      const zoneData = data.zone && !data.zone.error 
        ? data.zone 
        : null;

      // Set territory with complete data
      const territoryWithData: TerritorySafeData = {
        ...data,
        zone: zoneData,
        last_assigned_at: assignments && assignments.length > 0 ? assignments[0].assigned_at : null,
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
          id, territory_id, publisher_id, assigned_at, expires_at, status, token,
          publishers:publishers!assigned_territories_publisher_id_fkey(name)
        `)
        .eq("territory_id", territoryId)
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Error fetching territory history:", error);
        return;
      }

      const historyData: TerritoryHistory[] = data.map((item) => ({
        id: item.id,
        territory_id: item.territory_id,
        publisher_id: item.publisher_id,
        publisher_name: item.publishers ? item.publishers.name : "Unknown",
        assigned_at: item.assigned_at,
        expires_at: item.expires_at,
        status: item.status,
      }));

      setHistory(historyData);
    } catch (error) {
      console.error("Error in fetchTerritoryHistory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!territory) return;

    // Prepare data for export
    const exportData = history.map(item => ({
      'Territorio': territory.name,
      'Publicador': item.publisher_name,
      'Fecha de Asignación': new Date(item.assigned_at).toLocaleDateString(),
      'Fecha de Expiración': item.expires_at ? new Date(item.expires_at).toLocaleDateString() : 'N/A',
      'Estado': item.status === 'assigned' ? 'Asignado' : (item.status === 'returned' ? 'Devuelto' : item.status),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Territorio
      { wch: 25 }, // Publicador
      { wch: 20 }, // Fecha de Asignación
      { wch: 20 }, // Fecha de Expiración
      { wch: 15 }, // Estado
    ];
    worksheet['!cols'] = columnWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Territorio ${territory.name}`);
    
    // Generate file and download
    XLSX.writeFile(workbook, `Historial_Territorio_${territory.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
            Territorio: {territory.name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Zona: {territory.zone?.name || "Sin zona asignada"}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportExcel}
          disabled={history.length === 0}
          className="w-full sm:w-auto"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar Historial
        </Button>
      </div>

      {territory.google_maps_link && (
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
                          {new Date(item.assigned_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {item.expires_at
                            ? new Date(item.expires_at).toLocaleDateString()
                            : "No definida"}
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
