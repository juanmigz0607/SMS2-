-- ==============================================================================
-- Schema Migration: Departments Table
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bohadtcvnjpwtfqscawk/sql
-- ==============================================================================

-- 1. Create Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Optional: Add department_id reference to registration_staff and faculty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registration_staff' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE public.registration_staff ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'faculty' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE public.faculty ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 4. Permissive Access Policy for Application
DROP POLICY IF EXISTS "Public full access on departments" ON public.departments;
CREATE POLICY "Public full access on departments"
    ON public.departments
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Seed Initial Departments
INSERT INTO public.departments (code, name, description)
VALUES
    ('REG', 'Registrar''s Office', 'Office of the University Registrar and Student Records'),
    ('CCS', 'College of Computer Studies', 'Information Technology and Computer Science Department'),
    ('COE', 'College of Engineering', 'Engineering Sciences and Civil / Electrical Engineering'),
    ('CBA', 'College of Business & Accountancy', 'Business Administration, Marketing, and Accountancy'),
    ('CAS', 'College of Arts & Sciences', 'General Education, Liberal Arts, and Applied Sciences'),
    ('CED', 'College of Education', 'Teacher Education and Curriculum Development'),
    ('ADM', 'Admissions & Evaluation', 'New Student Screening, Document Evaluation and Credential Verification')
ON CONFLICT (code) DO NOTHING;
