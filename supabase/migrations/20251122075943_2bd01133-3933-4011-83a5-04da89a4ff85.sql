-- Create function to handle notification preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (
    user_id,
    email_new_incident,
    email_new_mission,
    email_followup_assigned,
    email_new_user_pending,
    email_document_expiry
  )
  VALUES (
    NEW.id,
    false,
    false,
    true,
    false,
    false
  );
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
CREATE TRIGGER on_auth_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_notification_preferences();

-- Backfill notification preferences for existing users without them
INSERT INTO public.notification_preferences (
  user_id,
  email_new_incident,
  email_new_mission,
  email_followup_assigned,
  email_new_user_pending,
  email_document_expiry
)
SELECT 
  p.id,
  false,
  false,
  true,
  false,
  false
FROM public.profiles p
LEFT JOIN public.notification_preferences np ON p.id = np.user_id
WHERE np.user_id IS NULL;