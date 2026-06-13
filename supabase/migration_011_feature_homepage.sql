-- Add feature_homepage flag to contents table.
-- When true, the post appears in the "Community Moments" section on the homepage.
ALTER TABLE contents
  ADD COLUMN IF NOT EXISTS feature_homepage boolean DEFAULT false;
