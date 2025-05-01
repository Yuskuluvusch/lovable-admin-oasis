
import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Territory } from '@/types/territory-types';
import { supabase } from "@/integrations/supabase/client";

type StatisticsExportProps = {
  territories: Territory[];
};

const StatisticsExport = ({ territories }: StatisticsExportProps) => {
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
    
    // For each zone, create a worksheet with all territory history
    for (const [zoneName, zoneTeritories] of Object.entries(territoriesByZone)) {
      // Fetch territory history data for all territories in this zone
      const territoryHistoryData = [];
      
      for (const territory of zoneTeritories) {
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

        // Transform history data for export
        const historyRows = historyData.map((record: any) => ({
          'Territorio': territory.name,
          'Zona': zoneName,
          'Publicador': record.publishers?.name || 'Desconocido',
          'Fecha de asignación': formatDate(record.assigned_at),
          'Fecha de expiración': record.expires_at ? formatDate(record.expires_at) : '—',
          'Fecha de devolución': record.returned_at ? formatDate(record.returned_at) : '—',
          'Estado': getStatus(record.status),
          'Google Maps': territory.google_maps_link || 'N/A'
        }));

        // If territory has no history, add a row with basic info
        if (historyRows.length === 0) {
          territoryHistoryData.push({
            'Territorio': territory.name,
            'Zona': zoneName,
            'Publicador': 'N/A',
            'Fecha de asignación': 'Nunca asignado',
            'Fecha de expiración': 'N/A',
            'Fecha de devolución': 'N/A',
            'Estado': 'Disponible',
            'Google Maps': territory.google_maps_link || 'N/A'
          });
        } else {
          territoryHistoryData.push(...historyRows);
        }
      }

      // Create worksheet for this zone
      if (territoryHistoryData.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(territoryHistoryData);
        
        // Set column widths
        const columnWidths = [
          { wch: 15 },  // Territorio
          { wch: 15 },  // Zona
          { wch: 20 },  // Publicador
          { wch: 20 },  // Fecha asignación
          { wch: 20 },  // Fecha expiración
          { wch: 20 },  // Fecha devolución
          { wch: 15 },  // Estado
          { wch: 50 }   // Google Maps
        ];
        worksheet['!cols'] = columnWidths;
        
        // Add worksheet to workbook
        // Use a safe sheet name (max 31 chars, no special chars)
        const safeZoneName = zoneName.substring(0, 30).replace(/[\\\/\[\]\*\?:]/g, '_');
        XLSX.utils.book_append_sheet(workbook, worksheet, safeZoneName);
      }
    }
    
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
    
    // Generate file and download
    XLSX.writeFile(workbook, `Territorios_Completo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={territories.length === 0}
      className="w-full sm:w-auto"
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Exportar Excel Completo
    </Button>
  );
};

export default StatisticsExport;
