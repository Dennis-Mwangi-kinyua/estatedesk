-- CreateTable
CREATE TABLE "ProductUpdateRead" (
    "userId" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductUpdateRead_pkey" PRIMARY KEY ("userId","updateId")
);

-- AddForeignKey
ALTER TABLE "ProductUpdateRead" ADD CONSTRAINT "ProductUpdateRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
