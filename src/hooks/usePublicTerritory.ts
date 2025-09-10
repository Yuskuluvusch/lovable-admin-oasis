
import { useState, useEffect } from "react";
import { supabase, adminAuthClient } from "@/integrations/supabase/client";  
import { useAuth } from "@/contexts/AuthContext"; // Ruta de importación correcta


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
  const { isAuthenticated } = useAuth(); // Usar el hook de autenticación  
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
      // Verificar la sesión a través de Supabase directamente
      const { data: { session } } = await supabase.auth.getSession();  
      const userAuthenticated = !!session;  
        
      // Usar el cliente adecuado según el estado de autenticación  
      const client = userAuthenticated ? adminAuthClient : supabase;  
        
      // Consultar la tabla public_territory_access  
      const { data: accessData, error: accessError } = await client  
        .from("public_territory_access")  
        .select("*")  
        .eq("token", token)  
        .maybeSingle();  
        
      // Manejar errores de forma más detallada  
      if (accessError) {  
        console.error("Error específico de Supabase:", accessError);  
        setError(`Error al cargar datos del territorio: ${accessError.message}`);  
        setLoading(false);  
        return;  
      }  
        
      if (!accessData) {  
        setError("Territorio no encontrado o enlace inválido.");  
        setLoading(false);  
        return;  
      }  

      // Calculate if territory is truly expired
      const isDateExpired = accessData.expires_at ? new Date(accessData.expires_at) < new Date() : false;
      const isTrulyExpired = accessData.is_expired || isDateExpired;
      
      setTerritoryData({
        territory_name: accessData.territory_name,
        google_maps_link: accessData.google_maps_link,
        danger_level: accessData.danger_level,
        warnings: accessData.warnings,
        expires_at: accessData.expires_at,
        publisher_name: accessData.publisher_name,
        publisher_id: accessData.publisher_id,
        is_expired: isTrulyExpired,
      });

      // Si el territorio está expirado, buscar otros territorios activos para este publicador
      if (isTrulyExpired) {
        await fetchOtherTerritories(accessData.publisher_id, token);
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
      // Verificar la sesión a través de Supabase directamente
      const { data: { session } } = await supabase.auth.getSession();  
      const userAuthenticated = !!session;  
        
      // Usar el cliente adecuado según el estado de autenticación  
      const client = userAuthenticated ? adminAuthClient : supabase;  
        
      // Consultar directamente la tabla public_territory_access para otros territorios  
      const { data: otherAccessData, error: otherAccessError } = await client  
        .from("public_territory_access")  
        .select("territory_id, territory_name, token")  
        .eq("publisher_id", publisherId)  
        .eq("is_expired", false)  
        .neq("token", currentToken);  
        
      if (otherAccessError || !otherAccessData) {  
        console.error("Error fetching other territories:", otherAccessError);  
        return;  
      }  
        
      const validTerritories = otherAccessData.map(item => ({  
        id: item.territory_id,  
        name: item.territory_name,  
        token: item.token  
      }));  
        
      setOtherTerritories(validTerritories);  
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
