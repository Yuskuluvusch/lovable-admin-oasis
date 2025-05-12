
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Territory, TerritoryHistory } from "@/types/territory-types";
import { useAuth } from "@/contexts/AuthContext";

export function useTerritoryDetail(territoryId: string | undefined) {
  const { currentUser } = useAuth();
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [history, setHistory] = useState<TerritoryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (territoryId && currentUser) {
      fetchTerritoryDetails(territoryId);
      fetchTerritoryHistory(territoryId);
    }
  }, [territoryId, currentUser]);

  const fetchTerritoryDetails = async (territoryId: string) => {
    try {
      const { data, error } = await supabase
        .from("territories")
        .select(`
          id, name, zone_id, google_maps_link, created_at, updated_at,
          zone:zones(id, name)
        `)
        .eq("id", territoryId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching territory details:", error);
        return;
      }

      // Find the last assigned date
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select("assigned_at")
        .eq("territory_id", territoryId)
        .order("assigned_at", { ascending: false })
        .limit(1);

      if (assignmentsError) {
        console.error("Error fetching assignment history:", assignmentsError);
        return;
      }

      // Handle the potential error in the zone field
      const zoneData = data.zone && typeof data.zone !== 'string'
        ? data.zone 
        : null;

      // Set territory with complete data
      const territoryWithData: Territory = {
        ...data,
        zone: zoneData,
        last_assigned_at: assignments && assignments.length > 0 ? assignments[0].assigned_at : null,
        last_returned_at: null // This will be updated if needed
      };

      setTerritory(territoryWithData);
    } catch (error) {
      console.error("Error in fetchTerritoryDetails:", error);
    }
  };

  const fetchTerritoryHistory = async (territoryId: string) => {
    try {
      const { data, error } = await supabase
        .from("assigned_territories")
        .select(`
          id, territory_id, publisher_id, assigned_at, expires_at, status, token, returned_at,
          publishers:publishers!assigned_territories_publisher_id_fkey(name)
        `)
        .eq("territory_id", territoryId)
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Error fetching territory history:", error);
        return;
      }

      const historyData: TerritoryHistory[] = data.map((item: any) => ({
        id: item.id,
        territory_id: item.territory_id,
        publisher_id: item.publisher_id,
        publisher_name: item.publishers ? item.publishers.name : "Unknown",
        assigned_at: item.assigned_at,
        expires_at: item.expires_at,
        returned_at: item.returned_at,
        status: item.status,
      }));

      setHistory(historyData);
    } catch (error) {
      console.error("Error in fetchTerritoryHistory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    territory,
    history,
    isLoading
  };
}
