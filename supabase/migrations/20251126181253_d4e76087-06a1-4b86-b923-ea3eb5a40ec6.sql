-- Create storage bucket for email images
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-images', 'email-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for email-images bucket
CREATE POLICY "Anyone can view email images"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-images');

CREATE POLICY "Admins can upload email images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'email-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update email images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'email-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete email images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'email-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);