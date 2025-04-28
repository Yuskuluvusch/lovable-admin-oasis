
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
  due_at: string | null;
  status: string | null;
  publisher?: {
    name: string;
  };
};
