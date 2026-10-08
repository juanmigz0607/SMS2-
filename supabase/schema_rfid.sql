-- ==============================================================================
-- Schema Migration: Student RFID Management
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bohadtcvnjpwtfqscawk/sql
-- ==============================================================================

-- 1. Create Student RFID Cards Table
CREATE TABLE IF NOT EXISTS public.student_rfid_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    rfid_uid TEXT NOT NULL UNIQUE,                -- E.g. "8A:F3:11:4C" or decimal tag
    rfid_decimal TEXT,                            -- 10-digit decimal representation
    card_number TEXT NOT NULL UNIQUE,             -- Formatted card ID e.g. "BCP-RFID-2026-0012"
    status TEXT NOT NULL DEFAULT 'Active',        -- 'Active', 'Inactive', 'Lost', 'Pending'
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '4 years'),
    issued_by TEXT DEFAULT 'Registrar / RFID Admin',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Optional: Add direct rfid_uid column to students table if not exists for quick indexing
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'students' 
          AND column_name = 'rfid_uid'
    ) THEN
        ALTER TABLE public.students ADD COLUMN rfid_uid TEXT;
    END IF;
END $$;

-- 3. Create Indexes for High Performance Lookup (Gate Turnstile / Clinic Lookup)
CREATE INDEX IF NOT EXISTS idx_student_rfid_uid ON public.student_rfid_cards(rfid_uid);
CREATE INDEX IF NOT EXISTS idx_student_rfid_student_id ON public.student_rfid_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_student_rfid_status ON public.student_rfid_cards(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.student_rfid_cards ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Policies for Web Application Access
DROP POLICY IF EXISTS "Public full access on student_rfid_cards" ON public.student_rfid_cards;
CREATE POLICY "Public full access on student_rfid_cards"
    ON public.student_rfid_cards
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
