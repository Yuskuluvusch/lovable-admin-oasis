
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AssignmentRecord, TerritoryAssignment } from "@/types/territory-types";
import { toast } from "sonner";
import { utils, writeFile } from "xlsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface ExportFilters {
  selectedTerritory: string | "all";
  selectedPublisher: string | "all";
  dateRange: DateRange | undefined;
}

interface ExportData {
  exportTerritoriesByAssignment: (assignments: AssignmentRecord[], filters: ExportFilters) => Promise<void>;
  exportAssignmentHistory: () => Promise<void>;
  exporting: boolean;
}

export function useTerritoryExport(): ExportData {
  const [exporting, setExporting] = useState(false);

  const formatAssignmentsForExcel = (assignments: TerritoryAssignment[]) => {
    return assignments.map((assignment) => ({
      ID: assignment.id,
      "Territorio ID": assignment.territory_id,
      "Publicador ID": assignment.publisher_id,
      "Nombre Publicador": assignment.publisher_name || "Desconocido",
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
      "Nombre del Territorio": assignment.territory_name || "Desconocido",
      "Zona del Territorio": assignment.zone_name || "Sin zona",
      "Publicador ID": assignment.publisher_id,
      "Nombre del Publicador": assignment.publisher_name || "Desconocido",
      "Fecha de Asignación": format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: es }),
      "Fecha de Vencimiento": assignment.expires_at ? format(new Date(assignment.expires_at), "dd/MM/yyyy", { locale: es }) : "Sin vencimiento",
      "Fecha de Retorno": assignment.returned_at ? format(new Date(assignment.returned_at), "dd/MM/yyyy", { locale: es }) : "Sin retorno",
      Estado: assignment.status,
      Token: assignment.token,
    }));
  };

  const exportTerritoriesByAssignment = async (
    assignments: AssignmentRecord[],
    filters: ExportFilters
  ) => {
    try {
      setExporting(true);

      // Apply filters
      let filteredAssignments = [...assignments];
      if (filters.selectedTerritory !== "all") {
        filteredAssignments = filteredAssignments.filter(
          (a) => a.territory_id === filters.selectedTerritory
        );
      }
      if (filters.selectedPublisher !== "all") {
        filteredAssignments = filteredAssignments.filter(
          (a) => a.publisher_id === filters.selectedPublisher
        );
      }
      if (filters.dateRange?.from && filters.dateRange?.to) {
        filteredAssignments = filteredAssignments.filter((a) => {
          const assignedDate = new Date(a.assigned_at);
          return (
            assignedDate >= filters.dateRange.from! && assignedDate <= filters.dateRange.to!
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

  const exportAssignmentHistory = async () => {
    try {
      setExporting(true);
      
      // Get assignment data
      const { data: assignmentsHistoryData, error: assignmentsHistoryError } = await supabase
        .from("assigned_territories")
        .select(`
          id, territory_id, publisher_id, assigned_at, expires_at, status, token, returned_at
        `)
        .order("assigned_at", { ascending: false });
      
      if (assignmentsHistoryError) {
        throw assignmentsHistoryError;
      }
      
      if (assignmentsHistoryData) {
        // Get all publisher data
        const publisherIds = [...new Set(assignmentsHistoryData.map(item => item.publisher_id))];
        const { data: publishersData, error: publishersError } = await supabase
          .from("publishers")
          .select("id, name")
          .in("id", publisherIds);
        
        if (publishersError) {
          console.error("Error fetching publishers:", publishersError);
        }
        
        // Get all territory data
        const territoryIds = [...new Set(assignmentsHistoryData.map(item => item.territory_id))];
        const { data: territoriesData, error: territoriesError } = await supabase
          .from("territories")
          .select(`
            id, name, zone_id
          `)
          .in("id", territoryIds);
        
        if (territoriesError) {
          console.error("Error fetching territories:", territoriesError);
        }
        
        // Get zone data
        let zonesData: any[] = [];
        if (territoriesData) {
          const zoneIds = [...new Set(territoriesData.filter(t => t.zone_id).map(t => t.zone_id))];
          
          if (zoneIds.length > 0) {
            const { data: fetchedZonesData, error: zonesError } = await supabase
              .from("zones")
              .select("id, name")
              .in("id", zoneIds);
              
            if (zonesError) {
              console.error("Error fetching zones:", zonesError);
            } else if (fetchedZonesData) {
              zonesData = fetchedZonesData;
            }
          }
        }
        
        // Create maps for quick lookups
        const publisherMap = new Map();
        if (publishersData) {
          publishersData.forEach(publisher => {
            publisherMap.set(publisher.id, publisher.name);
          });
        }
        
        const territoryMap = new Map();
        const zoneIdByTerritoryId = new Map();
        if (territoriesData) {
          territoriesData.forEach(territory => {
            territoryMap.set(territory.id, territory.name);
            if (territory.zone_id) {
              zoneIdByTerritoryId.set(territory.id, territory.zone_id);
            }
          });
        }
        
        const zoneMap = new Map();
        if (zonesData) {
          zonesData.forEach((zone: any) => {
            zoneMap.set(zone.id, zone.name);
          });
        }
        
        // Transform data
        const assignmentRecords: AssignmentRecord[] = assignmentsHistoryData.map(item => {
          const territoryZoneId = zoneIdByTerritoryId.get(item.territory_id);
          
          return {
            id: item.id,
            territory_id: item.territory_id,
            publisher_id: item.publisher_id,
            assigned_at: item.assigned_at,
            expires_at: item.expires_at,
            status: item.status || "",
            token: item.token,
            returned_at: item.returned_at,
            publisher_name: publisherMap.get(item.publisher_id) || "Desconocido",
            territory_name: territoryMap.get(item.territory_id) || "Desconocido",
            zone_name: territoryZoneId ? zoneMap.get(territoryZoneId) || "Sin zona" : "Sin zona"
          };
        });
        
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

  return {
    exportTerritoriesByAssignment,
    exportAssignmentHistory,
    exporting
  };
}
