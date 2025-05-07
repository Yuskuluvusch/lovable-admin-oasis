
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
  exportAssignmentHistory: (selectedTerritory: string | "all", selectedPublisher: string | "all", dateRange: DateRange | undefined) => Promise<void>;
  exporting: boolean;
}

interface ZoneData {
  id: string;
  name: string;
}

interface TerritoryData {
  id: string;
  name: string;
  zone_id: string;
}

interface ZoneTerritoriesMap {
  [zoneId: string]: {
    zoneName: string;
    territories: {
      [territoryId: string]: {
        territoryName: string;
        assignments: AssignmentRecord[];
      };
    };
  };
}

export function useTerritoryExport(): ExportData {
  const [exporting, setExporting] = useState(false);

  const formatAssignmentsForExcel = (assignments: TerritoryAssignment[]) => {
    return assignments.map((assignment) => ({
      "Territorio ID": assignment.territory_id,
      "Nombre Publicador": assignment.publisher_name || "Desconocido",
      "Fecha de Asignación": format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: es }),
      "Fecha de Vencimiento": assignment.expires_at ? format(new Date(assignment.expires_at), "dd/MM/yyyy", { locale: es }) : "Sin vencimiento",
      Estado: assignment.status,
    }));
  };

  // Apply filters to an array of assignments
  const applyFilters = (
    assignments: AssignmentRecord[],
    selectedTerritory: string | "all",
    selectedPublisher: string | "all",
    dateRange: DateRange | undefined
  ): AssignmentRecord[] => {
    let filteredAssignments = [...assignments];
    
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
    
    return filteredAssignments;
  };

  const exportTerritoriesByAssignment = async (
    assignments: AssignmentRecord[],
    filters: ExportFilters
  ) => {
    try {
      setExporting(true);

      const filteredAssignments = applyFilters(
        assignments,
        filters.selectedTerritory,
        filters.selectedPublisher,
        filters.dateRange
      );

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

  const exportAssignmentHistory = async (
    selectedTerritory: string | "all",
    selectedPublisher: string | "all",
    dateRange: DateRange | undefined
  ) => {
    try {
      setExporting(true);
      
      // Get assignment data with no specific filters initially
      const { data: assignmentsHistoryData, error: assignmentsHistoryError } = await supabase
        .from("assigned_territories")
        .select(`
          id, territory_id, publisher_id, assigned_at, expires_at, status, token, returned_at
        `)
        .order("assigned_at", { ascending: false });
      
      if (assignmentsHistoryError) {
        throw assignmentsHistoryError;
      }
      
      if (!assignmentsHistoryData || assignmentsHistoryData.length === 0) {
        toast.info("Sin datos", {
          description: "No hay datos de asignaciones para exportar."
        });
        setExporting(false);
        return;
      }
      
      // Get all publisher data
      const publisherIds = [...new Set(assignmentsHistoryData.map(item => item.publisher_id))];
      const { data: publishersData, error: publishersError } = await supabase
        .from("publishers")
        .select("id, name");
      
      if (publishersError) {
        console.error("Error fetching publishers:", publishersError);
      }
      
      // Get all territory data
      const territoryIds = [...new Set(assignmentsHistoryData.map(item => item.territory_id))];
      const { data: territoriesData, error: territoriesError } = await supabase
        .from("territories")
        .select(`
          id, name, zone_id
        `);
      
      if (territoriesError) {
        console.error("Error fetching territories:", territoriesError);
      }
      
      // Get all zone data
      const { data: zonesData, error: zonesError } = await supabase
        .from("zones")
        .select("id, name");
        
      if (zonesError) {
        console.error("Error fetching zones:", zonesError);
      }
      
      // Create maps for quick lookups
      const publisherMap = new Map();
      if (publishersData) {
        publishersData.forEach(publisher => {
          publisherMap.set(publisher.id, publisher.name);
        });
      }
      
      const territoryMap = new Map<string, TerritoryData>();
      if (territoriesData) {
        territoriesData.forEach(territory => {
          territoryMap.set(territory.id, {
            id: territory.id,
            name: territory.name,
            zone_id: territory.zone_id
          });
        });
      }
      
      const zoneMap = new Map<string, ZoneData>();
      if (zonesData) {
        zonesData.forEach(zone => {
          zoneMap.set(zone.id, {
            id: zone.id,
            name: zone.name
          });
        });
      }
      
      // Transform data to include all required info
      const assignmentRecords: AssignmentRecord[] = assignmentsHistoryData.map(item => {
        const territory = territoryMap.get(item.territory_id);
        const zoneName = territory && territory.zone_id ? zoneMap.get(territory.zone_id)?.name || "Sin zona" : "Sin zona";
        
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
          territory_name: territory ? territory.name : "Desconocido",
          zone_name: zoneName
        };
      });
      
      // Apply filters to the data
      const filteredAssignments = applyFilters(
        assignmentRecords, 
        selectedTerritory,
        selectedPublisher,
        dateRange
      );
      
      // Organize data by zones and territories
      const zoneTerritoriesMap: ZoneTerritoriesMap = {};
      
      // Group assignments by zone first, then by territory
      filteredAssignments.forEach(assignment => {
        const territory = territoryMap.get(assignment.territory_id);
        if (!territory) return;
        
        const zoneId = territory.zone_id || "unknown";
        const zoneName = zoneId !== "unknown" ? zoneMap.get(zoneId)?.name || "Sin zona" : "Sin zona";
        
        // Initialize zone if not exists
        if (!zoneTerritoriesMap[zoneId]) {
          zoneTerritoriesMap[zoneId] = {
            zoneName,
            territories: {}
          };
        }
        
        // Initialize territory if not exists
        if (!zoneTerritoriesMap[zoneId].territories[territory.id]) {
          zoneTerritoriesMap[zoneId].territories[territory.id] = {
            territoryName: territory.name,
            assignments: []
          };
        }
        
        // Add assignment to territory
        zoneTerritoriesMap[zoneId].territories[territory.id].assignments.push(assignment);
      });
      
      // Create workbook
      const workbook = utils.book_new();
      
      // For each zone, create a worksheet
      Object.entries(zoneTerritoriesMap).forEach(([zoneId, zoneData]) => {
        const sheetName = zoneData.zoneName.substring(0, 30); // Excel has a 31 character limit for sheet names
        
        // Create data for this zone
        const worksheetData: any[] = [];
        const territoryKeys = Object.keys(zoneData.territories);
        
        // Define territory columns (6 columns per territory + 1 empty column)
        const columnsPerTerritory = 6;
        const maxAssignmentsInAnyTerritory = Math.max(
          ...territoryKeys.map(tId => zoneData.territories[tId].assignments.length),
          1 // At least one row for headers
        );
        
        // Create headers row
        const headers: any[] = [];
        territoryKeys.forEach((territoryId, index) => {
          const territory = zoneData.territories[territoryId];
          
          // Add headers for this territory
          headers.push(
            "Nombre del Territorio",
            "Nombre del Publicador",
            "Fecha de Asignación",
            "Fecha de Vencimiento",
            "Fecha de Retorno",
            "Estado"
          );
          
          // Add empty column after each territory except the last one
          if (index < territoryKeys.length - 1) {
            headers.push("");
          }
        });
        
        // Add headers to worksheet data
        worksheetData.push(headers);
        
        // Create territory names row
        const territoryNames: any[] = [];
        territoryKeys.forEach((territoryId, index) => {
          const territory = zoneData.territories[territoryId];
          
          // Add territory name in first column, empty in rest
          territoryNames.push(
            territory.territoryName,
            "", "", "", "", ""
          );
          
          // Add empty column after each territory except the last one
          if (index < territoryKeys.length - 1) {
            territoryNames.push("");
          }
        });
        
        // Add territory names to worksheet data
        worksheetData.push(territoryNames);
        
        // Fill data rows
        for (let rowIndex = 0; rowIndex < maxAssignmentsInAnyTerritory; rowIndex++) {
          const rowData: any[] = [];
          
          territoryKeys.forEach((territoryId, territoryIndex) => {
            const territoryData = zoneData.territories[territoryId];
            const assignment = territoryData.assignments[rowIndex];
            
            if (assignment) {
              rowData.push(
                territoryData.territoryName,
                assignment.publisher_name || "Desconocido",
                format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: es }),
                assignment.expires_at ? format(new Date(assignment.expires_at), "dd/MM/yyyy", { locale: es }) : "Sin vencimiento",
                assignment.returned_at ? format(new Date(assignment.returned_at), "dd/MM/yyyy", { locale: es }) : "No devuelto",
                assignment.status === "assigned" ? "Asignado" : 
                assignment.status === "returned" ? "Devuelto" : assignment.status
              );
            } else {
              // Empty cells if no assignment at this index
              rowData.push("", "", "", "", "", "");
            }
            
            // Add empty column after each territory except the last one
            if (territoryIndex < territoryKeys.length - 1) {
              rowData.push("");
            }
          });
          
          worksheetData.push(rowData);
        }
        
        // Create worksheet and append to workbook
        const worksheet = utils.aoa_to_sheet(worksheetData);
        
        // Set column widths
        const columnWidths = [];
        for (let i = 0; i < headers.length; i++) {
          if ((i + 1) % (columnsPerTerritory + 1) === 0) {
            // Empty column between territories
            columnWidths.push({ wch: 5 });
          } else {
            // Content columns
            columnWidths.push({ wch: 20 });
          }
        }
        
        worksheet['!cols'] = columnWidths;
        
        // Add to workbook
        utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      
      // If no data was processed, create an empty sheet
      if (Object.keys(zoneTerritoriesMap).length === 0) {
        const emptyWorksheet = utils.aoa_to_sheet([["No hay datos que cumplan con los filtros seleccionados"]]);
        utils.book_append_sheet(workbook, emptyWorksheet, "Sin datos");
      }
      
      // Write to file and download
      writeFile(
        workbook,
        `historial_territorios_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      );
      
      toast.success("Exportación completada", {
        description: "El historial de asignaciones se ha exportado correctamente."
      });
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
