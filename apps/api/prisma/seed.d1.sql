PRAGMA foreign_keys = ON;

INSERT INTO "PipelineStage" ("id","name","order","probability","isWon","isLost","createdAt","updatedAt")
VALUES
  ('f4bf80a5-8654-4405-8a0b-d6babe56f072','Prospecting',10,10,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('b6f90968-d2c4-482f-9919-f23637d93eb6','Qualified',20,25,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('29ee3fb8-e3e0-44e7-a00d-c45bccca7217','Proposal',30,50,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('5e98ebdd-03e4-4781-95b3-ed0807241ae7','Negotiation',40,75,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('3004e47b-6beb-4bfd-b0ba-117200ad6b0c','Closed Won',50,100,1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('c563e15e-2bd7-4da2-a408-261eda8c9682','Closed Lost',60,0,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT("name") DO NOTHING;

INSERT INTO "User" ("id","email","passwordHash","firstName","lastName","role","createdAt","updatedAt")
VALUES
  ('11111111-1111-4111-8111-111111111111','admin@crm.local','$2b$12$seoqQby//xbTw.0Rptohs.sdcpUad/zD7aAg9gxLtkrL7f.X2NXni','Aiko','Admin','ADMIN',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('22222222-2222-4222-8222-222222222222','manager@crm.local','$2b$12$92q3zp9vWwlTvyLFltwBWOJaZ3HPdwrSO.4sIP3UQI0DBknZuISwe','Makoto','Manager','MANAGER',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT("id") DO NOTHING;

INSERT INTO "Account" ("id","name","domain","industry","website","size","description","annualRevenue","phone","status","createdAt","updatedAt")
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Acme Industries',
  'acme-industries.example',
  'Manufacturing',
  'https://acme-industries.example',
  1200,
  'Key enterprise customer focused on manufacturing automation.',
  12500000,
  '+1-202-555-0101',
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT("id") DO NOTHING;

INSERT INTO "AccountAssignment" ("id","accountId","userId","role")
VALUES (
  '99999999-9999-4999-8999-999999999999',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '22222222-2222-4222-8222-222222222222',
  'OWNER'
)
ON CONFLICT("id") DO NOTHING;

INSERT INTO "Contact" ("id","accountId","firstName","lastName","kanaFirstName","kanaLastName","email","phone","jobTitle","notes","createdAt","updatedAt")
VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Kana',
  'Client',
  'カナ',
  'クライアント',
  'kana.client@acme-industries.example',
  '+1-415-555-0099',
  'VP of Operations',
  'Prefers bi-weekly status emails.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT("id") DO NOTHING;

INSERT INTO "Opportunity" ("id","name","accountId","ownerId","stageId","contactId","amount","currency","probability","status","expectedCloseDate","description","createdAt","updatedAt")
VALUES (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'Automation Rollout FY26',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '22222222-2222-4222-8222-222222222222',
  'b6f90968-d2c4-482f-9919-f23637d93eb6',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  480000,
  'USD',
  35,
  'OPEN',
  '2026-09-30T00:00:00.000Z',
  'Upgraded automation rollout for FY2026.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT("id") DO NOTHING;

INSERT INTO "Activity" ("id","type","subject","description","userId","accountId","contactId","opportunityId","occurredAt","createdAt","updatedAt")
VALUES (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'MEETING',
  'Kickoff discovery call',
  'Discussed requirements and success metrics.',
  '22222222-2222-4222-8222-222222222222',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT("id") DO NOTHING;

INSERT INTO "Task" ("id","title","description","status","priority","dueDate","ownerId","activityId","accountId","opportunityId","contactId","createdAt","updatedAt")
VALUES (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'Send proposal deck',
  'Follow up with tailored ROI slides.',
  'IN_PROGRESS',
  'HIGH',
  datetime('now', '+3 day'),
  '22222222-2222-4222-8222-222222222222',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT("id") DO NOTHING;

INSERT INTO "AuditLog" ("id","entityType","entityId","action","changes","userId","opportunityId")
VALUES (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'Opportunity',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'CREATE',
  '{"message":"Seeded opportunity created."}',
  '11111111-1111-4111-8111-111111111111',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
)
ON CONFLICT("id") DO NOTHING;
