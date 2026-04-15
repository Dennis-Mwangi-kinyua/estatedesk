/*
  Warnings:

  - You are about to drop the column `token` on the `UserSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `UserSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `UserSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserSession_token_idx";

-- DropIndex
DROP INDEX "UserSession_token_key";

-- AlterTable
ALTER TABLE "UserSession" DROP COLUMN "token",
ADD COLUMN     "activeMembershipId" TEXT,
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "UserSession_tokenHash_idx" ON "UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "UserSession_activeMembershipId_idx" ON "UserSession"("activeMembershipId");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_activeMembershipId_fkey" FOREIGN KEY ("activeMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
