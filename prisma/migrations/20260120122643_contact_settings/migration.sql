-- CreateTable
CREATE TABLE "ContactSettings" (
    "id" TEXT NOT NULL,
    "bannerSubtitle" TEXT NOT NULL,
    "bannerText" TEXT NOT NULL,
    "joinText" TEXT NOT NULL,
    "joinHref" TEXT NOT NULL,
    "emailValue" TEXT NOT NULL,
    "emailHref" TEXT NOT NULL,
    "instagramValue" TEXT NOT NULL,
    "instagramHref" TEXT NOT NULL,
    "xValue" TEXT NOT NULL,
    "xHref" TEXT NOT NULL,
    "linkedinValue" TEXT NOT NULL,
    "linkedinHref" TEXT NOT NULL,
    "webValue" TEXT NOT NULL,
    "webHref" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "mapUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactSettings_pkey" PRIMARY KEY ("id")
);
