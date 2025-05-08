
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { TerritorySafeData, TerritoryStatistics } from "@/types/territory-types";
import StatisticsExport from "@/components/statistics/StatisticsExport";

const Statistics = () => {
  const [territories, setTerritories] = useState<TerritorySafeData[]>([]);
  const [filteredTerritories, setFilteredTerritories] = useState<TerritorySafeData[]>([]);
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
    setFilteredTerritories(territories);
  }, [territories]);

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

      // Fetch assigned territories to get last assigned date and expiration date
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select("territory_id, assigned_at, expires_at, status, returned_at")
        .order("assigned_at", { ascending: false });

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        return;
      }

      // Create maps for latest assignment data
      const lastAssignedMap = new Map();
      const expiryDateMap = new Map();
      const assignedStatusMap = new Map();
      assignmentsData?.forEach((assignment) => {
        if (!lastAssignedMap.has(assignment.territory_id)) {
          lastAssignedMap.set(assignment.territory_id, assignment.assigned_at);
          expiryDateMap.set(assignment.territory_id, assignment.expires_at);
          assignedStatusMap.set(assignment.territory_id, {
            status: assignment.status,
            returned_at: assignment.returned_at,
            expires_at: assignment.expires_at
          });
        }
      });

      // Get currently assigned territories
      const { data: currentlyAssigned, error: currentlyAssignedError } = await supabase
        .from("assigned_territories")
        .select("territory_id, expires_at, status, returned_at");

      if (currentlyAssignedError) {
        console.error("Error fetching currently assigned territories:", currentlyAssignedError);
        return;
      }

      // Create a set of assigned territory IDs and count expired ones
      const assignedTerritoriesSet = new Set();
      const expiredTerritoriesSet = new Set();
      const now = new Date();

      if (currentlyAssigned) {
        currentlyAssigned.forEach(item => {
          if (item.status === "assigned" && !item.returned_at) {
            // Check if it's expired
            if (item.expires_at && new Date(item.expires_at) < now) {
              expiredTerritoriesSet.add(item.territory_id);
            } else {
              assignedTerritoriesSet.add(item.territory_id);
            }
          }
        });
      }

      // Transform and combine the data
      const transformedTerritories = territoriesData.map((territory: any) => {
        // Handle the potential error in the zone field
        const zoneData = territory.zone && typeof territory.zone !== 'string' 
          ? territory.zone 
          : null;

        // Get assignment status info
        const assignmentInfo = assignedStatusMap.get(territory.id);
        let status = "available";
        
        if (assignmentInfo && !assignmentInfo.returned_at) {
          if (assignmentInfo.expires_at && new Date(assignmentInfo.expires_at) < now) {
            status = "expired";
          } else {
            status = "assigned";
          }
        }

        return {
          ...territory,
          zone: zoneData,
          last_assigned_at: lastAssignedMap.get(territory.id) || null,
          status: status,
          expires_at: expiryDateMap.get(territory.id) || null
        };
      }) as TerritorySafeData[];

      // Set territories with the transformed data
      setTerritories(transformedTerritories);
      setFilteredTerritories(transformedTerritories);

      // Calculate statistics
      setStats({
        total_territories: transformedTerritories.length,
        assigned_territories: assignedTerritoriesSet.size,
        available_territories: transformedTerritories.length - (assignedTerritoriesSet.size + expiredTerritoriesSet.size),
        expired_territories: expiredTerritoriesSet.size,
        territories_by_zone: [],
        total: transformedTerritories.length,
        assigned: assignedTerritoriesSet.size,
        available: transformedTerritories.length - (assignedTerritoriesSet.size + expiredTerritoriesSet.size)
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

  const getStatusDisplay = (territory: TerritorySafeData) => {
    if (territory.status === "expired") {
      return "Expirado";
    } else if (territory.status === "assigned") {
      return "Asignado";
    } else {
      return territory.last_assigned_at ? "Devuelto" : "Nunca asignado";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Estadísticas de Territorios</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Visualiza y analiza información sobre los territorios.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
              Territorios Expirados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{stats.expired_territories}</div>
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

      <div className="w-full">
        <StatisticsExport />
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
                    No hay territorios registrados.
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
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        territory.status === "expired" 
                          ? "bg-red-100 text-red-800" 
                          : territory.status === "assigned"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}>
                        {getStatusDisplay(territory)}
                      </span>
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
  );
};

export default Statistics;
