
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
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

// Date range picker component
const CalendarDateRangePicker = ({ 
  date, 
  onDateChange 
}: { 
  date: DateRange | undefined; 
  onDateChange: (date: DateRange | undefined) => void 
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <Button
            id="date"
            variant="outline"
            size="sm"
            className={date?.from ? "text-left font-normal" : "text-left font-normal text-muted-foreground"}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: es })
              )
            ) : (
              <span>Seleccionar rango de fechas</span>
            )}
          </Button>
          {date?.from && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateChange(undefined)}
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const StatisticsExport = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<string | "all">("all");
  const [selectedPublisher, setSelectedPublisher] = useState<string | "all">("all");
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
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select(`
          id, territory_id, publisher_id, assigned_at, expires_at, status, token, returned_at,
          publishers (name)
        `)
        .order("assigned_at", { ascending: false });
      
      if (assignmentsError) {
        throw assignmentsError;
      }
      
      if (assignmentsData) {
        // Transform data type to ensure it matches AssignmentRecord
        const assignmentRecords: AssignmentRecord[] = assignmentsData.map(item => ({
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
      if (selectedTerritory !== "all") {
        filteredAssignments = filteredAssignments.filter(
          (a) => a.territory_id === selectedTerritory
        );
      }
      if (selectedPublisher !== "all") {
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

      toast.success("Exportación completada", {
        description: "El archivo de asignaciones se ha exportado correctamente."
      });
    } catch (error) {
      console.error("Error exporting territories by assignment:", error);
      toast.error("Error en la exportación", {
        description: "No se pudieron exportar los datos. Inténtalo de nuevo."
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
      
      const { data: assignmentsHistoryData, error: assignmentsHistoryError } = await supabase
        .from("assigned_territories")
        .select(`
          id, territory_id, publisher_id, assigned_at, expires_at, status, token, returned_at,
          publishers (name),
          territories (name, zone_id),
          zones:territories (zones(name))
        `)
        .order("assigned_at", { ascending: false });
      
      if (assignmentsHistoryError) {
        throw assignmentsHistoryError;
      }
      
      if (assignmentsHistoryData) {
        // Transform data type to ensure it matches AssignmentRecord
        const assignmentRecords: AssignmentRecord[] = assignmentsHistoryData.map(item => ({
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
        
        toast.success("Exportación completada", {
          description: "El historial de asignaciones se ha exportado correctamente."
        });
      }
    } catch (error) {
      console.error("Error exporting assignment history:", error);
      toast.error("Error en la exportación", {
        description: "No se pudo exportar el historial de asignaciones. Inténtalo de nuevo."
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
            value={selectedTerritory}
            onValueChange={setSelectedTerritory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un territorio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
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
            value={selectedPublisher}
            onValueChange={setSelectedPublisher}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un publicador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
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
