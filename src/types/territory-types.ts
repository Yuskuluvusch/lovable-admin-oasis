
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
