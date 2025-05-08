
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FilterControls from "./FilterControls";
import ExportButtons from "./ExportButtons";
import AssignmentsSummary from "./AssignmentsSummary";
import { useAssignments } from "@/hooks/useAssignments";
import { useTerritoryExport } from "@/hooks/useTerritoryExport";

interface Territory {
  id: string;
  name: string;
}

interface Publisher {
  id: string;
  name: string;
}

const StatisticsExport = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<string | "all">("all");
  const [selectedPublisher, setSelectedPublisher] = useState<string | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { allAssignments, currentAssignmentsCount, expiredAssignmentsCount, pendingReturnAssignmentsCount, isLoading } = useAssignments();
  const { exportTerritoriesByAssignment, exportAssignmentHistory, exporting } = useTerritoryExport();

  useEffect(() => {
    fetchTerritories();
    fetchPublishers();
  }, []);

  const fetchTerritories = async () => {
    try {
      const { data, error } = await supabase.from("territories").select("id, name");
      if (error) {
        throw error;
      }
      setTerritories(data || []);
    } catch (error) {
      console.error("Error fetching territories:", error);
      toast.error("Error al cargar territorios");
    }
  };

  const fetchPublishers = async () => {
    try {
      const { data, error } = await supabase.from("publishers").select("id, name");
      if (error) {
        throw error;
      }
      setPublishers(data || []);
    } catch (error) {
      console.error("Error fetching publishers:", error);
      toast.error("Error al cargar publicadores");
    }
  };

  const handleExportAssignments = () => {
    exportTerritoriesByAssignment(allAssignments, {
      selectedTerritory,
      selectedPublisher,
      dateRange
    });
  };

  const handleExportHistory = () => {
    exportAssignmentHistory(selectedTerritory, selectedPublisher, dateRange);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Datos</CardTitle>
        <CardDescription>
          Exporta la información de los territorios asignados en formato Excel.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <FilterControls 
          territories={territories}
          publishers={publishers}
          selectedTerritory={selectedTerritory}
          setSelectedTerritory={setSelectedTerritory}
          selectedPublisher={selectedPublisher}
          setSelectedPublisher={setSelectedPublisher}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      </CardContent>
      
      <ExportButtons 
        onExportAssignments={handleExportAssignments}
        onExportHistory={handleExportHistory}
        isLoading={isLoading}
        exporting={exporting}
        selectedTerritory={selectedTerritory}
        selectedPublisher={selectedPublisher}
        dateRange={dateRange}
      />
      
      <CardContent>
        <AssignmentsSummary 
          totalAssignments={allAssignments.length}
          currentAssignments={currentAssignmentsCount}
          expiredAssignments={expiredAssignmentsCount}
          pendingReturnAssignments={pendingReturnAssignmentsCount}
        />
      </CardContent>
    </Card>
  );
};

export default StatisticsExport;
