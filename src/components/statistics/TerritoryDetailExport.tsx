
import React from 'react';
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { Territory, TerritoryHistory } from '@/types/territory-types';

type TerritoryDetailExportProps = {
  territory: Territory | null;
  history: TerritoryHistory[];
};

const TerritoryDetailExport = ({ territory, history }: TerritoryDetailExportProps) => {
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

  const handleExport = () => {
    if (!territory) return;
    
    // Prepare data for export
    const exportData = history.map(record => ({
      'Territorio': territory.name,
      'Zona': territory.zone?.name || 'Sin zona',
      'Publicador': record.publisher_name,
      'Fecha de asignación': formatDate(record.assigned_at),
      'Fecha de devolución': record.status === "returned" ? formatDate(record.expires_at) : '—',
      'Estado': getStatus(record.status),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Territorio
      { wch: 15 }, // Zona
      { wch: 20 }, // Publicador
      { wch: 20 }, // Fecha asignación
      { wch: 20 }, // Fecha devolución
      { wch: 15 }  // Estado
    ];
    worksheet['!cols'] = columnWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Territorio ${territory.name}`);
    
    // Generate file and download
    XLSX.writeFile(workbook, `Historial_Territorio_${territory.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={!territory || history.length === 0}
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Exportar Excel
    </Button>
  );
};

export default TerritoryDetailExport;
