import React from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { Territory } from '@/types/territory-types';
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
      case 'assigned':
        return 'Asignado';
      case 'returned':
        return 'Devuelto';
      default:
        return 'Desconocido';
    }
  };

  const handleExport = async () => {
    if (territories.length === 0) return;

    toast({
      title: 'Exportando datos',
      description: 'Recopilando el historial completo de todos los territorios...'
    });

    try {
      const territoriesByZone = territories.reduce((acc, territory) => {
        const zoneName = territory.zone?.name || 'Sin zona';
        if (!acc[zoneName]) acc[zoneName] = [];
        acc[zoneName].push(territory);
        return acc;
      }, {});

      const workbook = XLSX.utils.book_new();
      const columns = ['Territorio', 'Zona', 'Publicador', 'Fecha asignación', 'Fecha devolución', 'Fecha expiración', 'Estado'];

      for (const [zoneName, zoneTerritories] of Object.entries(territoriesByZone)) {
        const zoneWs = XLSX.utils.aoa_to_sheet([[]]);
        let currentCol = 0;

        for (const territory of zoneTerritories) {
          const { data: historyData, error } = await supabase
            .from('assigned_territories')
            .select(`id, territory_id, publisher_id, assigned_at, expires_at, returned_at, status, publishers(name)`)
            .eq('territory_id', territory.id)
            .order('assigned_at', { ascending: false });

          if (error) continue;

          XLSX.utils.sheet_add_aoa(zoneWs, [[`Territorio ${territory.name}`]], { origin: { r: 0, c: currentCol } });
          XLSX.utils.sheet_add_aoa(zoneWs, [columns], { origin: { r: 1, c: currentCol } });

          if (historyData && historyData.length > 0) {
            historyData.forEach((record, rowIndex) => {
              const row = [
                territory.name,
                zoneName,
                record.publishers?.name || 'Desconocido',
                formatDate(record.assigned_at),
                record.returned_at ? formatDate(record.returned_at) : '—',
                record.expires_at ? formatDate(record.expires_at) : '—',
                getStatus(record.status)
              ];
              XLSX.utils.sheet_add_aoa(zoneWs, [row], { origin: { r: rowIndex + 2, c: currentCol } });
            });
          } else {
            const row = [territory.name, zoneName, 'N/A', 'Nunca asignado', 'N/A', 'N/A', 'Disponible'];
            XLSX.utils.sheet_add_aoa(zoneWs, [row], { origin: { r: 2, c: currentCol } });
          }

          zoneWs['!cols'] = zoneWs['!cols'] || [];
          for (let i = 0; i < columns.length; i++) {
            zoneWs['!cols'][currentCol + i] = { wch: 18 };
          }

          currentCol += columns.length + 1;
        }

        const safeZoneName = zoneName.substring(0, 30).replace(/[\\/\[\]\*\?:]/g, '_');
        XLSX.utils.book_append_sheet(workbook, zoneWs, safeZoneName);
      }

      XLSX.writeFile(workbook, `Territorios_Historial_Completo.xlsx`);

      toast({
        title: 'Exportación completada',
        description: 'El archivo completo se ha descargado correctamente.'
      });
    } catch (err) {
      console.error('Error exportando:', err);
      toast({
        title: 'Error',
        description: 'Hubo un problema al exportar los datos.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Button onClick={handleExport} disabled={territories.length === 0}>
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Exportar Historial Completo
    </Button>
  );
};

export default StatisticsExport;

