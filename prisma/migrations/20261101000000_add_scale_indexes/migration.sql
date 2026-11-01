-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "Item_userId_createdAt_idx" ON "Item"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Item_teamId_createdAt_idx" ON "Item"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "BorrowRecord_itemId_returnedAt_idx" ON "BorrowRecord"("itemId", "returnedAt");
