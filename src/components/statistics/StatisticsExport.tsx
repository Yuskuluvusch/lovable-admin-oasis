
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
      
      // All history records for all territories
      const allHistoryRecords: any[] = [];
      
      // Process each zone
      for (const [zoneName, zoneTerritories] of Object.entries(territoriesByZone)) {
        console.log(`Procesando zona: ${zoneName} con ${zoneTerritories.length} territorios`);
        
        // History records for this zone
        const zoneHistoryRecords: any[] = [];
        
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
              zoneHistoryRecords.push({
                'Territorio': territory.name,
                'Publicador': 'ERROR',
                'Fecha de asignación': 'Error al obtener datos',
                'Fecha de devolución': 'N/A',
                'Fecha de expiración': 'N/A',
                'Estado': 'Error',
                'Google Maps': territory.google_maps_link || 'N/A'
              });
              continue;
            }
            
            if (historyData && historyData.length > 0) {
              console.log(`Se encontraron ${historyData.length} registros para territorio ${territory.name}`);
              
              // Transform and add records to zone history and all history
              historyData.forEach((record: any) => {
                const publisherName = record.publishers?.name || 'Desconocido';
                
                const historyRow = {
                  'Territorio': territory.name,
                  'Publicador': publisherName,
                  'Fecha de asignación': formatDate(record.assigned_at),
                  'Fecha de devolución': record.returned_at ? formatDate(record.returned_at) : '—',
                  'Fecha de expiración': record.expires_at ? formatDate(record.expires_at) : '—',
                  'Estado': getStatus(record.status),
                  'Google Maps': territory.google_maps_link || 'N/A'
                };
                
                zoneHistoryRecords.push(historyRow);
                
                // Also add zone name to all history records
                allHistoryRecords.push({
                  ...historyRow,
                  'Zona': territory.zone?.name || 'Sin zona'
                });
              });
            } else {
              console.log(`No se encontraron registros para territorio ${territory.name}`);
              
              const emptyRecord = {
                'Territorio': territory.name,
                'Publicador': 'N/A',
                'Fecha de asignación': 'Nunca asignado',
                'Fecha de devolución': 'N/A',
                'Fecha de expiración': 'N/A',
                'Estado': 'Disponible',
                'Google Maps': territory.google_maps_link || 'N/A'
              };
              
              zoneHistoryRecords.push(emptyRecord);
              
              // Also add zone name to all history records
              allHistoryRecords.push({
                ...emptyRecord,
                'Zona': territory.zone?.name || 'Sin zona'
              });
            }
          } catch (error) {
            console.error(`Error procesando territorio ${territory.name}:`, error);
            
            zoneHistoryRecords.push({
              'Territorio': territory.name,
              'Publicador': 'ERROR',
              'Fecha de asignación': 'Error al procesar territorio',
              'Fecha de devolución': 'N/A',
              'Fecha de expiración': 'N/A',
              'Estado': 'Error',
              'Google Maps': territory.google_maps_link || 'N/A'
            });
          }
        }
        
        // Create worksheet for this zone
        if (zoneHistoryRecords.length > 0) {
          // Create a safe sheet name (avoid special characters and excessive length)
          // Replace any invalid characters and limit length
          let safeZoneName = zoneName.substring(0, 30).replace(/[\\\/\[\]\*\?:]/g, '_');
          
          try {
            console.log(`Creando hoja para zona "${safeZoneName}" con ${zoneHistoryRecords.length} registros`);
            const zoneSheet = XLSX.utils.json_to_sheet(zoneHistoryRecords);
            XLSX.utils.book_append_sheet(workbook, zoneSheet, safeZoneName);
            console.log(`Hoja para zona "${safeZoneName}" creada correctamente`);
          } catch (error) {
            console.error(`Error creando hoja para zona "${safeZoneName}":`, error);
          }
        } else {
          console.log(`No hay registros para zona "${zoneName}", no se creará hoja`);
        }
      }
      
      // Create complete history sheet with all records
      if (allHistoryRecords.length > 0) {
        try {
          console.log(`Creando hoja de historial completo con ${allHistoryRecords.length} registros`);
          const historySheet = XLSX.utils.json_to_sheet(allHistoryRecords);
          XLSX.utils.book_append_sheet(workbook, historySheet, 'Historial Completo');
          console.log("Hoja de historial completo creada correctamente");
        } catch (error) {
          console.error("Error creando hoja de historial completo:", error);
        }
      } else {
        console.log("No hay registros de historial para ningún territorio");
        
        // Create empty history sheet
        const emptyHistorySheet = XLSX.utils.aoa_to_sheet([
          ['Territorio', 'Zona', 'Publicador', 'Fecha de asignación', 'Fecha de devolución', 'Fecha de expiración', 'Estado', 'Google Maps'],
          ['No hay registros de historial', '', '', '', '', '', '', '']
        ]);
        XLSX.utils.book_append_sheet(workbook, emptyHistorySheet, 'Historial Completo');
      }
      
      // Generate file and download
      console.log("Generando archivo Excel...");
      XLSX.writeFile(workbook, `Territorios_Historial_Completo.xlsx`);
      
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
