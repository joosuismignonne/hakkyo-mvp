-- Public program detail fields (Programs page + Admin)

alter table program_tracks add column if not exists target_audience text;
alter table program_tracks add column if not exists included_sessions text[];
alter table program_tracks add column if not exists application_deadline date;
alter table program_tracks add column if not exists class_schedule text;
alter table program_tracks add column if not exists venue_name text;
alter table program_tracks add column if not exists venue_city text;
alter table program_tracks add column if not exists google_maps_url text;
