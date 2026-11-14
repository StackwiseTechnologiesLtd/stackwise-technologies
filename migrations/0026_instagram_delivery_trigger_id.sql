-- Meta comment/DM ids (mids) can exceed 128 characters.
ALTER TABLE instagram_deliveries
  ALTER COLUMN trigger_external_id TYPE TEXT;