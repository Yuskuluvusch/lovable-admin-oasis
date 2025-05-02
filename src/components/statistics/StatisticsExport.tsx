
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

const StatisticsExport = ({ territories }: StatisticsExportProps) => {
  const { toast } = useToast();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "dd MMM yyyy", { locale: es });
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
    if (territories.length === 0) return;

    // Show loading toast
    toast({
      title: "Exportando datos",
      description: "Recopilando el historial de todos los territorios...",
    });

    try {
      // Group territories by zone
      const territoriesByZone = territories.reduce((acc: Record<string, Territory[]>, territory) => {
        const zoneName = territory.zone?.name || 'Sin zona';
        if (!acc[zoneName]) {
          acc[zoneName] = [];
        }
        acc[zoneName].push(territory);
        return acc;
      }, {});

      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Create a summary worksheet with basic territory info
      const summaryData = territories.map(territory => ({
        'Territorio': territory.name,
        'Zona': territory.zone?.name || 'Sin zona',
        'Estado': territory.last_assigned_at ? 'Asignado' : 'Disponible',
        'Última Asignación': territory.last_assigned_at ? formatDate(territory.last_assigned_at) : 'Nunca asignado',
        'Última Devolución': territory.last_returned_at ? formatDate(territory.last_returned_at) : 'N/A',
        'Google Maps': territory.google_maps_link || 'N/A'
      }));
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      
      // Set column widths for summary sheet
      const summaryColumnWidths = [
        { wch: 15 }, // Territorio
        { wch: 15 }, // Zona
        { wch: 15 }, // Estado
        { wch: 20 }, // Última Asignación
        { wch: 20 }, // Última Devolución
        { wch: 50 }  // Google Maps
      ];
      summarySheet['!cols'] = summaryColumnWidths;
      
      // Add summary sheet to beginning of workbook
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen', true);
      
      // Define the columns for territories history
      const columns = [
        'Territorio', 'Zona', 'Publicador', 'Fecha de asignación', 
        'Fecha de expiración', 'Fecha de devolución', 'Estado'
      ];
      
      // Process each zone to create separate worksheets
      for (const [zoneName, zoneTeritories] of Object.entries(territoriesByZone)) {
        // Create a new worksheet for this zone
        const zoneWs = XLSX.utils.aoa_to_sheet([[]]);
        let currentCol = 0;
        
        // Process each territory in the zone
        for (const territory of zoneTeritories) {
          // Get territory history data
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
              publishers(name)
            `)
            .eq("territory_id", territory.id)
            .order("assigned_at", { ascending: false });

          if (historyError) {
            console.error(`Error fetching history for territory ${territory.name}:`, historyError);
            continue;
          }

          // Add territory name as a header
          XLSX.utils.sheet_add_aoa(
            zoneWs, 
            [[`Territorio ${territory.name}`]], 
            { origin: { r: 0, c: currentCol } }
          );
          
          // Add column headers for this territory
          XLSX.utils.sheet_add_aoa(
            zoneWs, 
            [columns], 
            { origin: { r: 1, c: currentCol } }
          );
          
          if (historyData && historyData.length > 0) {
            // Add each history record as a row
            historyData.forEach((record: any, rowIndex) => {
              const rowData = [
                territory.name,                               // Territorio
                zoneName,                                    // Zona
                record.publishers?.name || 'Desconocido',    // Publicador
                formatDate(record.assigned_at),              // Fecha de asignación
                record.expires_at ? formatDate(record.expires_at) : '—', // Fecha de expiración
                record.returned_at ? formatDate(record.returned_at) : '—', // Fecha de devolución
                getStatus(record.status)                     // Estado
              ];
              
              XLSX.utils.sheet_add_aoa(
                zoneWs, 
                [rowData], 
                { origin: { r: rowIndex + 2, c: currentCol } }
              );
            });
          } else {
            // If no history, add a single row with territory data
            const rowData = [
              territory.name,
              zoneName,
              'N/A',
              'Nunca asignado',
              'N/A',
              'N/A',
              'Disponible'
            ];
            
            XLSX.utils.sheet_add_aoa(
              zoneWs, 
              [rowData], 
              { origin: { r: 2, c: currentCol } }
            );
          }
          
          // Set column widths for this territory block
          for (let i = 0; i < columns.length; i++) {
            const width = columns[i] === 'Publicador' ? 20 :
                          columns[i].includes('Fecha') ? 18 : 
                          15;
            
            zoneWs['!cols'] = zoneWs['!cols'] || [];
            zoneWs['!cols'][currentCol + i] = { wch: width };
          }
          
          // Move to the next territory block (leave one empty column)
          currentCol += columns.length + 1;
        }
        
        // Add the zone worksheet to the workbook
        const safeZoneName = zoneName.substring(0, 30).replace(/[\\\/\[\]\*\?:]/g, '_');
        XLSX.utils.book_append_sheet(workbook, zoneWs, safeZoneName);
      }
      
      // Generate file and download
      XLSX.writeFile(workbook, `Territorios_Historial_Completo.xlsx`);
      
      toast({
        title: "Exportación completada",
        description: "El archivo con el historial de territorios se ha descargado correctamente.",
      });
    } catch (error) {
      console.error("Error exporting territories:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al exportar los datos de territorios.",
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
