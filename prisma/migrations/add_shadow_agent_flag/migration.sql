-- Add isShadowAgent flag to Agent model
ALTER TABLE "Agent" ADD COLUMN "isShadowAgent" BOOLEAN NOT NULL DEFAULT false;

-- Create index for shadow agent queries
CREATE INDEX "Agent_isShadowAgent_idx" ON "Agent"("isShadowAgent");
