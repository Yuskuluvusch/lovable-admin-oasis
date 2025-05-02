
import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Territory } from '@/types/territory-types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type StatisticsExportProps = {
  territories: Territory[];
};

interface Publisher {
  name: string;
}

interface AssignmentRecord {
  id: string;
  territory_id: string;
  publisher_id: string;
  assigned_at: string;
  expires_at: string | null;
  returned_at: string | null;
  status: string;
  publishers: Publisher;
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

  const getStatus = (status: string | null) => {
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
      console.log(`Starting export for ${territories.length} territories`);
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Create summary worksheet data
      const summaryRows = territories.map(territory => ({
        'Territorio': territory.name,
        'Zona': territory.zone?.name || 'Sin zona',
        'Estado': territory.last_assigned_at ? 'Asignado' : 'Disponible',
        'Última Asignación': territory.last_assigned_at ? formatDate(territory.last_assigned_at) : 'Nunca asignado',
        'Última Devolución': territory.last_returned_at ? formatDate(territory.last_returned_at) : 'N/A',
        'Google Maps': territory.google_maps_link || 'N/A'
      }));
      
      console.log(`Creating summary sheet with ${summaryRows.length} rows`);

      // Create summary worksheet
      if (summaryRows.length > 0) {
        try {
          const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
          XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
          console.log("Summary sheet created successfully");
        } catch (error) {
          console.error("Error creating summary sheet:", error);
          // Create empty summary sheet with headers if creation fails
          const emptySummarySheet = XLSX.utils.aoa_to_sheet([
            ['Territorio', 'Zona', 'Estado', 'Última Asignación', 'Última Devolución', 'Google Maps'],
            ['Error al crear hoja de resumen', '', '', '', '', '']
          ]);
          XLSX.utils.book_append_sheet(workbook, emptySummarySheet, 'Resumen');
        }
      } else {
        // Create empty summary sheet with headers if no data
        const emptySummarySheet = XLSX.utils.aoa_to_sheet([
          ['Territorio', 'Zona', 'Estado', 'Última Asignación', 'Última Devolución', 'Google Maps'],
          ['No hay territorios', '', '', '', '', '']
        ]);
        XLSX.utils.book_append_sheet(workbook, emptySummarySheet, 'Resumen');
      }
      
      // Collect all history data
      const allHistoryData = [];
      
      // Process each territory to collect history
      for (const territory of territories) {
        console.log(`Fetching history for territory: ${territory.name} (${territory.id})`);
        
        try {
          // Get territory history data
          const { data: historyRecords, error: historyError } = await supabase
            .from("assigned_territories")
            .select(`
              id,
              territory_id,
              publisher_id,
              assigned_at,
              expires_at,
              returned_at,
              status,
              publishers(name)
            `)
            .eq("territory_id", territory.id)
            .order("assigned_at", { ascending: false });
          
          if (historyError) {
            console.error(`Error fetching history for territory ${territory.name}:`, historyError);
            continue;
          }
          
          console.log(`Retrieved ${historyRecords?.length || 0} history records for territory ${territory.name}`);
          
          if (historyRecords && historyRecords.length > 0) {
            historyRecords.forEach((record: any) => {
              const publisherName = record.publishers?.name || 'Desconocido';
              
              allHistoryData.push({
                'Territorio': territory.name,
                'Zona': territory.zone?.name || 'Sin zona',
                'Publicador': publisherName,
                'Fecha de asignación': formatDate(record.assigned_at),
                'Fecha de expiración': record.expires_at ? formatDate(record.expires_at) : '—',
                'Fecha de devolución': record.returned_at ? formatDate(record.returned_at) : '—',
                'Estado': getStatus(record.status),
                'Google Maps': territory.google_maps_link || 'N/A'
              });
            });
          } else {
            // If no history, add a single row with territory data
            allHistoryData.push({
              'Territorio': territory.name,
              'Zona': territory.zone?.name || 'Sin zona',
              'Publicador': 'N/A',
              'Fecha de asignación': 'Nunca asignado',
              'Fecha de expiración': 'N/A',
              'Fecha de devolución': 'N/A',
              'Estado': 'Disponible',
              'Google Maps': territory.google_maps_link || 'N/A'
            });
          }
        } catch (territoryError) {
          console.error(`Error processing territory ${territory.name}:`, territoryError);
          
          // Add error record
          allHistoryData.push({
            'Territorio': territory.name,
            'Zona': territory.zone?.name || 'Sin zona',
            'Publicador': 'ERROR',
            'Fecha de asignación': 'Error al procesar territorio',
            'Fecha de expiración': 'N/A',
            'Fecha de devolución': 'N/A',
            'Estado': 'Error',
            'Google Maps': territory.google_maps_link || 'N/A'
          });
        }
      }
      
      // Create the complete history sheet
      console.log(`Creating complete history sheet with ${allHistoryData.length} records`);
      
      if (allHistoryData.length > 0) {
        try {
          const historySheet = XLSX.utils.json_to_sheet(allHistoryData);
          XLSX.utils.book_append_sheet(workbook, historySheet, 'Historial Completo');
          console.log("History sheet created successfully");
        } catch (error) {
          console.error("Error creating history sheet:", error);
          
          // Create empty history sheet with headers if creation fails
          const emptyHistorySheet = XLSX.utils.aoa_to_sheet([
            ['Territorio', 'Zona', 'Publicador', 'Fecha de asignación', 'Fecha de expiración', 'Fecha de devolución', 'Estado', 'Google Maps'],
            ['Error al crear hoja de historial', '', '', '', '', '', '', '']
          ]);
          XLSX.utils.book_append_sheet(workbook, emptyHistorySheet, 'Historial Completo');
        }
      } else {
        // Create empty history sheet with headers if no data
        const emptyHistorySheet = XLSX.utils.aoa_to_sheet([
          ['Territorio', 'Zona', 'Publicador', 'Fecha de asignación', 'Fecha de expiración', 'Fecha de devolución', 'Estado', 'Google Maps'],
          ['No hay registros de historial', '', '', '', '', '', '', '']
        ]);
        XLSX.utils.book_append_sheet(workbook, emptyHistorySheet, 'Historial Completo');
      }
      
      // Process territories by zone
      const territoriesByZone: Record<string, Territory[]> = {};
      
      // Group territories by zone for better organization
      territories.forEach(territory => {
        const zoneName = territory.zone?.name || 'Sin zona';
        if (!territoriesByZone[zoneName]) {
          territoriesByZone[zoneName] = [];
        }
        territoriesByZone[zoneName].push(territory);
      });
      
      console.log(`Processing ${Object.keys(territoriesByZone).length} zones`);
      
      // Create zone-specific sheets
      let zoneIndex = 1;
      for (const [zoneName, zoneTerritories] of Object.entries(territoriesByZone)) {
        // Create a safe sheet name - shorter and without special characters
        const safeZoneName = `Zona ${zoneIndex++}`.substring(0, 30);
        
        console.log(`Processing zone: ${zoneName} with ${zoneTerritories.length} territories as "${safeZoneName}"`);
        
        // Collect history data for this zone
        const zoneHistoryData: any[] = [];
        
        for (const territory of zoneTerritories) {
          try {
            // Get territory history data
            const { data: zoneHistoryRecords, error: zoneHistoryError } = await supabase
              .from("assigned_territories")
              .select(`
                id,
                territory_id,
                publisher_id,
                assigned_at,
                expires_at,
                returned_at,
                status,
                publishers(name)
              `)
              .eq("territory_id", territory.id)
              .order("assigned_at", { ascending: false });

            if (zoneHistoryError) {
              console.error(`Error fetching history for territory ${territory.name}:`, zoneHistoryError);
              continue;
            }

            if (zoneHistoryRecords && zoneHistoryRecords.length > 0) {
              zoneHistoryRecords.forEach((record: any) => {
                const publisherName = record.publishers?.name || 'Desconocido';
                
                zoneHistoryData.push({
                  'Territorio': territory.name,
                  'Publicador': publisherName,
                  'Fecha de asignación': formatDate(record.assigned_at),
                  'Fecha de expiración': record.expires_at ? formatDate(record.expires_at) : '—',
                  'Fecha de devolución': record.returned_at ? formatDate(record.returned_at) : '—',
                  'Estado': getStatus(record.status),
                  'Google Maps': territory.google_maps_link || 'N/A'
                });
              });
            } else {
              // If no history, add a single row with territory data
              zoneHistoryData.push({
                'Territorio': territory.name,
                'Publicador': 'N/A',
                'Fecha de asignación': 'Nunca asignado',
                'Fecha de expiración': 'N/A',
                'Fecha de devolución': 'N/A',
                'Estado': 'Disponible',
                'Google Maps': territory.google_maps_link || 'N/A'
              });
            }
          } catch (territoryError) {
            console.error(`Error processing territory ${territory.name}:`, territoryError);
            
            // Add error record
            zoneHistoryData.push({
              'Territorio': territory.name,
              'Publicador': 'ERROR',
              'Fecha de asignación': 'Error al procesar territorio',
              'Fecha de expiración': 'N/A',
              'Fecha de devolución': 'N/A',
              'Estado': 'Error',
              'Google Maps': territory.google_maps_link || 'N/A'
            });
          }
        }
        
        console.log(`Creating zone sheet for ${zoneName} with ${zoneHistoryData.length} records`);
        
        // Create zone sheet only if we have data
        if (zoneHistoryData.length > 0) {
          try {
            const zoneHistorySheet = XLSX.utils.json_to_sheet(zoneHistoryData);
            XLSX.utils.book_append_sheet(workbook, zoneHistorySheet, safeZoneName);
            console.log(`Zone sheet "${safeZoneName}" created successfully`);
          } catch (error) {
            console.error(`Error creating zone sheet "${safeZoneName}":`, error);
            
            // Try with a more generic name if failed
            const fallbackName = `Zona ${zoneIndex}`;
            try {
              const zoneEmptySheet = XLSX.utils.aoa_to_sheet([
                ['Territorio', 'Publicador', 'Fecha de asignación', 'Fecha de expiración', 'Fecha de devolución', 'Estado', 'Google Maps'],
                [`Error al crear hoja para zona "${zoneName}"`, '', '', '', '', '', '']
              ]);
              XLSX.utils.book_append_sheet(workbook, zoneEmptySheet, fallbackName);
              console.log(`Fallback zone sheet "${fallbackName}" created successfully`);
            } catch (fallbackError) {
              console.error(`Error creating fallback zone sheet for "${zoneName}":`, fallbackError);
              // Continue with next zone if both attempts fail
            }
          }
        } else {
          // Create empty zone sheet with headers if no data
          try {
            const zoneEmptySheet = XLSX.utils.aoa_to_sheet([
              ['Territorio', 'Publicador', 'Fecha de asignación', 'Fecha de expiración', 'Fecha de devolución', 'Estado', 'Google Maps'],
              [`No hay registros para zona "${zoneName}"`, '', '', '', '', '', '']
            ]);
            XLSX.utils.book_append_sheet(workbook, zoneEmptySheet, safeZoneName);
            console.log(`Empty zone sheet "${safeZoneName}" created successfully`);
          } catch (error) {
            console.error(`Error creating empty zone sheet for "${zoneName}":`, error);
          }
        }
      }
      
      // Generate file and download
      console.log("Generating Excel file...");
      XLSX.writeFile(workbook, `Territorios_Historial_Completo.xlsx`);
      
      toast({
        title: "Exportación completada",
        description: "El archivo con el historial completo de territorios se ha descargado correctamente.",
      });
    } catch (error) {
      console.error("Error exporting territories:", error);
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
