
import React from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TerritorySafeData } from '@/types/territory-types';

interface Territory {
  id: string;
  name: string;
  zone_id: string | null;
  zone?: {
    id: string;
    name: string;
  } | null;
}

interface Publisher {
  name: string;
}

// This interface defines what we expect to get from Supabase
interface SupabaseAssignmentRecord {
  id: string;
  territory_id: string;
  publisher_id: string;
  assigned_at: string;
  expires_at: string | null;
  returned_at: string | null;
  status: string | null;
  publishers: Publisher | null;
  territories: Territory | null;
}

// This is our processed record with additional fields
interface AssignmentRecord extends SupabaseAssignmentRecord {
  territory_name: string;
  zone_name: string;
  publisher_name: string;
}

interface TerritoryHistoryData {
  name: string;
  records: AssignmentRecord[];
}

interface StatisticsExportProps {
  territories: TerritorySafeData[];
}

const StatisticsExport: React.FC<StatisticsExportProps> = ({ territories }) => {
  const { toast } = useToast();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
  };

  const getStatus = (status: string | null) => {
    switch (status) {
      case 'assigned': return 'Asignado';
      case 'returned': return 'Devuelto';
      default: return 'Desconocido';
    }
  };

  const handleExport = async () => {
    if (territories.length === 0) return;

    toast({ title: 'Exportando', description: 'Descargando historial completo de todos los territorios desde assigned_territories...' });

    try {
      // Crear un nuevo libro de Excel
      const workbook = XLSX.utils.book_new();
      
      // Definir las columnas del historial
      const columns = ['Territorio', 'Zona', 'Publicador', 'Fecha asignación', 'Fecha devolución', 'Fecha expiración', 'Estado'];

      // Traer TODO el historial de assigned_territories en una sola consulta
      const { data: allHistory, error } = await supabase
        .from('assigned_territories')
        .select(`
          id, 
          territory_id, 
          publisher_id, 
          assigned_at, 
          expires_at, 
          returned_at, 
          status, 
          publishers:publisher_id(name), 
          territories:territory_id(id, name, zone_id, zone:zones(id, name))
        `)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      if (!allHistory || !Array.isArray(allHistory)) {
        throw new Error('No se pudo recuperar el historial');
      }

      // Organizar los datos por zona y por territorio
      const zoneMap = new Map<string, Map<string, TerritoryHistoryData>>();

      // Primero agrupar por zona
      (allHistory as SupabaseAssignmentRecord[]).forEach((record) => {
        const territory = record.territories;
        if (!territory) return; // Skip if territory is missing
        
        const zoneName = territory.zone?.name || 'Sin zona';
        
        if (!zoneMap.has(zoneName)) {
          zoneMap.set(zoneName, new Map<string, TerritoryHistoryData>());
        }
        
        const territoryMap = zoneMap.get(zoneName)!;
        const territoryId = territory.id;
        
        if (!territoryMap.has(territoryId)) {
          territoryMap.set(territoryId, {
            name: territory.name,
            records: []
          });
        }
        
        // Process the record to ensure it matches our AssignmentRecord interface
        const processedRecord: AssignmentRecord = {
          ...record,
          territory_name: territory.name,
          zone_name: zoneName,
          publisher_name: record.publishers?.name || 'Desconocido'
        };
        
        territoryMap.get(territoryId)!.records.push(processedRecord);
      });

      // Crear hoja de resumen
      const summaryData = [
        ['Reporte de Historial de Territorios'],
        ['Generado el', formatDate(new Date().toISOString())],
        [''],
        ['Zonas', zoneMap.size],
        ['Territorios', territories.length],
        ['Registros de historial', allHistory.length]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

      // Para cada zona, crear una hoja
      for (const [zoneName, territories] of Array.from(zoneMap.entries())) {
        const sheetData: any[][] = [];
        let currentRow = 0;
        
        // Para cada territorio en esta zona
        let currentCol = 0;
        const territoriesArray = Array.from(territories.entries());
        
        for (const [territoryId, territoryData] of territoriesArray) {
          const { name, records } = territoryData;
          
          // Si es necesario empezar una nueva fila (para que quepan 3 territorios por fila)
          if (currentCol > 0 && currentCol + columns.length > 20) {
            // Añadir filas vacías entre bloques de territorios
            const emptyRowsNeeded = 3; // Ajustar según necesidades
            for (let i = 0; i < emptyRowsNeeded; i++) {
              const emptyRow = Array(30).fill(''); // Ancho suficiente para cubrir todas las columnas
              sheetData.push(emptyRow);
              currentRow++;
            }
            currentCol = 0;
          }
          
          // Añadir el título del territorio
          // Asegurarnos de que hay suficientes filas para este territorio
          while (sheetData.length <= currentRow) {
            sheetData.push(Array(30).fill(''));
          }
          
          // Título del territorio
          sheetData[currentRow][currentCol] = `Territorio ${name}`;
          currentRow++;
          
          // Encabezados de columna
          while (sheetData.length <= currentRow) {
            sheetData.push(Array(30).fill(''));
          }
          
          for (let i = 0; i < columns.length; i++) {
            sheetData[currentRow][currentCol + i] = columns[i];
          }
          currentRow++;
          
          // Datos del historial
          if (records.length > 0) {
            records.forEach(record => {
              while (sheetData.length <= currentRow) {
                sheetData.push(Array(30).fill(''));
              }
              
              const rowData = [
                name,
                zoneName,
                record.publisher_name,
                formatDate(record.assigned_at),
                record.returned_at ? formatDate(record.returned_at) : '—',
                record.expires_at ? formatDate(record.expires_at) : '—',
                getStatus(record.status)
              ];
              
              for (let i = 0; i < rowData.length; i++) {
                sheetData[currentRow][currentCol + i] = rowData[i];
              }
              
              currentRow++;
            });
          } else {
            // Si no hay registros para este territorio
            while (sheetData.length <= currentRow) {
              sheetData.push(Array(30).fill(''));
            }
            
            const emptyRow = [name, zoneName, 'N/A', 'Nunca asignado', 'N/A', 'N/A', 'Disponible'];
            for (let i = 0; i < emptyRow.length; i++) {
              sheetData[currentRow][currentCol + i] = emptyRow[i];
            }
            currentRow++;
          }
          
          // Avanzar a la siguiente columna para el próximo territorio
          // Dejar una columna vacía entre territorios
          currentCol += columns.length + 1;
          
          // Si es el último territorio o si el siguiente territorio no cabe, avanzar a la próxima fila
          if (currentCol + columns.length > 20) {
            currentRow += 2; // Dejar una fila vacía entre bloques de territorios
            currentCol = 0;
          }
        }
        
        // Convertir los datos a una hoja de Excel
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        
        // Ajustar anchos de columna
        const colWidths = [];
        for (let i = 0; i < 30; i++) {
          colWidths.push({ wch: 15 }); // 15 caracteres de ancho
        }
        sheet['!cols'] = colWidths;
        
        // Nombre seguro para la hoja (Excel tiene limitaciones en los nombres de las hojas)
        const safeName = zoneName.substring(0, 30).replace(/[\\/\[\]\*\?:]/g, '_');
        
        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(workbook, sheet, safeName);
      }

      // Descargar el archivo
      XLSX.writeFile(workbook, `Territorios_Historial_Completo.xlsx`);
      toast({ title: 'Completado', description: 'El archivo se ha descargado correctamente.' });
    } catch (err) {
      console.error('Error exportando:', err);
      toast({ title: 'Error', description: 'Ocurrió un problema al exportar.', variant: 'destructive' });
    }
  };

  return (
    <Button onClick={handleExport}>
      <FileText className="mr-2 h-4 w-4" />
      Exportar Historial Completo
    </Button>
  );
};

export default StatisticsExport;
