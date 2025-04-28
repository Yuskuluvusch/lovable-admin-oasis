
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, FileSpreadsheet, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Territory, TerritoryStatistics } from "@/types/territory-types";
import StatisticsExport from "@/components/statistics/StatisticsExport";

const Statistics = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [filteredTerritories, setFilteredTerritories] = useState<Territory[]>([]);
  const [statistics, setStatistics] = useState<TerritoryStatistics>({
    total: 0,
    assigned: 0,
    available: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTerritories();
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (territories.length > 0) {
      setFilteredTerritories(
        territories.filter((territory) =>
          territory.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, territories]);

  const fetchTerritories = async () => {
    try {
      setIsLoading(true);
      
      const { data: territoriesData, error: territoriesError } = await supabase
        .from("territories")
        .select(`
          *,
          zone:zones(id, name)
        `)
        .order("name");
      
      if (territoriesError) throw territoriesError;

      // Get current assignments to determine which territories are assigned
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select("territory_id, assigned_at")
        .eq("status", "assigned");

      if (assignmentsError) throw assignmentsError;

      // Map last assignment date to territories
      const territoriesWithAssignment = territoriesData.map((territory) => {
        const assignment = assignmentsData.find(
          (a) => a.territory_id === territory.id
        );
        return {
          ...territory,
          last_assigned_at: assignment ? assignment.assigned_at : null,
        };
      });

      setTerritories(territoriesWithAssignment);
      setFilteredTerritories(territoriesWithAssignment);
    } catch (error) {
      console.error("Error fetching territories:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los territorios",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Get total count of territories
      const { count: totalCount, error: totalError } = await supabase
        .from("territories")
        .select("*", { count: "exact" });
      
      if (totalError) throw totalError;

      // Get count of assigned territories
      const { count: assignedCount, error: assignedError } = await supabase
        .from("assigned_territories")
        .select("*", { count: "exact" })
        .eq("status", "assigned");
      
      if (assignedError) throw assignedError;

      setStatistics({
        total: totalCount || 0,
        assigned: assignedCount || 0,
        available: (totalCount || 0) - (assignedCount || 0),
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleViewTerritory = (territoryId: string) => {
    navigate(`/estadisticas/${territoryId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="text-muted-foreground mt-2">
          Control y seguimiento de territorios
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Territorios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Territorios Asignados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.assigned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Territorios Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.available}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar territorios..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <StatisticsExport territories={territories} />
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Territorio</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTerritories.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No se encontraron territorios
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTerritories.map((territory) => (
                        <TableRow key={territory.id}>
                          <TableCell className="font-medium">
                            {territory.name}
                          </TableCell>
                          <TableCell>
                            {territory.zone?.name || "Sin zona"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div
                                className={`h-2 w-2 rounded-full mr-2 ${
                                  territory.last_assigned_at
                                    ? "bg-orange-500"
                                    : "bg-green-500"
                                }`}
                              ></div>
                              {territory.last_assigned_at
                                ? "Asignado"
                                : "Disponible"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTerritory(territory.id)}
                            >
                              Ver historial
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
