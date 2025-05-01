
import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { File } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const StatisticsExcelFormatter = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Check if it's a valid Excel file with the right name pattern
    if (!file.name.startsWith('Territorios_Completo_')) {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo con el formato: Territorios_Completo_YYYY-MM-DD.xlsx",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Create a new workbook for the reorganized data
      const newWorkbook = XLSX.utils.book_new();
      
      // Process each zone sheet (ignoring the "Resumen" sheet)
      const zones = workbook.SheetNames.filter(name => name !== 'Resumen');
      
      for (const zoneName of zones) {
        // Get the worksheet for this zone
        const worksheet = workbook.Sheets[zoneName];
        
        // Convert to JSON for easy manipulation
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
        
        // Group data by territory
        const territoriesByName: Record<string, any[]> = {};
        
        jsonData.forEach(row => {
          const territoryName = row['Territorio'];
          if (!territoriesByName[territoryName]) {
            territoriesByName[territoryName] = [];
          }
          territoriesByName[territoryName].push(row);
        });
        
        // Create a new worksheet for this zone
        const newWs = XLSX.utils.aoa_to_sheet([[]]); // Start with empty worksheet
        
        // Set up default column width
        const defaultColWidth = 15;
        newWs['!cols'] = [];
        
        // Process each territory
        const territoryNames = Object.keys(territoriesByName).sort();
        let currentCol = 0;
        
        for (const territoryName of territoryNames) {
          const territoryData = territoriesByName[territoryName];
          
          // Define the columns for this territory
          const columns = [
            'Territorio', 'Zona', 'Publicador', 'Fecha de asignación', 
            'Fecha de expiración', 'Fecha de devolución', 'Estado', 'Google Maps'
          ];
          
          // Add territory name as a header
          XLSX.utils.sheet_add_aoa(
            newWs, 
            [[`Territorio ${territoryName}`]], 
            { origin: { r: 0, c: currentCol } }
          );
          
          // Add column headers
          XLSX.utils.sheet_add_aoa(
            newWs, 
            [columns.map(col => col === 'Google Maps' ? 'Maps' : col)], 
            { origin: { r: 1, c: currentCol } }
          );
          
          // Add territory data
          territoryData.forEach((row, rowIndex) => {
            const rowData = columns.map(col => row[col] || '');
            XLSX.utils.sheet_add_aoa(
              newWs, 
              [rowData], 
              { origin: { r: rowIndex + 2, c: currentCol } }
            );
          });
          
          // Set column widths for this territory block
          for (let i = 0; i < columns.length; i++) {
            const width = columns[i] === 'Google Maps' ? 30 : 
                          columns[i] === 'Publicador' ? 20 :
                          columns[i].includes('Fecha') ? 18 : 
                          defaultColWidth;
            
            newWs['!cols'][currentCol + i] = { wch: width };
          }
          
          // Move to the next territory block (leave one empty column)
          currentCol += columns.length + 1;
        }
        
        // Add the zone worksheet to the new workbook
        XLSX.utils.book_append_sheet(newWorkbook, newWs, zoneName);
      }
      
      // Write the file and trigger download
      XLSX.writeFile(newWorkbook, `Territorios_Historial_Completo.xlsx`);
      
      toast({
        title: "Éxito",
        description: "Archivo procesado y reorganizado correctamente.",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Hubo un error al procesar el archivo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      // Reset the file input
      if (e.target) e.target.value = '';
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        variant="outline" 
        className="relative w-full sm:w-auto overflow-hidden"
        disabled={isProcessing}
      >
        <File className="mr-2 h-4 w-4" />
        {isProcessing ? 'Procesando...' : 'Procesar archivo exportado'}
        <input
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer"
          accept=".xlsx"
          onChange={handleFileUpload}
          disabled={isProcessing}
        />
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Selecciona un archivo Territorios_Completo_*.xlsx
      </p>
    </div>
  );
};

export default StatisticsExcelFormatter;
