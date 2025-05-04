import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { TerritorySafeData, TerritoryStatistics } from "@/types/territory-types";
import StatisticsExport from "@/components/statistics/StatisticsExport";
import { Separator } from "@/components/ui/separator";

const Statistics = () => {
  const [territories, setTerritories] = useState<TerritorySafeData[]>([]);
  const [filteredTerritories, setFilteredTerritories] = useState<TerritorySafeData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<TerritoryStatistics>({
    total_territories: 0,
    assigned_territories: 0,
    available_territories: 0,
    expired_territories: 0,
    territories_by_zone: [],
    total: 0,
    assigned: 0,
    available: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTerritories();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = territories.filter(
        (territory) =>
          territory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          territory.zone?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTerritories(filtered);
    } else {
      setFilteredTerritories(territories);
    }
  }, [searchTerm, territories]);

  const fetchTerritories = async () => {
    setIsLoading(true);
    try {
      // Fetch all territories
      const { data: territoriesData, error: territoriesError } = await supabase
        .from("territories")
        .select(`
          id, name, zone_id, google_maps_link, created_at, updated_at,
          zone:zones(id, name)
        `)
        .order("name");

      if (territoriesError) {
        console.error("Error fetching territories:", territoriesError);
        return;
      }

      // Fetch assigned territories to get last assigned date
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select("territory_id, assigned_at")
        .order("assigned_at", { ascending: false });

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        return;
      }

      // Create a map of territory_id to latest assigned date
      const lastAssignedMap = new Map();
      assignmentsData?.forEach((assignment) => {
        if (!lastAssignedMap.has(assignment.territory_id)) {
          lastAssignedMap.set(assignment.territory_id, assignment.assigned_at);
        }
      });

      // Get currently assigned territories
      const { data: currentlyAssigned, error: currentlyAssignedError } = await supabase
        .from("assigned_territories")
        .select("territory_id")
        .eq("status", "assigned");

      if (currentlyAssignedError) {
        console.error("Error fetching currently assigned territories:", currentlyAssignedError);
        return;
      }

      const assignedTerritoriesSet = new Set(
        currentlyAssigned?.map((item) => item.territory_id) || []
      );

      // Transform and combine the data
      const transformedTerritories = territoriesData.map((territory: any) => {
        // Handle the potential error in the zone field
        const zoneData = territory.zone && typeof territory.zone !== 'string' 
          ? territory.zone 
          : null;

        return {
          ...territory,
          zone: zoneData,
          last_assigned_at: lastAssignedMap.get(territory.id) || null,
        };
      }) as TerritorySafeData[];

      // Set territories with the transformed data
      setTerritories(transformedTerritories);
      setFilteredTerritories(transformedTerritories);

      // Calculate statistics
      setStats({
        total_territories: transformedTerritories.length,
        assigned_territories: assignedTerritoriesSet.size,
        available_territories: transformedTerritories.length - assignedTerritoriesSet.size,
        expired_territories: 0,
        territories_by_zone: [],
        total: transformedTerritories.length,
        assigned: assignedTerritoriesSet.size,
        available: transformedTerritories.length - assignedTerritoriesSet.size
      });
    } catch (error) {
      console.error("Error in fetchTerritories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (territoryId: string) => {
    navigate(`/estadisticas/${territoryId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Estadísticas de Territorios</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Visualiza y analiza información sobre los territorios.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Territorios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Territorios Asignados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{stats.assigned}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Territorios Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{stats.available}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar territorio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="w-full sm:w-auto">
            <StatisticsExport />
          </div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Territorio</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Asignación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Cargando territorios...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTerritories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      {searchTerm
                        ? "No se encontraron territorios coincidentes."
                        : "No hay territorios registrados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTerritories.map((territory) => (
                    <TableRow
                      key={territory.id}
                      className="cursor-pointer hover:bg-muted/60"
                      onClick={() => handleRowClick(territory.id)}
                    >
                      <TableCell className="font-medium">{territory.name}</TableCell>
                      <TableCell>{territory.zone?.name || "Sin zona"}</TableCell>
                      <TableCell>
                        {territory.last_assigned_at
                          ? "Ha sido asignado"
                          : "Nunca asignado"}
                      </TableCell>
                      <TableCell>
                        {territory.last_assigned_at
                          ? new Date(territory.last_assigned_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
