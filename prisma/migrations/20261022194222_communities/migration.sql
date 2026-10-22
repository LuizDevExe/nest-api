-- CreateEnum
CREATE TYPE "CommunityRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "communityId" INTEGER;

-- CreateTable
CREATE TABLE "Community" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "userId" INTEGER NOT NULL,
    "communityId" INTEGER NOT NULL,
    "role" "CommunityRole" NOT NULL DEFAULT 'MEMBER',
    "bannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("userId","communityId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
