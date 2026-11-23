-- Add an explicit timestamp for when a user records or updates an actual unit price.
-- Existing rows are intentionally left NULL: their purchase/entry dates cannot be inferred safely.
ALTER TABLE public.project_materials
  ADD COLUMN IF NOT EXISTS actual_price_recorded_at timestamptz;

CREATE INDEX IF NOT EXISTS project_materials_personal_price_history_idx
  ON public.project_materials (name, category, actual_price_recorded_at DESC)
  WHERE is_purchased = true
    AND actual_price IS NOT NULL
    AND actual_price_recorded_at IS NOT NULL;
