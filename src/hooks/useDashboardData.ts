
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TerritoryStatistics } from "@/types/territory-types";
import { useAuth } from "@/contexts/AuthContext";

export function useDashboardData() {
  const { currentUser } = useAuth();
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [territoryStats, setTerritoryStats] = useState<TerritoryStatistics>({
    total_territories: 0,
    assigned_territories: 0,
    available_territories: 0,
    expired_territories: 0,
    territories_by_zone: [],
    total: 0,
    assigned: 0,
    available: 0
  });

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch admin count
      const { count: adminCount, error: adminError } = await supabase
        .from("administrators")
        .select("*", { count: "exact" });

      if (adminError) {
        console.error("Error fetching admin count:", adminError);
        return;
      }
      
      // Get total count of territories
      const { count: totalTerritories, error: totalError } = await supabase
        .from("territories")
        .select("*", { count: "exact" });
      
      if (totalError) {
        console.error("Error fetching territories count:", totalError);
        return;
      }

      // Get all assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select("territory_id, status, expires_at, returned_at");
      
      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        return;
      }

      // Count assigned and expired territories
      const now = new Date();
      const assignedTerritories = assignments?.filter(a => 
        a.status === "assigned" && 
        !a.returned_at && 
        (!a.expires_at || new Date(a.expires_at) >= now)
      ).length || 0;
      
      const expiredTerritories = assignments?.filter(a => 
        a.status === "assigned" && 
        !a.returned_at && 
        a.expires_at && 
        new Date(a.expires_at) < now
      ).length || 0;

      setAdminCount(adminCount || 0);
      setTerritoryStats({
        total_territories: totalTerritories || 0,
        assigned_territories: assignedTerritories,
        available_territories: (totalTerritories || 0) - (assignedTerritories + expiredTerritories),
        expired_territories: expiredTerritories,
        territories_by_zone: [],
        total: totalTerritories || 0,
        assigned: assignedTerritories,
        available: (totalTerritories || 0) - (assignedTerritories + expiredTerritories)
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { adminCount, isLoading, territoryStats };
}
