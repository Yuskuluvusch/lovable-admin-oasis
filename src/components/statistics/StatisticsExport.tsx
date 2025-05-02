import React from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const StatisticsExport = ({ territories }) => {
  const { toast } = useToast();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
  };

  const getStatus = (status) => {
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
      const workbook = XLSX.utils.book_new();
      const columns = ['Territorio', 'Zona', 'Publicador', 'Fecha asignación', 'Fecha devolución', 'Fecha expiración', 'Estado'];

      // Primero, traer TODO assigned_territories de una vez
      const { data: allHistory, error } = await supabase
        .from('assigned_territories')
        .select('id, territory_id, publisher_id, assigned_at, expires_at, returned_at, status, publishers(name), territories(id, name, zone(name))')
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      // Agrupar por zona y por territorio
      const zones = {};

      allHistory.forEach(record => {
        const territory = record.territories;
        const zoneName = territory.zone?.name || 'Sin zona';
        if (!zones[zoneName]) zones[zoneName] = {};
        if (!zones[zoneName][territory.id]) zones[zoneName][territory.id] = {
          name: territory.name,
          records: []
        };
        zones[zoneName][territory.id].records.push(record);
      });

      // Por cada zona, crear hoja
      for (const [zoneName, territoriesInZone] of Object.entries(zones)) {
        const sheet = XLSX.utils.aoa_to_sheet([[]]);
        let currentCol = 0;

        for (const [territoryId, territoryData] of Object.entries(territoriesInZone)) {
          const { name, records } = territoryData;

          XLSX.utils.sheet_add_aoa(sheet, [[`Territorio ${name}`]], { origin: { r: 0, c: currentCol } });
          XLSX.utils.sheet_add_aoa(sheet, [columns], { origin: { r: 1, c: currentCol } });

          if (records.length > 0) {
            records.forEach((rec, idx) => {
              const row = [
                name,
                zoneName,
                rec.publishers?.name || 'Desconocido',
                formatDate(rec.assigned_at),
                rec.returned_at ? formatDate(rec.returned_at) : '—',
                rec.expires_at ? formatDate(rec.expires_at) : '—',
                getStatus(rec.status)
              ];
              XLSX.utils.sheet_add_aoa(sheet, [row], { origin: { r: idx + 2, c: currentCol } });
            });
          } else {
            const emptyRow = [name, zoneName, 'N/A', 'Nunca asignado', 'N/A', 'N/A', 'Disponible'];
            XLSX.utils.sheet_add_aoa(sheet, [emptyRow], { origin: { r: 2, c: currentCol } });
          }

          sheet['!cols'] = sheet['!cols'] || [];
          for (let i = 0; i < columns.length; i++) {
            sheet['!cols'][currentCol + i] = { wch: 18 };
          }

          currentCol += columns.length + 1;
        }

        const safeName = zoneName.substring(0, 30).replace(/[\\/\[\]\*\?:]/g, '_');
        XLSX.utils.book_append_sheet(workbook, sheet, safeName);
      }

      XLSX.writeFile(workbook, `Territorios_Historial_Completo.xlsx`);
      toast({ title: 'Completado', description: 'El archivo se ha descargado correctamente.' });
    } catch (err) {
      console.error('Error exportando:', err);
      toast({ title: 'Error', description: 'Ocurrió un problema al exportar.', variant: 'destructive' });
    }
  };

  return (
    <Button onClick={handleExport}>
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Exportar Historial Completo
    </Button>
  );
};

export default StatisticsExport;
