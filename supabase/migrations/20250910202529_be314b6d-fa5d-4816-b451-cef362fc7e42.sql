-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.administrators
    WHERE auth_id = auth.uid()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_territory_expiration_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update territories that should be expired
  UPDATE public.public_territory_access 
  SET is_expired = true, updated_at = NOW()
  WHERE expires_at < NOW() AND is_expired = false;
  
  -- Update territories that should not be expired
  UPDATE public.public_territory_access 
  SET is_expired = false, updated_at = NOW()
  WHERE expires_at >= NOW() AND is_expired = true;
  
  -- Also update territories where expires_at is null (should not be expired)
  UPDATE public.public_territory_access 
  SET is_expired = false, updated_at = NOW()
  WHERE expires_at IS NULL AND is_expired = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_public_territory_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  territory_rec RECORD;
  publisher_rec RECORD;
  territory_expired BOOLEAN;
BEGIN
  -- Obtener datos del territorio
  SELECT name, google_maps_link, danger_level, warnings INTO territory_rec
  FROM public.territories
  WHERE id = NEW.territory_id;
  
  -- Obtener datos del publicador
  SELECT name INTO publisher_rec
  FROM public.publishers
  WHERE id = NEW.publisher_id;
  
  -- Determinar si está expirado (renombramos la variable para evitar ambigüedad)
  territory_expired := 
    NEW.expires_at IS NULL OR 
    NEW.expires_at < NOW() OR 
    NEW.status != 'assigned' OR
    NEW.returned_at IS NOT NULL;
    
  -- Insertar o actualizar en public_territory_access
  INSERT INTO public.public_territory_access (
    territory_id,
    publisher_id,
    token,
    expires_at,
    territory_name,
    publisher_name,
    google_maps_link,
    danger_level,
    warnings,
    is_expired
  ) VALUES (
    NEW.territory_id,
    NEW.publisher_id,
    NEW.token,
    NEW.expires_at,
    territory_rec.name,
    publisher_rec.name,
    territory_rec.google_maps_link,
    territory_rec.danger_level,
    territory_rec.warnings,
    territory_expired
  )
  ON CONFLICT (token) 
  DO UPDATE SET
    expires_at = NEW.expires_at,
    territory_name = territory_rec.name,
    publisher_name = publisher_rec.name,
    google_maps_link = territory_rec.google_maps_link,
    danger_level = territory_rec.danger_level,
    warnings = territory_rec.warnings,
    is_expired = territory_expired,
    updated_at = NOW();
  
  RETURN NEW;
END;
$function$;