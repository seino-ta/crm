-- Add kana columns to Contact table
ALTER TABLE "Contact"
  ADD COLUMN "kanaFirstName" TEXT,
  ADD COLUMN "kanaLastName" TEXT;
