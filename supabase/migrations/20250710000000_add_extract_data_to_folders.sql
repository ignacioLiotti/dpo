-- Add extract_data field to folders table for organization files
ALTER TABLE public.folders ADD COLUMN extract_data BOOLEAN DEFAULT false;

-- Update seed data folder to have extraction enabled (the Contratos folder)
UPDATE public.folders 
SET extract_data = true 
WHERE name = 'Contratos' 
AND organization_id = '550e8400-e29b-41d4-a716-446655440000';