
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TerritorySafeData, TerritoryStatistics } from "@/types/territory-types";

export function useStatisticsData() {
  const [territories, setTerritories] = useState<TerritorySafeData[]>([]);
  const [filteredTerritories, setFilteredTerritories] = useState<TerritorySafeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<TerritoryStatistics>({
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
    fetchTerritories();
  }, []);

  useEffect(() => {
    setFilteredTerritories(territories);
  }, [territories]);

  const fetchTerritories = async () => {
    setIsLoading(true);
    try {
      // Fetch all territories
      const { data: territoriesData, error: territoriesError } = await supabase
        .from("territories")
        .select(`
          id, name, zone_id, google_maps_link, created_at, updated_at,
          zone:zones(id, name)
        `)
        .order("name");

      if (territoriesError) {
        console.error("Error fetching territories:", territoriesError);
        return;
      }

      // Fetch assigned territories to get last assigned date and expiration date
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select("territory_id, assigned_at, expires_at, status, returned_at")
        .order("assigned_at", { ascending: false });

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        return;
      }

      // Create maps for latest assignment data
      const lastAssignedMap = new Map();
      const expiryDateMap = new Map();
      const assignedStatusMap = new Map();
      assignmentsData?.forEach((assignment) => {
        if (!lastAssignedMap.has(assignment.territory_id)) {
          lastAssignedMap.set(assignment.territory_id, assignment.assigned_at);
          expiryDateMap.set(assignment.territory_id, assignment.expires_at);
          assignedStatusMap.set(assignment.territory_id, {
            status: assignment.status,
            returned_at: assignment.returned_at,
            expires_at: assignment.expires_at
          });
        }
      });

      // Get currently assigned territories
      const { data: currentlyAssigned, error: currentlyAssignedError } = await supabase
        .from("assigned_territories")
        .select("territory_id, expires_at, status, returned_at");

      if (currentlyAssignedError) {
        console.error("Error fetching currently assigned territories:", currentlyAssignedError);
        return;
      }

      // Create a set of assigned territory IDs and count expired ones
      const assignedTerritoriesSet = new Set();
      const expiredTerritoriesSet = new Set();
      const now = new Date();

      if (currentlyAssigned) {
        currentlyAssigned.forEach(item => {
          if (item.status === "assigned" && !item.returned_at) {
            // Check if it's expired
            if (item.expires_at && new Date(item.expires_at) < now) {
              expiredTerritoriesSet.add(item.territory_id);
            } else {
              assignedTerritoriesSet.add(item.territory_id);
            }
          }
        });
      }

      // Transform and combine the data
      const transformedTerritories = territoriesData.map((territory: any) => {
        // Handle the potential error in the zone field
        const zoneData = territory.zone && typeof territory.zone !== 'string' 
          ? territory.zone 
          : null;

        // Get assignment status info
        const assignmentInfo = assignedStatusMap.get(territory.id);
        let status = "available";
        
        if (assignmentInfo && !assignmentInfo.returned_at) {
          if (assignmentInfo.expires_at && new Date(assignmentInfo.expires_at) < now) {
            status = "expired";
          } else {
            status = "assigned";
          }
        }

        return {
          ...territory,
          zone: zoneData,
          last_assigned_at: lastAssignedMap.get(territory.id) || null,
          status: status,
          expires_at: expiryDateMap.get(territory.id) || null
        };
      }) as TerritorySafeData[];

      // Set territories with the transformed data
      setTerritories(transformedTerritories);
      setFilteredTerritories(transformedTerritories);

      // Calculate statistics
      setStats({
        total_territories: transformedTerritories.length,
        assigned_territories: assignedTerritoriesSet.size,
        available_territories: transformedTerritories.length - (assignedTerritoriesSet.size + expiredTerritoriesSet.size),
        expired_territories: expiredTerritoriesSet.size,
        territories_by_zone: [],
        total: transformedTerritories.length,
        assigned: assignedTerritoriesSet.size,
        available: transformedTerritories.length - (assignedTerritoriesSet.size + expiredTerritoriesSet.size)
      });
    } catch (error) {
      console.error("Error in fetchTerritories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    territories,
    filteredTerritories,
    setFilteredTerritories,
    isLoading,
    stats
  };
}
