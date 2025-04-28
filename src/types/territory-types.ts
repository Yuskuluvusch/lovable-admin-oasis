
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
  zone?: {
    name: string;
  };
};

export type TerritoryAssignment = {
  id: string;
  territory_id: string;
  publisher_id: string;
  assigned_at: string;
  expires_at: string | null;
  status: string | null;
  token: string;
  publisher?: {
    name: string;
  };
};

export type TerritorySettings = {
  id: number;
  expiration_days: number;
  created_at: string;
  updated_at: string;
};
