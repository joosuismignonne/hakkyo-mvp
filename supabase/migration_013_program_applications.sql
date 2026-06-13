-- New program application system.
-- Stores structured applicant profiles with full workflow status.
-- Separate from the legacy applications / application_answers tables.

CREATE TABLE IF NOT EXISTS program_applications (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Program
  program_id            uuid        REFERENCES program_tracks(id) ON DELETE SET NULL,
  program_name          text,

  -- Workflow status
  status                text        NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','reviewing','accepted','waitlist','payment_pending','enrolled','cancelled')),

  -- Basic information
  name                  text        NOT NULL,
  preferred_name        text,
  email                 text        NOT NULL,
  phone                 text,
  preferred_contact     text,
  languages_spoken      text,
  instagram             text,

  -- Montréal journey
  time_in_montreal      text,
  current_stage         text,
  current_focus         text,

  -- Korean journey
  previous_korean_exp   text,
  korean_level          text,
  interest_in_korean    text,

  -- Goals
  reason_for_joining    text,
  first_korean_goal     text,
  six_month_goal        text,

  -- Learning style
  biggest_challenge     text,
  preferred_environment text,

  -- HAKKYO questions
  how_found_hakkyo      text,
  what_interested       text,
  definition_great_class text,
  questions_for_hakkyo  text,

  -- Admin only
  admin_notes           text
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS program_applications_updated_at ON program_applications;
CREATE TRIGGER program_applications_updated_at
  BEFORE UPDATE ON program_applications
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS
ALTER TABLE program_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit
CREATE POLICY "prog_apps_insert" ON program_applications
  FOR INSERT WITH CHECK (true);

-- Authenticated (admin) can read and update
CREATE POLICY "prog_apps_select" ON program_applications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "prog_apps_update" ON program_applications
  FOR UPDATE USING (auth.role() = 'authenticated');
