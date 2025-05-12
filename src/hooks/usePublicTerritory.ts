
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TerritoryData {
  territory_name: string;
  google_maps_link: string | null;
  danger_level: string | null;
  warnings: string | null;
  expires_at: string | null;
  publisher_name: string;
  publisher_id: string;
  is_expired: boolean;
}

interface OtherTerritory {
  id: string;
  name: string;
  token: string;
}

interface PublicTerritoryData {
  loading: boolean;
  error: string | null;
  territoryData: TerritoryData | null;
  otherTerritories: OtherTerritory[];
}

export function usePublicTerritory(token: string | undefined): PublicTerritoryData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [territoryData, setTerritoryData] = useState<TerritoryData | null>(null);
  const [otherTerritories, setOtherTerritories] = useState<OtherTerritory[]>([]);

  useEffect(() => {
    if (!token) {
      setError("Token no proporcionado");
      setLoading(false);
      return;
    }
    
    fetchTerritoryByToken(token);
  }, [token]);

  const fetchTerritoryByToken = async (token: string) => {
    try {
      // Configure token for RLS queries by calling our edge function first
      const { data: claimData, error: claimError } = await supabase.functions.invoke('set-claim', {
        body: { claim: 'token', value: token }
      });
      
      if (claimError) {
        console.error("Error setting claim:", claimError);
        setError("Error al configurar el acceso al territorio.");
        setLoading(false);
        return;
      }

      // Fetch the assignment with the given token
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assigned_territories")
        .select("id, territory_id, publisher_id, expires_at, status, token, returned_at")
        .eq("token", token)
        .maybeSingle();

      if (assignmentError || !assignmentData) {
        console.error("Error fetching assignment data:", assignmentError);
        setError("Territorio no encontrado o enlace inválido.");
        setLoading(false);
        return;
      }

      // Then fetch the territory and publisher details separately
      const territoryPromise = supabase
        .from("territories")
        .select("name, google_maps_link, danger_level, warnings")
        .eq("id", assignmentData.territory_id)
        .maybeSingle();
        
      const publisherPromise = supabase
        .from("publishers")
        .select("name")
        .eq("id", assignmentData.publisher_id)
        .maybeSingle();
        
      const [territoryResult, publisherResult] = await Promise.all([
        territoryPromise, 
        publisherResult
      ]);

      if (territoryResult.error || !territoryResult.data) {
        console.error("Error fetching territory:", territoryResult.error);
        setError("Error al cargar datos del territorio");
        setLoading(false);
        return;
      }

      if (publisherResult.error || !publisherResult.data) {
        console.error("Error fetching publisher:", publisherResult.error);
        setError("Error al cargar datos del publicador");
        setLoading(false);
        return;
      }

      const isExpired =
        !assignmentData.expires_at ||
        new Date(assignmentData.expires_at) < new Date() ||
        assignmentData.status !== "assigned" ||
        assignmentData.returned_at !== null;

      setTerritoryData({
        territory_name: territoryResult.data.name,
        google_maps_link: territoryResult.data.google_maps_link,
        danger_level: territoryResult.data.danger_level,
        warnings: territoryResult.data.warnings,
        expires_at: assignmentData.expires_at,
        publisher_name: publisherResult.data.name,
        publisher_id: assignmentData.publisher_id,
        is_expired: isExpired,
      });

      // If the territory is expired, check for other active territories for this publisher
      if (isExpired) {
        await fetchOtherTerritories(assignmentData.publisher_id, token);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching territory:", err);
      setError("Error al cargar datos del territorio");
      setLoading(false);
    }
  };

  const fetchOtherTerritories = async (publisherId: string, currentToken: string) => {
    try {
      // Configure token for RLS queries by calling our edge function first
      await supabase.functions.invoke('set-claim', {
        body: { claim: 'token', value: currentToken }
      });
      
      const { data: otherAssignmentsData, error: otherAssignmentsError } = await supabase
        .from("assigned_territories")
        .select(`
          id, token, territory_id
        `)
        .eq("publisher_id", publisherId)
        .eq("status", "assigned")
        .is("returned_at", null)
        .gt("expires_at", new Date().toISOString())
        .neq("token", currentToken);
      
      if (otherAssignmentsError || !otherAssignmentsData) {
        console.error("Error fetching other assignments:", otherAssignmentsError);
        return;
      }
      
      if (otherAssignmentsData.length > 0) {
        const territoryIds = otherAssignmentsData.map(assignment => assignment.territory_id);
        
        // Fetch territory details for these assignments
        const { data: territoriesData, error: territoriesError } = await supabase
          .from("territories")
          .select("id, name")
          .in("id", territoryIds);
        
        if (territoriesError || !territoriesData) {
          console.error("Error fetching territories:", territoriesError);
          return;
        }
        
        const validTerritories: OtherTerritory[] = otherAssignmentsData.map(assignment => {
          const territoryData = territoriesData.find(t => t.id === assignment.territory_id);
          return {
            id: assignment.territory_id,
            name: territoryData ? territoryData.name : "Territorio desconocido",
            token: assignment.token
          };
        });
        
        setOtherTerritories(validTerritories);
      }
    } catch (error) {
      console.error("Error fetching other territories:", error);
    }
  };

  return {
    loading,
    error,
    territoryData,
    otherTerritories
  };
}
