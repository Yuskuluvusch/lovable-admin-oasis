
import React from "react";
import { useStatisticsData } from "@/hooks/useStatisticsData";
import StatsSummaryCards from "@/components/statistics/StatsSummaryCards";
import TerritoriesTable from "@/components/statistics/TerritoriesTable";
import StatisticsExport from "@/components/statistics/StatisticsExport";

const Statistics = () => {
  const { filteredTerritories, isLoading, stats } = useStatisticsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Estadísticas de Territorios</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Visualiza y analiza información sobre los territorios.
        </p>
      </div>

      <StatsSummaryCards stats={stats} isLoading={isLoading} />

      <div className="w-full">
        <StatisticsExport />
      </div>

      <TerritoriesTable 
        filteredTerritories={filteredTerritories}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Statistics;
