CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL, title TEXT NOT NULL, catchphrase TEXT,
  description TEXT, event_type TEXT, state TEXT, timezone TEXT,
  thumbnail_url TEXT, main_image_url TEXT, start_date TEXT, end_date TEXT,
  has_ended INTEGER, featured INTEGER, requires_approval INTEGER,
  enabled_tickets INTEGER, enabled_meetings INTEGER, enabled_chat INTEGER, enabled_side_events INTEGER,
  max_participants INTEGER, participant_list_visibility TEXT,
  schedules TEXT, location TEXT, tags TEXT, organizers TEXT, custom_style TEXT,
  custom_navigation TEXT, organizer_contact TEXT, stages TEXT, sessions TEXT, speakers TEXT,
  announcements TEXT, survey_schema TEXT, created_by TEXT, created_by_id TEXT, created_at TEXT, updated_at TEXT, data TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_date);

CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  logo_url TEXT, logo_dark_url TEXT, visibility TEXT, join_type TEXT, enabled_chat INTEGER,
  member_count INTEGER, followers_count INTEGER, featured INTEGER, website_url TEXT,
  tags TEXT, custom_navigation TEXT, created_by TEXT, created_at TEXT, updated_at TEXT, data TEXT
);
CREATE INDEX IF NOT EXISTS idx_comm_slug ON communities(slug);

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY, community_id TEXT, name TEXT NOT NULL, description TEXT,
  thumbnail_image_url TEXT, item_count INTEGER, featured INTEGER, sticky INTEGER,
  sort_order INTEGER, community TEXT, created_at TEXT, updated_at TEXT, data TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  first_name TEXT, last_name TEXT, native_name TEXT, avatar_url TEXT, slug TEXT UNIQUE,
  title TEXT, bio TEXT, created_at TEXT, updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY, event_id TEXT NOT NULL, user_id TEXT, email TEXT NOT NULL,
  name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', type TEXT DEFAULT 'GENERAL',
  ticket_id TEXT, checked_in INTEGER DEFAULT 0, notes TEXT,
  created_at TEXT, updated_at TEXT, data TEXT
);
CREATE INDEX IF NOT EXISTS idx_participants_event ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(event_id, email);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY, event_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  price INTEGER DEFAULT 0, quantity INTEGER, max_per_order INTEGER DEFAULT 1,
  sale_starts_at TEXT, sale_ends_at TEXT, type TEXT DEFAULT 'FREE', enabled INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT, data TEXT
);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
