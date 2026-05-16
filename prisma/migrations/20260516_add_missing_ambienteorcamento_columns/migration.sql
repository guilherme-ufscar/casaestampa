ALTER TABLE public."AmbienteOrcamento"
  ADD COLUMN IF NOT EXISTS "tipoAberturaBlackout" public."TipoAbertura",
  ADD COLUMN IF NOT EXISTS "tecidoExtra" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "blackoutExtra" boolean NOT NULL DEFAULT false;
