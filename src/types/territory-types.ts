
export interface Zone {
  id: string;
  name: string;
}

export interface Territory {
  id: string;
  name: string;
  zone_id: string;
  zone?: Zone;
  google_maps_link?: string;
  created_at: string;
  updated_at: string;
  last_assigned_at: string | null;
  last_returned_at: string | null;
}

export interface TerritoryAssignment {
  id: string;
  territory_id: string;
  publisher_id: string;
  assigned_at: string;
  expires_at: string | null;
  status: string;
  token: string;
  returned_at: string | null;
  publisher?: {
    name: string;
  };
}

export interface TerritoryHistory {
  id: string;
  territory_id: string;
  publisher_id: string;
  publisher_name: string;
  assigned_at: string;
  expires_at: string | null;
  returned_at: string | null;
  status: string;
}

export interface TerritorySafeData {
  id: string;
  name: string;
  zone_name: string | null;
  assigned_count: number;
  returned_count: number;
  days_assigned: number | null;
}

export interface TerritoryStatistics {
  total_territories: number;
  assigned_territories: number;
  available_territories: number;
  expired_territories: number;
  territories_by_zone: {
    zone_name: string;
    total: number;
    assigned: number;
  }[];
}

export interface AppSettings {
  id: number;
  territory_link_days: number;
  created_at: string;
  updated_at: string;
}
