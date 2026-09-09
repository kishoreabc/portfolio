-- CreateTable
CREATE TABLE "site_visitor_counter" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "lastVisitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_visitor_counter_pkey" PRIMARY KEY ("id")
);
