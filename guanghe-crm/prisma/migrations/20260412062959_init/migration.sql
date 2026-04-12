-- CreateEnum
CREATE TYPE "Source" AS ENUM ('LINE表單', 'BNI轉介', '記帳師轉介', '蒲公英', 'ESG', '自來客', '其他');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('借址登記', '共享工位', '場地租借');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('初步詢問', 'KYC審核中', '已簽約', '服務中', '退租中', '已結案', '已流失');

-- CreateEnum
CREATE TYPE "CheckType" AS ENUM ('商工登記', '司法院裁判書', '動產擔保', 'Google搜尋', '實質受益人審查');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('通過', '異常', '待查');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('已收', '未收', '逾期');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "tax_id" TEXT,
    "contact_name" TEXT NOT NULL,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "contact_line" TEXT,
    "source" "Source" NOT NULL DEFAULT '自來客',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "plan" TEXT,
    "monthly_fee" INTEGER NOT NULL DEFAULT 0,
    "stage" "Stage" NOT NULL DEFAULT '初步詢問',
    "next_action" TEXT,
    "follow_up_date" DATE,
    "red_flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_checks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "space_client_id" UUID NOT NULL,
    "check_type" "CheckType" NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT '待查',
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "space_client_id" UUID NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT '未收',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "space_clients" ADD CONSTRAINT "space_clients_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_checks" ADD CONSTRAINT "kyc_checks_space_client_id_fkey" FOREIGN KEY ("space_client_id") REFERENCES "space_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_space_client_id_fkey" FOREIGN KEY ("space_client_id") REFERENCES "space_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
