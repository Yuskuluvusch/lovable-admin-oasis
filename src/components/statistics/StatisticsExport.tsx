
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

// Define interfaces para los datos recuperados de Supabase
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
  publishers: Publisher | null;
}

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
      
      // Prepare a single worksheet for the complete history of all territories
      const historyData: any[] = [];
      
      // Process each territory to collect its history
      for (const territory of territories) {
        // Get territory history data - Corregimos la consulta para especificar la relación correcta
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
            publishers!assigned_territories_publisher_id_fkey(name)
          `)
          .eq("territory_id", territory.id)
          .order("assigned_at", { ascending: false });

        if (historyError) {
          console.error(`Error fetching history for territory ${territory.name}:`, historyError);
          continue;
        }

        if (historyRecords && historyRecords.length > 0) {
          // Add each history record to the consolidated data
          historyRecords.forEach((record: any) => {
            historyData.push({
              'Territorio': territory.name,
              'Zona': territory.zone?.name || 'Sin zona',
              'Publicador': record.publishers?.name || 'Desconocido',
              'Fecha de asignación': formatDate(record.assigned_at),
              'Fecha de expiración': record.expires_at ? formatDate(record.expires_at) : '—',
              'Fecha de devolución': record.returned_at ? formatDate(record.returned_at) : '—',
              'Estado': getStatus(record.status),
              'Google Maps': territory.google_maps_link || 'N/A'
            });
          });
        } else {
          // If no history, add a single row with territory data
          historyData.push({
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
      }
      
      // Create the complete history sheet
      const historySheet = XLSX.utils.json_to_sheet(historyData);
      
      // Set column widths for history sheet
      const historyColumnWidths = [
        { wch: 15 }, // Territorio
        { wch: 15 }, // Zona
        { wch: 20 }, // Publicador
        { wch: 20 }, // Fecha de asignación
        { wch: 20 }, // Fecha de expiración
        { wch: 20 }, // Fecha de devolución
        { wch: 15 }, // Estado
        { wch: 50 }  // Google Maps
      ];
      historySheet['!cols'] = historyColumnWidths;
      
      // Add history sheet to workbook
      XLSX.utils.book_append_sheet(workbook, historySheet, 'Historial Completo');
      
      // Also create individual sheets for each zone for better organization
      for (const [zoneName, zoneTerritories] of Object.entries(territoriesByZone)) {
        // Collect history data for this zone
        const zoneHistoryData: any[] = [];
        
        for (const territory of zoneTerritories) {
          // Get territory history data - Corregimos la consulta para especificar la relación correcta
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
              publishers!assigned_territories_publisher_id_fkey(name)
            `)
            .eq("territory_id", territory.id)
            .order("assigned_at", { ascending: false });

          if (zoneHistoryError) {
            console.error(`Error fetching history for territory ${territory.name}:`, zoneHistoryError);
            continue;
          }

          if (zoneHistoryRecords && zoneHistoryRecords.length > 0) {
            // Add each history record to the zone data
            zoneHistoryRecords.forEach((record: any) => {
              zoneHistoryData.push({
                'Territorio': territory.name,
                'Publicador': record.publishers?.name || 'Desconocido',
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
        }
        
        // Create zone history sheet
        const zoneHistorySheet = XLSX.utils.json_to_sheet(zoneHistoryData);
        
        // Set column widths for zone history sheet
        const zoneHistoryColumnWidths = [
          { wch: 15 }, // Territorio
          { wch: 20 }, // Publicador
          { wch: 20 }, // Fecha de asignación
          { wch: 20 }, // Fecha de expiración
          { wch: 20 }, // Fecha de devolución
          { wch: 15 }, // Estado
          { wch: 50 }  // Google Maps
        ];
        zoneHistorySheet['!cols'] = zoneHistoryColumnWidths;
        
        // Add zone history sheet to workbook
        const safeZoneName = zoneName.substring(0, 30).replace(/[\\\/\[\]\*\?:]/g, '_');
        XLSX.utils.book_append_sheet(workbook, zoneHistorySheet, safeZoneName);
      }
      
      // Generate file and download
      XLSX.writeFile(workbook, `Territorios_Historial_Completo.xlsx`);
      
      toast({
        title: "Exportación completada",
        description: "El archivo con el historial completo de territorios se ha descargado correctamente.",
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
