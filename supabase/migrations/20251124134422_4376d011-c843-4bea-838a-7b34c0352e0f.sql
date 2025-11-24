-- Drop existing policy and recreate with proper anonymous access
DROP POLICY IF EXISTS "Users can view active companies for signup" ON companies;

-- Create policy that allows anonymous users to view active companies for signup
CREATE POLICY "Anonymous users can view active companies for signup"
ON companies
FOR SELECT
TO anon, authenticated
USING (aktiv = true);