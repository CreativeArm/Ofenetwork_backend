CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "usage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentMethod_channel_key" ON "PaymentMethod"("channel");
