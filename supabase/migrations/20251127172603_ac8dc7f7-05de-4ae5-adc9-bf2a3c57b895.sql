-- Drop the overly permissive policy that allows all authenticated users to view all comments
DROP POLICY IF EXISTS "All authenticated users can view comments" ON public.incident_comments;

-- Create a new policy that restricts comments to incidents from the user's company
CREATE POLICY "Users can view comments from own company incidents"
ON public.incident_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.incidents
    WHERE incidents.id = incident_comments.incident_id
      AND incidents.company_id = get_user_company_id(auth.uid())
  )
);