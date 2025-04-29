
export type Zone = {
  id: string;
  name: string;
};

export type Territory = {
  id: string;
  name: string;
  zone_id: string | null;
  google_maps_link: string | null;
  created_at: string;
  updated_at: string;
  zone?: Zone;
  last_assigned_at: string | null;
};

export type TerritoryAssignment = {
  id: string;
  territory_id: string;
  publisher_id: string;
  assigned_at: string;
  expires_at: string | null;
  status: string | null;
  token: string;
  returned_at: string | null;
  publisher?: {
    name: string;
  };
};

export type AppSettings = {
  id: number;
  territory_link_days: number;
  created_at: string;
  updated_at: string;
};

export type TerritoryStatistics = {
  total: number;
  assigned: number;
  available: number;
};

export type TerritoryHistory = {
  id: string;
  territory_id: string;
  publisher_id: string;
  publisher_name: string;
  assigned_at: string;
  expires_at: string | null;
  returned_at: string | null;
  status: string | null;
};

// New interface to handle strict typing for query responses
export interface TerritorySafeData extends Territory {
  zone: Zone | null;
}

export interface TerritoryAssignmentSafeData extends TerritoryAssignment {
  publisher: { name: string } | null;
}
