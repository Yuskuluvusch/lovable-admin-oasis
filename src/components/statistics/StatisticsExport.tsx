
import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { Territory } from '@/types/territory-types';

type StatisticsExportProps = {
  territories: Territory[];
};

const StatisticsExport = ({ territories }: StatisticsExportProps) => {
  const handleExport = () => {
    // Prepare data for export
    const exportData = territories.map(territory => ({
      'Territorio': territory.name,
      'Zona': territory.zone?.name || 'Sin zona',
      'Estado': territory.last_assigned_at ? 'Asignado' : 'Disponible',
      'Google Maps': territory.google_maps_link || 'N/A'
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Territorio
      { wch: 20 }, // Zona
      { wch: 15 }, // Estado
      { wch: 50 }  // Google Maps
    ];
    worksheet['!cols'] = columnWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Territorios');
    
    // Generate file and download
    XLSX.writeFile(workbook, `Territorios_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={territories.length === 0}
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Exportar Excel
    </Button>
  );
};

export default StatisticsExport;
