
import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TerritorySafeData } from '@/types/territory-types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type StatisticsExportProps = {
  territories: TerritorySafeData[];
};

interface AssignmentRecord {
  id: string;
  territory_id: string;
  publisher_id: string;
  assigned_at: string;
  expires_at: string | null;
  returned_at: string | null;
  status: string;
  publishers: {
    name: string;
  };
}

const StatisticsExport = ({ territories }: StatisticsExportProps) => {
  const { toast } = useToast();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Fecha inválida';
    }
  };

  const getStatus = (status: string) => {
    switch (status) {
      case "assigned":
        return "Asignado";
      case "returned":
        return "Devuelto";
      default:
        return "Desconocido";
    }
  };

  const handleExport = async () => {
    if (territories.length === 0) {
      toast({
        title: "No hay territorios",
        description: "No hay territorios para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Show loading toast
    toast({
      title: "Exportando datos",
      description: "Recopilando el historial de todos los territorios...",
    });

    try {
      console.log(`Iniciando exportación para ${territories.length} territorios`);
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Create summary worksheet data
      const summaryRows = territories.map(territory => ({
        'Territorio': territory.name,
        'Zona': territory.zone?.name || 'Sin zona',
        'Estado': territory.last_assigned_at ? 'Asignado' : 'Disponible',
        'Última Asignación': territory.last_assigned_at ? formatDate(territory.last_assigned_at) : 'Nunca asignado',
        'Google Maps': territory.google_maps_link || 'N/A'
      }));
      
      // Add summary worksheet
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
      console.log("Hoja de resumen creada");

      // Group territories by zone
      const territoriesByZone = territories.reduce<Record<string, TerritorySafeData[]>>((groups, territory) => {
        const zoneName = territory.zone?.name || 'Sin zona';
        if (!groups[zoneName]) {
          groups[zoneName] = [];
        }
        groups[zoneName].push(territory);
        return groups;
      }, {});
      
      // Process each zone for zone-specific sheets
      for (const [zoneName, zoneTerritories] of Object.entries(territoriesByZone)) {
        console.log(`Procesando zona: ${zoneName} con ${zoneTerritories.length} territorios`);
        
        // Create a safe zone name for the sheet
        let safeZoneName = zoneName.substring(0, 25).replace(/[\\\/\[\]\*\?:]/g, '_');
        
        // Prepare data for zone sheet
        const zoneSheetHeaders = [];
        const zoneData: any[][] = [];
        
        // Headers for each territory: Territorio, Publicador, Asignado, Devuelto, Estado
        for (const territory of zoneTerritories) {
          zoneSheetHeaders.push(
            territory.name, // Territorio
            'Publicador',
            'Asignado',
            'Devuelto',
            'Estado',
            '' // Empty column as separator
          );
        }
        
        // Add headers to the zone data
        zoneData.push(zoneSheetHeaders);
        
        // Get history data for each territory in this zone
        const territoriesHistory: Record<string, AssignmentRecord[]> = {};
        
        // Fetch history for all territories in this zone
        for (const territory of zoneTerritories) {
          try {
            console.log(`Obteniendo historial para territorio: ${territory.name} (${territory.id})`);
            
            const { data: historyData, error: historyError } = await supabase
              .from("assigned_territories")
              .select(`
                id, 
                territory_id, 
                publisher_id, 
                assigned_at, 
                expires_at, 
                returned_at, 
                status,
                publishers:publishers!assigned_territories_publisher_id_fkey(name)
              `)
              .eq("territory_id", territory.id)
              .order("assigned_at", { ascending: false });
              
            if (historyError) {
              console.error(`Error obteniendo historial para territorio ${territory.name}:`, historyError);
              continue;
            }
            
            territoriesHistory[territory.id] = historyData || [];
            console.log(`Encontrados ${historyData?.length || 0} registros para territorio ${territory.name}`);
          } catch (error) {
            console.error(`Error procesando territorio ${territory.name}:`, error);
            territoriesHistory[territory.id] = [];
          }
        }
        
        // Find the maximum number of history records for any territory in this zone
        const maxHistoryCount = Math.max(
          1, // At least one row even if no history
          ...Object.values(territoriesHistory).map(history => history.length)
        );
        
        // Generate rows based on history records
        for (let i = 0; i < maxHistoryCount; i++) {
          const row: any[] = [];
          
          // For each territory, add the history data or empty cells
          for (const territory of zoneTerritories) {
            const history = territoriesHistory[territory.id] || [];
            const historyRecord = i < history.length ? history[i] : null;
            
            if (i === 0) {
              // For the first row, include the territory name
              row.push(territory.name);
            } else {
              // For subsequent rows, repeat territory name
              row.push('');
            }
            
            if (historyRecord) {
              // Add history details: Publicador, Asignado, Devuelto, Estado
              row.push(
                historyRecord.publishers?.name || 'Desconocido',
                formatDate(historyRecord.assigned_at),
                historyRecord.returned_at ? formatDate(historyRecord.returned_at) : '—',
                getStatus(historyRecord.status)
              );
            } else {
              // Add empty cells if no history for this row
              row.push(i === 0 ? 'Sin historial' : '', '', '', '');
            }
            
            // Add empty cell as separator
            row.push('');
          }
          
          zoneData.push(row);
        }
        
        // Create and add the zone worksheet
        try {
          const zoneSheet = XLSX.utils.aoa_to_sheet(zoneData);
          XLSX.utils.book_append_sheet(workbook, zoneSheet, safeZoneName);
          console.log(`Hoja para zona "${safeZoneName}" creada con ${zoneData.length} filas`);
        } catch (error) {
          console.error(`Error creando hoja para zona "${zoneName}":`, error);
        }
      }
      
      // Create a complete history sheet with all territories
      try {
        // Prepare data for the complete history sheet
        const allSheetHeaders = [];
        const allData: any[][] = [];
        
        // Headers for each territory: Territorio, Publicador, Asignado, Devuelto, Estado
        for (const territory of territories) {
          allSheetHeaders.push(
            territory.name, // Territorio
            'Publicador',
            'Asignado',
            'Devuelto',
            'Estado',
            '' // Empty column as separator
          );
        }
        
        // Add headers to the all data
        allData.push(allSheetHeaders);
        
        // Get history data for each territory
        const allTerritoriesHistory: Record<string, AssignmentRecord[]> = {};
        
        // Fetch history for all territories
        for (const territory of territories) {
          try {
            console.log(`Obteniendo historial para territorio (global): ${territory.name} (${territory.id})`);
            
            const { data: historyData, error: historyError } = await supabase
              .from("assigned_territories")
              .select(`
                id, 
                territory_id, 
                publisher_id, 
                assigned_at, 
                expires_at, 
                returned_at, 
                status,
                publishers:publishers!assigned_territories_publisher_id_fkey(name)
              `)
              .eq("territory_id", territory.id)
              .order("assigned_at", { ascending: false });
              
            if (historyError) {
              console.error(`Error obteniendo historial global para territorio ${territory.name}:`, historyError);
              continue;
            }
            
            allTerritoriesHistory[territory.id] = historyData || [];
          } catch (error) {
            console.error(`Error procesando territorio ${territory.name}:`, error);
            allTerritoriesHistory[territory.id] = [];
          }
        }
        
        // Find the maximum number of history records for any territory
        const maxAllHistoryCount = Math.max(
          1, // At least one row even if no history
          ...Object.values(allTerritoriesHistory).map(history => history.length)
        );
        
        // Generate rows based on history records
        for (let i = 0; i < maxAllHistoryCount; i++) {
          const row: any[] = [];
          
          // For each territory, add the history data or empty cells
          for (const territory of territories) {
            const history = allTerritoriesHistory[territory.id] || [];
            const historyRecord = i < history.length ? history[i] : null;
            
            if (i === 0) {
              // For the first row, include the territory name
              row.push(territory.name);
            } else {
              // For subsequent rows, repeat territory name
              row.push('');
            }
            
            if (historyRecord) {
              // Add history details: Publicador, Asignado, Devuelto, Estado
              row.push(
                historyRecord.publishers?.name || 'Desconocido',
                formatDate(historyRecord.assigned_at),
                historyRecord.returned_at ? formatDate(historyRecord.returned_at) : '—',
                getStatus(historyRecord.status)
              );
            } else {
              // Add empty cells if no history for this row
              row.push(i === 0 ? 'Sin historial' : '', '', '', '');
            }
            
            // Add empty cell as separator
            row.push('');
          }
          
          allData.push(row);
        }
        
        // Create and add the complete history worksheet
        const allHistorySheet = XLSX.utils.aoa_to_sheet(allData);
        XLSX.utils.book_append_sheet(workbook, allHistorySheet, 'Historial Completo');
        console.log(`Hoja de historial completo creada con ${allData.length} filas`);
      } catch (error) {
        console.error("Error creando hoja de historial completo:", error);
        
        // Create fallback empty sheet
        const fallbackSheet = XLSX.utils.aoa_to_sheet([
          ['Error al generar historial completo'],
          [`Error: ${error instanceof Error ? error.message : String(error)}`]
        ]);
        XLSX.utils.book_append_sheet(workbook, fallbackSheet, 'Error Historial');
      }
      
      // Generate file and download
      console.log("Generando archivo Excel...");
      XLSX.writeFile(workbook, `Territorios_Historial_Columnas.xlsx`);
      
      toast({
        title: "Exportación completada",
        description: "El archivo con el historial completo de territorios se ha descargado correctamente.",
      });
    } catch (error) {
      console.error("Error exportando territorios:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al exportar los datos de territorios. Revisa la consola para más detalles.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={territories.length === 0}
      className="w-full sm:w-auto"
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Exportar Historial Completo
    </Button>
  );
};

export default StatisticsExport;
