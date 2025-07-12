-- DPO Clean Database Seed Data
-- This file only contains reference data that doesn't require users

-- =============================================================================
-- REFERENCE DATA
-- =============================================================================

-- Insert reference data for obras
INSERT INTO public.areas (name) VALUES
    ('Vialidad y Transporte'),
    ('Hidráulica'),
    ('Arquitectura'),
    ('Energía');

INSERT INTO public.reparticiones (name) VALUES
    ('Ministerio de Obras Públicas'),
    ('Dirección Provincial de Vialidad'),
    ('Dirección de Hidráulica'),
    ('Secretaría de Energía');

INSERT INTO public.tipos_obra (name) VALUES
    ('Construcción'),
    ('Reparación'),
    ('Mantenimiento'),
    ('Ampliación'),
    ('Rehabilitación'),
    ('Demolición');

-- Insert sample organization (no user references)
INSERT INTO public.organizations (id, name, slug, description, contact_email)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Empresa Constructora Demo',
    'demo-constructora',
    'Organización de ejemplo para testing',
    'demo@constructora.com'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PRELOADED TEST DATA
-- =============================================================================
-- Note: This data will be created with dummy user IDs that can be updated
-- once real users are registered in the application.

-- Dummy user ID for seeding - this will be replaced by real user IDs
-- when users actually register and join the organization
DO $$
DECLARE
    sample_user_id UUID := '00000000-0000-0000-0000-000000000001';
    sample_org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    sample_folder_id UUID;
    sample_file_id UUID;
BEGIN
    -- Create a dummy user profile for seeding
    INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, raw_user_meta_data)
    VALUES (
        sample_user_id,
        'demo@example.com',
        NOW(),
        NOW(),
        NOW(),
        '{"full_name": "Demo User"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    -- Create profile for dummy user
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        sample_user_id,
        'Demo User',
        'user'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create organization membership
    INSERT INTO public.organization_memberships (organization_id, user_id, role, joined_at)
    VALUES (
        sample_org_id,
        sample_user_id,
        'owner',
        NOW()
    ) ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Create sample obra
    INSERT INTO public.obras (
        id,
        organization_id,
        user_id,
        obra_name,
        descripcion,
        provincia,
        departamento,
        calle,
        area_id,
        reparticion_id,
        tipo_obra_id,
        presupuesto,
        presupuesto_oficial,
        estado,
        etapa,
        duracion,
        fecha_inicio,
        fecha_fin,
        expediente
    ) VALUES (
        gen_random_uuid(),
        sample_org_id,
        sample_user_id,
        'Construcción de Puente sobre Río Demo',
        'Construcción de puente vehicular de 150 metros con estructura de hormigón armado',
        'Buenos Aires',
        'La Plata',
        'Ruta Provincial 36 km 45',
        1, -- Vialidad y Transporte
        2, -- Dirección Provincial de Vialidad
        1, -- Construcción
        15000000.00,
        14500000.00,
        'EN_EJECUCION',
        'EJECUCION',
        180,
        '2024-01-15',
        '2024-07-15',
        'EXP-2024-001'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create sample document example
    INSERT INTO public.document_examples (
        id,
        organization_id,
        user_id,
        title,
        description,
        content,
        category,
        tags
    ) VALUES (
        gen_random_uuid(),
        sample_org_id,
        sample_user_id,
        'Plantilla de Contrato de Obra',
        'Plantilla estándar para contratos de obra pública',
        'CONTRATO DE OBRA PÚBLICA\n\nEntre la parte contratante...',
        'Contratos',
        ARRAY['contrato', 'obra', 'legal', 'template']
    ) ON CONFLICT (id) DO NOTHING;

    -- Create sample folders
    INSERT INTO public.folders (id, organization_id, user_id, name, description, color, icon)
    VALUES 
        (gen_random_uuid(), sample_org_id, sample_user_id, 'Contratos', 'Documentos contractuales', '#10B981', '📄'),
        (gen_random_uuid(), sample_org_id, sample_user_id, 'Planos', 'Planos técnicos y arquitectónicos', '#3B82F6', '📐'),
        (gen_random_uuid(), sample_org_id, sample_user_id, 'Facturas', 'Facturas y documentos fiscales', '#F59E0B', '🧾');

    -- Get folder IDs for file assignments
    SELECT id INTO sample_folder_id FROM public.folders WHERE name = 'Contratos' AND organization_id = sample_org_id LIMIT 1;

    -- Create sample files
    INSERT INTO public.files (
        id,
        organization_id,
        user_id,
        name,
        original_name,
        file_type,
        file_size,
        storage_path,
        processing_status
    ) VALUES (
        gen_random_uuid(),
        sample_org_id,
        sample_user_id,
        'contrato_puente_demo.pdf',
        'Contrato Puente Demo.pdf',
        'application/pdf',
        2048576,
        'demo/contrato_puente_demo.pdf',
        'completed'
    ) ON CONFLICT (id) DO NOTHING;

    -- Get file ID for assignments
    SELECT id INTO sample_file_id FROM public.files WHERE name = 'contrato_puente_demo.pdf' AND organization_id = sample_org_id LIMIT 1;

    -- Assign file to folder
    IF sample_folder_id IS NOT NULL AND sample_file_id IS NOT NULL THEN
        INSERT INTO public.file_folder_assignments (file_id, folder_id, user_id)
        VALUES (sample_file_id, sample_folder_id, sample_user_id)
        ON CONFLICT (file_id, folder_id) DO NOTHING;
    END IF;

    -- Create sample file analysis
    IF sample_file_id IS NOT NULL THEN
        INSERT INTO public.file_analysis (
            file_id,
            user_id,
            ocr_text,
            ai_description,
            ai_category,
            ai_tags,
            confidence_score
        ) VALUES (
            sample_file_id,
            sample_user_id,
            'CONTRATO DE OBRA PÚBLICA\n\nContrato N°: EXP-2024-001\nObjeto: Construcción de Puente sobre Río Demo\nContratista: Empresa Constructora Demo\nMonto: $15.000.000\nPlazo: 180 días\n\nCláusulas generales...',
            'Este es un contrato de obra pública para la construcción de un puente. Contiene información sobre el contratista, monto, plazo de ejecución y cláusulas contractuales.',
            'Contrato',
            ARRAY['contrato', 'obra', 'puente', 'construcción', 'legal'],
            0.95
        ) ON CONFLICT (file_id) DO NOTHING;
    END IF;

    -- Create sample folder extraction config
    IF sample_folder_id IS NOT NULL THEN
        INSERT INTO public.folder_extraction_configs (
            folder_id,
            user_id,
            field_name,
            field_label,
            field_type,
            extraction_pattern,
            is_required
        ) VALUES 
            (sample_folder_id, sample_user_id, 'numero_contrato', 'Número de Contrato', 'text', 'Extract contract number from document', true),
            (sample_folder_id, sample_user_id, 'monto_contrato', 'Monto del Contrato', 'currency', 'Extract contract amount in currency format', true),
            (sample_folder_id, sample_user_id, 'fecha_vencimiento', 'Fecha de Vencimiento', 'date', 'Extract expiration or completion date', false);
    END IF;

END $$;