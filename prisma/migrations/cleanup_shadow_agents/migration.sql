-- Delete all existing shadow agents
DELETE FROM "Agent" WHERE "isShadowAgent" = true;

-- Reset any users that were linked to shadow agents
UPDATE "User" SET "agentId" = NULL WHERE "agentId" IN (
  SELECT id FROM "Agent" WHERE "isShadowAgent" = true
);
