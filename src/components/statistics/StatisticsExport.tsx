
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { CalendarDateRangePicker } from "@/components/ui/calendar-date-range-picker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { utils, writeFile } from "xlsx";
import { TerritoryAssignment, AssignmentRecord } from "@/types/territory-types";

interface Territory {
  id: string;
  name: string;
}

interface Publisher {
  id: string;
  name: string;
}

const StatisticsExport = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const [selectedPublisher, setSelectedPublisher] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [allAssignments, setAllAssignments] = useState<AssignmentRecord[]>([]);
  const [currentAssignmentsCount, setCurrentAssignmentsCount] = useState<number>(0);
  const [expiredAssignmentsCount, setExpiredAssignmentsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTerritories();
    fetchPublishers();
    fetchAssignmentsForExport();
  }, []);

  const fetchTerritories = async () => {
    try {
      const { data, error } = await supabase.from("territories").select("id, name");
      if (error) {
        throw error;
      }
      setTerritories(data || []);
    } catch (error) {
      console.error("Error fetching territories:", error);
    }
  };

  const fetchPublishers = async () => {
    try {
      const { data, error } = await supabase.from("publishers").select("id, name");
      if (error) {
        throw error;
      }
      setPublishers(data || []);
    } catch (error) {
      console.error("Error fetching publishers:", error);
    }
  };

