-- Add a function to update territory expiration status
CREATE OR REPLACE FUNCTION public.update_territory_expiration_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update territories that should be expired
  UPDATE public_territory_access 
  SET is_expired = true, updated_at = NOW()
  WHERE expires_at < NOW() AND is_expired = false;
  
  -- Update territories that should not be expired
  UPDATE public_territory_access 
  SET is_expired = false, updated_at = NOW()
  WHERE expires_at >= NOW() AND is_expired = true;
  
  -- Also update territories where expires_at is null (should not be expired)
  UPDATE public_territory_access 
  SET is_expired = false, updated_at = NOW()
  WHERE expires_at IS NULL AND is_expired = true;
END;
$$;

-- Create a cron job to run every 5 minutes
SELECT cron.schedule(
  'sync-territory-expiration',
  '*/5 * * * *',
  $$
  SELECT public.update_territory_expiration_status();
  $$
);