-- =============================================================================
-- Wedding Photo Gallery Database Schema (Supabase / PostgreSQL)
-- File: schema.sql
-- =============================================================================

-- Enable pgcrypto extension for gen_random_uuid() (standard in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. Events Table
-- Stores metadata for each wedding gallery, keyed by a public unique URL slug.
-- Points to the root Google Drive folder holding the wedding photos/categories.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    drive_folder_id TEXT NOT NULL,
    event_date TEXT,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migration for existing events tables
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_date TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location TEXT;

-- Comments for documentation
COMMENT ON TABLE public.events IS 'Stores wedding gallery events and their linked Google Drive folder root ID.';
COMMENT ON COLUMN public.events.id IS 'Unique identifier for the event.';
COMMENT ON COLUMN public.events.slug IS 'Unique URL-friendly slug used to load the gallery (e.g., sarah-and-michael-2026).';
COMMENT ON COLUMN public.events.title IS 'Display title of the wedding event (e.g., Sarah & Michael Wedding).';
COMMENT ON COLUMN public.events.client_name IS 'Name of the wedding couple / client.';
COMMENT ON COLUMN public.events.drive_folder_id IS 'Google Drive root folder ID containing category subfolders or photos.';
COMMENT ON COLUMN public.events.created_at IS 'Timestamp when the event record was created.';

-- Index for fast lookup by slug in the frontend
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events (slug);


-- =============================================================================
-- 2. Download Leads Table
-- Captures visitor information before high-resolution photo or album downloads.
-- Enables wedding photographers to collect client / guest contact leads.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.download_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_slug TEXT NOT NULL REFERENCES public.events(slug) ON UPDATE CASCADE ON DELETE CASCADE,
    visitor_name TEXT NOT NULL,
    visitor_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comments for documentation
COMMENT ON TABLE public.download_leads IS 'Leads collected from visitors requesting photo or album downloads.';
COMMENT ON COLUMN public.download_leads.id IS 'Unique identifier for the download lead record.';
COMMENT ON COLUMN public.download_leads.event_slug IS 'Foreign key reference to events.slug.';
COMMENT ON COLUMN public.download_leads.visitor_name IS 'Full name provided by the visitor.';
COMMENT ON COLUMN public.download_leads.visitor_email IS 'Email address provided by the visitor.';
COMMENT ON COLUMN public.download_leads.created_at IS 'Timestamp when the lead was submitted.';

-- Indexes for querying leads by event and email
CREATE INDEX IF NOT EXISTS idx_download_leads_event_slug ON public.download_leads (event_slug);
CREATE INDEX IF NOT EXISTS idx_download_leads_visitor_email ON public.download_leads (visitor_email);
CREATE INDEX IF NOT EXISTS idx_download_leads_created_at ON public.download_leads (created_at DESC);


-- =============================================================================
-- 3. Row Level Security (RLS) Configuration (Supabase Best Practices)
-- =============================================================================

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_leads ENABLE ROW LEVEL SECURITY;

-- Events Policies:
-- 1. Allow public (anon + authenticated) to view events by slug
CREATE POLICY "Public can view events"
    ON public.events
    FOR SELECT
    USING (true);

-- 2. Allow only service role / authenticated admins to insert/update/delete events
CREATE POLICY "Admins can manage events"
    ON public.events
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Download Leads Policies:
-- 1. Allow public (anon + authenticated) to submit a new download lead
CREATE POLICY "Public can insert download leads"
    ON public.download_leads
    FOR INSERT
    WITH CHECK (
        length(trim(visitor_name)) > 0 AND 
        visitor_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );

-- 2. Allow only service role / authenticated admins to read download leads
CREATE POLICY "Only admins can view download leads"
    ON public.download_leads
    FOR SELECT
    TO authenticated
    USING (true);


-- =============================================================================
-- 4. Sample Seed Data (For Testing and Initial Setup)
-- =============================================================================

INSERT INTO public.events (slug, title, client_name, drive_folder_id)
VALUES 
    (
        'elena-and-lucas-2026',
        'Elena & Lucas — Tuscan Villa Wedding',
        'Elena Rostova & Lucas Bennett',
        '1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV'
    ),
    (
        'sophia-and-daniel-2026',
        'Sophia & Daniel — Coastal Sunset Celebration',
        'Sophia Martinez & Daniel Vance',
        '1XYZ_SAMPLE_FOLDER_ID_FOR_DEMO_001'
    )
ON CONFLICT (slug) DO UPDATE 
SET 
    title = EXCLUDED.title,
    client_name = EXCLUDED.client_name,
    drive_folder_id = EXCLUDED.drive_folder_id;
