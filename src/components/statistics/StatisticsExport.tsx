
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
      
      // For all history by territory in columns format
      const allTerritoriesHistory: Record<string, any[]> = {};
      
      // Process each zone
      for (const [zoneName, zoneTerritories] of Object.entries(territoriesByZone)) {
        console.log(`Procesando zona: ${zoneName} con ${zoneTerritories.length} territorios`);
        
        // For zone-specific history with territories in columns
        const zoneTerritoriesHistory: Record<string, any[]> = {};
        
        // Process each territory in this zone
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
            
            // Initialize this territory in the history records if not exists
            if (!allTerritoriesHistory[territory.name]) {
              allTerritoriesHistory[territory.name] = [];
            }
            
            if (!zoneTerritoriesHistory[territory.name]) {
              zoneTerritoriesHistory[territory.name] = [];
            }
            
            if (historyData && historyData.length > 0) {
              console.log(`Se encontraron ${historyData.length} registros para territorio ${territory.name}`);
              
              // Transform and add records to territory history
              historyData.forEach((record: any) => {
                const publisherName = record.publishers?.name || 'Desconocido';
                
                const historyItem = {
                  'Publicador': publisherName,
                  'Fecha asignación': formatDate(record.assigned_at),
                  'Fecha devolución': record.returned_at ? formatDate(record.returned_at) : '—',
                  'Fecha expiración': record.expires_at ? formatDate(record.expires_at) : '—',
                  'Estado': getStatus(record.status),
                  'Maps': territory.google_maps_link || 'N/A',
                  'Zona': territory.zone?.name || 'Sin zona'
                };
                
                allTerritoriesHistory[territory.name].push(historyItem);
                zoneTerritoriesHistory[territory.name].push(historyItem);
              });
            } else {
              console.log(`No se encontraron registros para territorio ${territory.name}`);
              
              // Add a placeholder for territories with no history
              const emptyRecord = {
                'Publicador': 'N/A',
                'Fecha asignación': 'Nunca asignado',
                'Fecha devolución': 'N/A',
                'Fecha expiración': 'N/A',
                'Estado': 'Disponible',
                'Maps': territory.google_maps_link || 'N/A',
                'Zona': territory.zone?.name || 'Sin zona'
              };
              
              allTerritoriesHistory[territory.name].push(emptyRecord);
              zoneTerritoriesHistory[territory.name].push(emptyRecord);
            }
          } catch (error) {
            console.error(`Error procesando territorio ${territory.name}:`, error);
          }
        }
        
        // Generate zone-specific sheet with territories in columns
        try {
          if (Object.keys(zoneTerritoriesHistory).length > 0) {
            // Create a safe zone name
            let safeZoneName = zoneName.substring(0, 25).replace(/[\\\/\[\]\*\?:]/g, '_');
            
            // Generate data arrays for this zone
            const zoneHeaders = ['Movimiento', ...Object.keys(zoneTerritoriesHistory)];
            
            // Find max records for any territory in this zone
            const maxRecords = Math.max(...Object.values(zoneTerritoriesHistory).map(records => records.length));
            
            // Prepare rows for the zone sheet
            const zoneRows = [];
            
            // Headers row (territory names)
            zoneRows.push(zoneHeaders);
            
            // For each history record index
            for (let i = 0; i < maxRecords; i++) {
              const row = [`Movimiento ${i+1}`];
              
              // For each territory, add the corresponding history record or empty cells
              Object.keys(zoneTerritoriesHistory).forEach(territoryName => {
                const records = zoneTerritoriesHistory[territoryName];
                if (i < records.length) {
                  // Format multiline cell content
                  const record = records[i];
                  const cellContent = `${record['Publicador']}\nAsignado: ${record['Fecha asignación']}\nDevuelto: ${record['Fecha devolución']}\nEstado: ${record['Estado']}`;
                  row.push(cellContent);
                } else {
                  row.push('');
                }
              });
              
              zoneRows.push(row);
            }
            
            // Create the sheet
            const zoneSheet = XLSX.utils.aoa_to_sheet(zoneRows);
            XLSX.utils.book_append_sheet(workbook, zoneSheet, safeZoneName);
            console.log(`Hoja para zona "${safeZoneName}" creada correctamente con ${zoneRows.length} filas`);
          }
        } catch (error) {
          console.error(`Error creando hoja para zona "${zoneName}":`, error);
        }
      }
      
      // Generate complete history sheet with all territories
      try {
        if (Object.keys(allTerritoriesHistory).length > 0) {
          // Generate data arrays for complete history
          const historyHeaders = ['Movimiento', ...Object.keys(allTerritoriesHistory)];
          
          // Find max records for any territory
          const maxRecords = Math.max(...Object.values(allTerritoriesHistory).map(records => records.length));
          
          // Prepare rows for the complete history sheet
          const historyRows = [];
          
          // Headers row (territory names)
          historyRows.push(historyHeaders);
          
          // For each history record index
          for (let i = 0; i < maxRecords; i++) {
            const row = [`Movimiento ${i+1}`];
            
            // For each territory, add the corresponding history record or empty cells
            Object.keys(allTerritoriesHistory).forEach(territoryName => {
              const records = allTerritoriesHistory[territoryName];
              if (i < records.length) {
                // Format multiline cell content
                const record = records[i];
                const cellContent = `${record['Publicador']}\nAsignado: ${record['Fecha asignación']}\nDevuelto: ${record['Fecha devolución']}\nEstado: ${record['Estado']}\nZona: ${record['Zona']}`;
                row.push(cellContent);
              } else {
                row.push('');
              }
            });
            
            historyRows.push(row);
          }
          
          // Create the sheet
          const historySheet = XLSX.utils.aoa_to_sheet(historyRows);
          XLSX.utils.book_append_sheet(workbook, historySheet, 'Historial Completo');
          console.log(`Hoja de historial completo creada con ${historyRows.length} filas`);
        } else {
          // Create empty history sheet if no history data
          const emptyHistorySheet = XLSX.utils.aoa_to_sheet([
            ['No hay registros de historial disponibles'],
          ]);
          XLSX.utils.book_append_sheet(workbook, emptyHistorySheet, 'Historial Completo');
        }
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
