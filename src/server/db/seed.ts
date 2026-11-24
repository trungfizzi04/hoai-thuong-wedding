import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, getPool } from "./index";
import { shows, staffProfiles, users } from "./schema";

async function seed() {
  const db = getDb();

  console.log("Seeding Hoài Thương Wedding database...");

  // 1. Admin account (linked with owner's verified Zalo ID + fallback phone/password)
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 12);
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.loginPhone, "0900000001"))
    .limit(1);

  let adminId: string;
  if (existingAdmin) {
    adminId = existingAdmin.id;
    console.log("Admin already exists:", existingAdmin.id);
  } else {
    const [createdAdmin] = await db
      .insert(users)
      .values({
        loginPhone: "0900000001",
        passwordHash: adminPasswordHash,
        zaloId: "5209053559986499314",
        zaloName: "Tiến Trung",
        role: "ADMIN",
        status: "ACTIVE",
      })
      .returning();

    if (!createdAdmin) throw new Error("Failed to seed admin user.");
    adminId = createdAdmin.id;
    console.log("Created Admin:", createdAdmin.id);
  }

  // 2. Sample Staff (2 Male, 2 Female)
  const staffPasswordHash = await bcrypt.hash("Staff@123456", 12);
  const sampleStaff = [
    {
      loginPhone: "0901111111",
      fullName: "Nguyễn Minh Khang",
      gender: "MALE" as const,
      heightCm: 175,
      aoDaiSize: "L" as const,
    },
    {
      loginPhone: "0901111112",
      fullName: "Trần Gia Bảo",
      gender: "MALE" as const,
      heightCm: 172,
      aoDaiSize: "M" as const,
    },
    {
      loginPhone: "0902222221",
      fullName: "Lê Ngọc Thảo",
      gender: "FEMALE" as const,
      heightCm: 162,
      aoDaiSize: "S" as const,
    },
    {
      loginPhone: "0902222222",
      fullName: "Phạm Thu Hà",
      gender: "FEMALE" as const,
      heightCm: 165,
      aoDaiSize: "M" as const,
    },
  ];

  for (const s of sampleStaff) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.loginPhone, s.loginPhone))
      .limit(1);

    if (!existing) {
      const [createdUser] = await db
        .insert(users)
        .values({
          loginPhone: s.loginPhone,
          passwordHash: staffPasswordHash,
          role: "STAFF",
          status: "ACTIVE",
        })
        .returning();

      if (createdUser) {
        await db.insert(staffProfiles).values({
          userId: createdUser.id,
          fullName: s.fullName,
          contactPhone: s.loginPhone,
          gender: s.gender,
          heightCm: s.heightCm,
          aoDaiSize: s.aoDaiSize,
          verifiedBy: adminId,
          verifiedAt: new Date(),
          consentAcceptedAt: new Date(),
        });
        console.log(`Created Staff: ${s.fullName} (${s.gender}, ${s.aoDaiSize})`);
      }
    }
  }

  // 3. Sample Shows (2 upcoming shows)
  const existingShows = await db.select().from(shows).limit(1);
  if (existingShows.length === 0) {
    const now = new Date();
    const show1Gather = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    show1Gather.setUTCHours(23, 30, 0, 0); // 06:30 Asia/Ho_Chi_Minh
    const show1End = new Date(show1Gather.getTime() + 4 * 60 * 60 * 1000);

    const show2Gather = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    show2Gather.setUTCHours(0, 0, 0, 0); // 07:00 Asia/Ho_Chi_Minh
    const show2End = new Date(show2Gather.getTime() + 4 * 60 * 60 * 1000);

    await db.insert(shows).values([
      {
        title: "Đám hỏi nhà trai — 6 tráp (Quận 3)",
        gatherAt: show1Gather,
        endAt: show1End,
        address: "128 Nguyễn Đình Chiểu, Phường Võ Thị Sáu",
        district: "Quận 3, TP.HCM",
        requiredMale: 6,
        requiredFemale: 0,
        wagePerPerson: 350000,
        allowanceNote: "Bao ăn sáng + nước suối, hỗ trợ gửi xe 20k",
        dressCode: "Áo dài đỏ truyền thống (shop phát), giày tây đen, quần âu đen",
        status: "OPEN",
        autoCloseWhenFull: true,
        notes: "Yêu cầu Nam cao từ 1m70, đúng giờ 06:30 có mặt thay đồ.",
        clientName: "Anh Minh Quân",
        clientPhone: "0909123456",
        totalRevenue: 3200000,
      },
      {
        title: "Lễ vu quy — Đội hình 6 Nam / 6 Nữ (Quận Hải Châu)",
        gatherAt: show2Gather,
        endAt: show2End,
        address: "45 Bạch Đằng, Hải Châu",
        district: "Quận Hải Châu, Đà Nẵng",
        requiredMale: 6,
        requiredFemale: 6,
        wagePerPerson: 320000,
        allowanceNote: "Hỗ trợ xăng xe 30k",
        dressCode: "Áo dài hồng phấn pastel (shop phát), Nữ mang giày cao gót trắng/kem",
        status: "OPEN",
        autoCloseWhenFull: true,
        notes: "Nữ cao từ 1m58, Nam cao từ 1m70, tóc gọn gàng.",
        clientName: "Chị Hoài An",
        clientPhone: "0905987654",
        totalRevenue: 5800000,
      },
    ]);
    console.log("Created 2 sample shows.");
  } else {
    console.log("Sample shows already exist, skipping.");
  }

  console.log("Seed completed successfully.");
  await getPool().end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
