-- ==============================================================================
-- Schema Migration: Dedicated Faculty Table
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bohadtcvnjpwtfqscawk/sql
-- ==============================================================================

-- 1. Create Faculty Table (without academic rank, with department foreign key)
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id TEXT NOT NULL UNIQUE,                                       -- Format: YYDDDXXXX (e.g., 260082001)
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    employment_type TEXT NOT NULL DEFAULT 'Full-Time',                     -- 'Full-Time', 'Part-Time', 'Visiting'
    assigned_units INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active',                                 -- 'Active', 'On Leave', 'Sabbatical'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- 3. Create Full Access Policy for Web Application Access
DROP POLICY IF EXISTS "Public full access on faculty" ON public.faculty;
CREATE POLICY "Public full access on faculty"
    ON public.faculty
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Compatibility Patch for Existing Faculty Tables:
-- Ensure `department_id` exists and `rank` is not required
DO $$
BEGIN
    -- Add department_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'faculty' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE public.faculty 
        ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;

    -- Make rank optional / nullable if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'faculty' AND column_name = 'rank'
    ) THEN
        ALTER TABLE public.faculty ALTER COLUMN rank DROP NOT NULL;
        ALTER TABLE public.faculty ALTER COLUMN rank SET DEFAULT 'Faculty';
    END IF;
END $$;

-- 5. Link Existing Faculty Rows to Matching Department IDs
UPDATE public.faculty f
SET department_id = d.id
FROM public.departments d
WHERE f.department_id IS NULL
  AND (
    LOWER(f.department) = LOWER(d.name)
    OR LOWER(f.department) = LOWER(d.code)
    OR (f.department ILIKE '%Information%' AND d.code = 'CIT')
    OR (f.department ILIKE '%Computer%' AND d.code = 'CIT')
    OR (f.department ILIKE '%Business%' AND d.code = 'COB')
    OR (f.department ILIKE '%Engineering%' AND d.code = 'CEN')
    OR (f.department ILIKE '%Education%' AND d.code = 'COE')
    OR (f.department ILIKE '%Criminology%' AND d.code = 'COC')
    OR (f.department ILIKE '%Psychology%' AND d.code = 'COP')
    OR (f.department ILIKE '%Tourism%' AND d.code = 'CHT')
  );

-- 6. Seed Initial Faculty Records (using the YYDDDXXXX ID format)
INSERT INTO public.faculty (faculty_id, name, email, department, department_id, employment_type, assigned_units, status)
SELECT 
    v.faculty_id, 
    v.name, 
    v.email, 
    d.name, 
    d.id, 
    v.employment_type, 
    v.assigned_units, 
    v.status
FROM (
    VALUES
        ('260081001', 'Dr. Roberto Mendoza', 'r.mendoza@faculty.sms.edu', 'CIT', 'Full-Time', 18, 'Active'),
        ('260081002', 'Engr. Maria Clara Reyes', 'm.reyes@faculty.sms.edu', 'CEN', 'Full-Time', 21, 'Active'),
        ('260081003', 'Prof. Alan Turing Hernandez', 'a.hernandez@faculty.sms.edu', 'CIT', 'Full-Time', 24, 'Active'),
        ('260081004', 'Dr. Cristina Garcia', 'c.garcia@faculty.sms.edu', 'COB', 'Full-Time', 15, 'Sabbatical'),
        ('260081005', 'Prof. Lilian De Castro', 'l.decastro@faculty.sms.edu', 'COE', 'Part-Time', 12, 'On Leave'),
        ('260081006', 'Atty. Fernando Gomez', 'f.gomez@faculty.sms.edu', 'COC', 'Part-Time', 9, 'Active')
) AS v(faculty_id, name, email, dept_code, employment_type, assigned_units, status)
JOIN public.departments d ON d.code = v.dept_code
ON CONFLICT (faculty_id) DO NOTHING;
