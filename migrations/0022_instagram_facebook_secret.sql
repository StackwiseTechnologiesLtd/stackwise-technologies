ALTER TABLE instagram_meta_apps
  ADD COLUMN IF NOT EXISTS facebook_app_secret_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS facebook_app_secret_iv TEXT;