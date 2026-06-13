-- Add output_tags to program_tracks.
-- Stores short outcome-focused labels shown on program cards,
-- e.g. ARRAY['Self Introduction', 'Café Ordering', 'Active Output'].
ALTER TABLE program_tracks
  ADD COLUMN IF NOT EXISTS output_tags text[] DEFAULT '{}';