const fetchAssignmentsForExport = async () => {
  setIsLoading(true);
  
  try {
    const { data, error } = await supabase
      .from("assigned_territories")
      .select(`
        id, territory_id, publisher_id, assigned_at, expires_at, status, token, returned_at,
        publishers:publishers!assigned_territories_publisher_id_fkey(name)
      `)
      .order("assigned_at", { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (data) {
      // Transform data type to ensure it matches AssignmentRecord
      const assignmentRecords: AssignmentRecord[] = data.map(item => ({
        id: item.id,
        territory_id: item.territory_id,
        publisher_id: item.publisher_id,
        assigned_at: item.assigned_at,
        expires_at: item.expires_at,
        status: item.status || "",
        token: item.token,
        returned_at: item.returned_at,
        publisher_name: item.publishers?.name || "Unknown"
      }));
      
      setAllAssignments(assignmentRecords);
      
      const currentAssignments = assignmentRecords.filter(
        (a) => a.status === "assigned" && !a.returned_at
      );
      const expiredAssignments = assignmentRecords.filter(
        (a) =>
          a.status === "assigned" &&
          !a.returned_at &&
          a.expires_at &&
          new Date(a.expires_at) < new Date()
      );
      
      setCurrentAssignmentsCount(currentAssignments.length);
      setExpiredAssignmentsCount(expiredAssignments.length);
    }
  } catch (error) {
    console.error("Error fetching assignments for export:", error);
  } finally {
    setIsLoading(false);
  }
};

  const exportTerritoriesByAssignment = async () => {
    try {
      setExporting(true);

      // Apply filters
      let filteredAssignments = [...allAssignments];
      if (selectedTerritory) {
        filteredAssignments = filteredAssignments.filter(
          (a) => a.territory_id === selectedTerritory
        );
      }
      if (selectedPublisher) {
        filteredAssignments = filteredAssignments.filter(
          (a) => a.publisher_id === selectedPublisher
        );
      }
      if (dateRange?.from && dateRange?.to) {
        filteredAssignments = filteredAssignments.filter((a) => {
          const assignedDate = new Date(a.assigned_at);
          return (
            assignedDate >= dateRange.from! && assignedDate <= dateRange.to!
          );
        });
      }

      const exportData = formatAssignmentsForExcel(filteredAssignments);

      const workbook = utils.book_new();
      const worksheet = utils.json_to_sheet(exportData);

      utils.book_append_sheet(workbook, worksheet, "Asignaciones");

      writeFile(
        workbook,
        `asignaciones_territorios_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      );

      toast({
        title: "Exportación completada",
        description: "El archivo de asignaciones se ha exportado correctamente."
      });
    } catch (error) {
      console.error("Error exporting territories by assignment:", error);
      toast({
        variant: "destructive",
        title: "Error en la exportación",
        description:
          "No se pudieron exportar los datos. Inténtalo de nuevo."
      });
    } finally {
      setExporting(false);
    }
  };

  const formatAssignmentsForExcel = (assignments: TerritoryAssignment[]) => {
    return assignments.map((assignment) => ({
      ID: assignment.id,
      "Territorio ID": assignment.territory_id,
      "Publicador ID": assignment.publisher_id,
      "Fecha de Asignación": format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: es }),
      "Fecha de Vencimiento": assignment.expires_at ? format(new Date(assignment.expires_at), "dd/MM/yyyy", { locale: es }) : "Sin vencimiento",
      Estado: assignment.status,
      Token: assignment.token,
    }));
  };

  const formatAssignmentHistoryForExcel = (assignments: AssignmentRecord[]) => {
    return assignments.map((assignment) => ({
      ID: assignment.id,
      "Territorio ID": assignment.territory_id,
      "Nombre del Territorio": assignment.territory_name,
      "Zona del Territorio": assignment.zone_name,
      "Publicador ID": assignment.publisher_id,
      "Nombre del Publicador": assignment.publisher_name,
      "Fecha de Asignación": format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: es }),
      "Fecha de Vencimiento": assignment.expires_at ? format(new Date(assignment.expires_at), "dd/MM/yyyy", { locale: es }) : "Sin vencimiento",
      "Fecha de Retorno": assignment.returned_at ? format(new Date(assignment.returned_at), "dd/MM/yyyy", { locale: es }) : "Sin retorno",
      Estado: assignment.status,
      Token: assignment.token,
    }));
  };

const exportAssignmentHistory = async () => {
  try {
    setExporting(true);
    
    const { data, error } = await supabase
      .from("assigned_territories")
      .select(`
        id, territory_id, publisher_id, assigned_at, expires_at, status, token, returned_at,
        publishers:publishers!assigned_territories_publisher_id_fkey(name),
        territories:territories!assigned_territories_territory_id_fkey(name, zone_id),
        zones:territories!inner(zones(name))
      `)
      .order("assigned_at", { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (data) {
      // Transform data type to ensure it matches AssignmentRecord
      const assignmentRecords: AssignmentRecord[] = data.map(item => ({
        id: item.id,
        territory_id: item.territory_id,
        publisher_id: item.publisher_id,
        assigned_at: item.assigned_at,
        expires_at: item.expires_at,
        status: item.status || "",
        token: item.token,
        returned_at: item.returned_at,
        publisher_name: item.publishers?.name || "Unknown",
        territory_name: item.territories?.name || "Unknown",
        zone_name: item.zones?.zones?.name || "Unknown"
      }));
      
      const historyData = formatAssignmentHistoryForExcel(assignmentRecords);
      
      const workbook = utils.book_new();
      const worksheet = utils.json_to_sheet(historyData);
      
      utils.book_append_sheet(workbook, worksheet, "Historial de Asignaciones");
      
      writeFile(
        workbook,
        `historial_territorios_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      );
      
      toast({
        title: "Exportación completada",
        description: "El historial de asignaciones se ha exportado correctamente."
      });
    }
  } catch (error) {
    console.error("Error exporting assignment history:", error);
    toast({
      variant: "destructive",
      title: "Error en la exportación",
      description:
        "No se pudo exportar el historial de asignaciones. Inténtalo de nuevo."
    });
  } finally {
    setExporting(false);
  }
};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Datos</CardTitle>
        <CardDescription>
          Exporta la información de los territorios asignados en formato Excel.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="territory">Territorio</Label>
          <Select
            value={selectedTerritory || ""}
            onValueChange={setSelectedTerritory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un territorio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {territories.map((territory) => (
                <SelectItem key={territory.id} value={territory.id}>
                  {territory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="publisher">Publicador</Label>
          <Select
            value={selectedPublisher || ""}
            onValueChange={setSelectedPublisher}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un publicador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {publishers.map((publisher) => (
                <SelectItem key={publisher.id} value={publisher.id}>
                  {publisher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Rango de Fechas</Label>
          <CalendarDateRangePicker date={dateRange} onDateChange={setDateRange} />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={exportTerritoriesByAssignment} disabled={exporting || isLoading}>
          {exporting ? "Exportando..." : "Exportar Asignaciones"}
        </Button>
      </CardFooter>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          <Label>Exportar Historial Completo</Label>
          <CardDescription>
            Exporta el historial completo de asignaciones de territorios.
          </CardDescription>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={exportAssignmentHistory} disabled={exporting || isLoading}>
          {exporting ? "Exportando..." : "Exportar Historial"}
        </Button>
      </CardFooter>
      <CardContent>
        <CardTitle>Resumen de Asignaciones</CardTitle>
        <CardDescription>
          Información general sobre las asignaciones de territorios.
        </CardDescription>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Total de Asignaciones</TableHead>
              <TableHead>Asignaciones Activas</TableHead>
              <TableHead>Asignaciones Expiradas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{allAssignments.length}</TableCell>
              <TableCell>{currentAssignmentsCount}</TableCell>
              <TableCell>{expiredAssignmentsCount}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StatisticsExport;
