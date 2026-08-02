-- ============================================================================
-- The Mess Junk — Neon Postgres schema
--
-- Run this once against your Neon database before the first deploy:
--   psql "$DATABASE_URL" -f db/schema.sql
-- or paste it into the Neon dashboard's SQL Editor.
--
-- Safe to re-run: every statement is IF NOT EXISTS / idempotent.
--
-- These tables replace the Markdown and JSON files that used to live in
-- src/content/. The column names deliberately match the old frontmatter field
-- names one-for-one, so the page templates needed almost no changes and the
-- migration script is a straight copy.
--
-- Constraints are not decoration here. The old setup validated content with Zod
-- at build time and failed the build on bad data. With a database and an admin
-- panel, bad data can be written at runtime instead — so the guarantees move
-- into the schema, which is the only place that can still enforce them.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Workshops
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshops (
  id                SERIAL PRIMARY KEY,

  -- URL-safe identifier, was the Markdown filename
  slug              TEXT        NOT NULL UNIQUE,

  title             TEXT        NOT NULL,
  summary           TEXT        NOT NULL,

  -- Was a YAML array. A workshop belongs to one or more filter tabs.
  -- Constrained below so a typo cannot break the /workshops filters.
  categories        TEXT[]      NOT NULL,

  price_from        INTEGER     NOT NULL CHECK (price_from > 0),
  age_group         TEXT        NOT NULL,
  duration          TEXT        NOT NULL,

  -- Only set for private-only formats; NULL means "no minimum"
  min_participants  INTEGER     CHECK (min_participants IS NULL OR min_participants > 0),

  -- Key from src/data/shots.ts
  shot              TEXT        NOT NULL,

  takeaway          TEXT,

  -- Markdown body, was the content below the frontmatter
  body              TEXT        NOT NULL DEFAULT '',

  sort_order        INTEGER     NOT NULL DEFAULT 50,
  draft             BOOLEAN     NOT NULL DEFAULT FALSE,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Every category must be one the site actually renders a tab for.
  CONSTRAINT workshops_categories_valid CHECK (
    categories <@ ARRAY[
      'kids', 'teens', 'adults', 'corporate-colleges', 'private-custom', 'seasonal'
    ]::TEXT[]
  ),
  -- cardinality(), not array_length(): array_length on an empty array returns
  -- NULL rather than 0, and a CHECK constraint passes on NULL — so the
  -- array_length form silently allowed a workshop with no categories at all.
  CONSTRAINT workshops_categories_not_empty CHECK (cardinality(categories) >= 1)
);

CREATE INDEX IF NOT EXISTS workshops_sort_idx ON workshops (sort_order, id);
CREATE INDEX IF NOT EXISTS workshops_draft_idx ON workshops (draft);

-- ----------------------------------------------------------------------------
-- FAQ
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faq (
  id          SERIAL PRIMARY KEY,
  slug        TEXT        NOT NULL UNIQUE,
  question    TEXT        NOT NULL,

  -- The three clusters on the FAQ page
  faq_group   TEXT        NOT NULL CHECK (faq_group IN ('booking', 'pricing', 'expect')),

  answer      TEXT        NOT NULL,
  sort_order  INTEGER     NOT NULL DEFAULT 50,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS faq_group_sort_idx ON faq (faq_group, sort_order, id);

-- ----------------------------------------------------------------------------
-- Pricing tiers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id            SERIAL PRIMARY KEY,
  slug          TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,

  -- Free text: "₹499 – ₹2,500", "Custom", "Let's talk"
  price         TEXT        NOT NULL,
  price_note    TEXT,
  summary       TEXT        NOT NULL,

  -- The bulleted "what's included" list
  includes      TEXT[]      NOT NULL,

  -- Pre-fills the enquiry form's Event type
  enquiry_type  TEXT        NOT NULL,

  featured      BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order    INTEGER     NOT NULL DEFAULT 50,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- cardinality() for the same reason as workshops_categories_not_empty above.
  CONSTRAINT pricing_includes_not_empty CHECK (cardinality(includes) >= 1)
);

CREATE INDEX IF NOT EXISTS pricing_sort_idx ON pricing_tiers (sort_order, id);

-- ----------------------------------------------------------------------------
-- Upcoming workshop dates (the availability checker)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshop_dates (
  id           SERIAL PRIMARY KEY,

  -- A real DATE, not the text the JSON file used. The old YYYY-MM-DD regex
  -- existed only because JSON has no date type; the database can enforce a
  -- valid calendar date properly.
  session_date DATE        NOT NULL,

  -- Free text, e.g. "11:00 AM – 1:30 PM"
  session_time TEXT        NOT NULL,

  -- Free text so a session can be named before its workshop exists. Nullable FK
  -- below links it to a workshop where one matches.
  workshop     TEXT        NOT NULL,
  workshop_id  INTEGER     REFERENCES workshops(id) ON DELETE SET NULL,

  seats_total  INTEGER     NOT NULL CHECK (seats_total > 0),
  seats_left   INTEGER     NOT NULL CHECK (seats_left >= 0),
  price_from   INTEGER     CHECK (price_from IS NULL OR price_from > 0),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Seats left can never exceed the total. This was unenforceable in JSON and
  -- is exactly the kind of mistake a hurried edit makes.
  CONSTRAINT dates_seats_sane CHECK (seats_left <= seats_total)
);

CREATE INDEX IF NOT EXISTS dates_session_date_idx ON workshop_dates (session_date);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
--
-- A trigger rather than application code, so the timestamp is correct no matter
-- what writes the row — the admin panel, a migration, or someone in the Neon
-- SQL editor.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['workshops', 'faq', 'pricing_tiers', 'workshop_dates'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_set_updated_at ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;
