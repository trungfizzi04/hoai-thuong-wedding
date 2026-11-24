import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "STAFF"]);
export const userStatusEnum = pgEnum("user_status", [
  "INVITED",
  "PENDING_APPROVAL",
  "ACTIVE",
  "SUSPENDED",
]);
export const genderEnum = pgEnum("gender", ["MALE", "FEMALE"]);
export const aoDaiSizeEnum = pgEnum("ao_dai_size", ["S", "M", "L", "XL", "XXL", "3XL"]);
export const showStatusEnum = pgEnum("show_status", [
  "OPEN",
  "FULL",
  "CLOSED",
  "COMPLETED",
  "CANCELLED",
]);
export const registrationStatusEnum = pgEnum("registration_status", [
  "PENDING",
  "APPROVED",
  "WAITLIST",
  "REJECTED",
  "CANCELLED",
  "NO_SHOW",
]);
export const aoDaiStatusEnum = pgEnum("ao_dai_status", ["NONE", "ISSUED", "RETURNED"]);
export const paymentStatusEnum = pgEnum("payment_status", ["UNPAID", "PAID"]);
export const auditTargetTypeEnum = pgEnum("audit_target_type", [
  "SHOW",
  "REGISTRATION",
  "USER",
]);

/**
 * 1. USERS — Danh tính đăng nhập (Zalo OAuth v4 &/hoặc SĐT + Mật khẩu dự phòng)
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").unique(),
    loginPhone: text("login_phone").unique(),
    passwordHash: text("password_hash"),
    zaloId: text("zalo_id").unique(),
    zaloName: text("zalo_name"),
    zaloAvatarUrl: text("zalo_avatar_url"),
    zaloIsSensitive: boolean("zalo_is_sensitive"),
    zaloRawProfile: jsonb("zalo_raw_profile").$type<Record<string, unknown>>(),
    role: userRoleEnum("role").notNull().default("STAFF"),
    status: userStatusEnum("status").notNull().default("PENDING_APPROVAL"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_role_status_idx").on(t.role, t.status)],
);

/**
 * 2. SESSIONS — Phiên đăng nhập lưu DB (thu hồi tức thì khi SUSPENDED / xóa tài khoản)
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

/**
 * 3. LOGIN_ATTEMPTS — Rate Limit 2 tầng: UNIQUE(identifier, ip_address) + tổng theo identifier
 */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    ipAddress: text("ip_address").notNull(),
    failCount: integer("fail_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("login_attempts_identifier_ip_uniq").on(t.identifier, t.ipAddress),
    index("login_attempts_identifier_idx").on(t.identifier),
  ],
);

/**
 * 4. INVITE_TOKENS — Link kích hoạt riêng dùng 1 lần (72h) gửi qua Zalo cá nhân
 */
export const inviteTokens = pgTable(
  "invite_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("invite_tokens_user_id_idx").on(t.userId)],
);

export interface StaffPhotoItem {
  publicId: string;
  hash: string;
}

/**
 * 5. STAFF_PROFILES — Hồ sơ tối thiểu 6 trường + album tối đa 4 ảnh cá nhân (tách biệt avatar Zalo)
 */
export const staffProfiles = pgTable(
  "staff_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    gender: genderEnum("gender").notNull(),
    heightCm: integer("height_cm").notNull(),
    aoDaiSize: aoDaiSizeEnum("ao_dai_size").notNull(),
    primaryPhotoPublicId: text("primary_photo_public_id"),
    photoItems: jsonb("photo_items").$type<StaffPhotoItem[]>().notNull().default([]),
    weightKg: integer("weight_kg"),
    encryptedBankInfo: text("encrypted_bank_info"),
    isTrusted: boolean("is_trusted").notNull().default(false),
    reputationScore: integer("reputation_score").notNull().default(100),
    verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    consentAcceptedAt: timestamp("consent_accepted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("staff_profiles_gender_idx").on(t.gender)],
);

/**
 * 6. SHOWS — Show bưng quả (Slot Nam/Nữ riêng, gatherAt/endAt timestamptz, ngày suy theo Asia/Ho_Chi_Minh)
 */
export const shows = pgTable(
  "shows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    gatherAt: timestamp("gather_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    address: text("address").notNull(),
    district: text("district").notNull(),
    requiredMale: integer("required_male").notNull().default(0),
    requiredFemale: integer("required_female").notNull().default(0),
    wagePerPerson: integer("wage_per_person").notNull(),
    allowanceNote: text("allowance_note"),
    dressCode: text("dress_code").notNull(),
    zaloGroupUrl: text("zalo_group_url"),
    status: showStatusEnum("status").notNull().default("OPEN"),
    autoCloseWhenFull: boolean("auto_close_when_full").notNull().default(true),
    notes: text("notes"),
    clientName: text("client_name"),
    clientPhone: text("client_phone"),
    totalRevenue: integer("total_revenue"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shows_status_gather_at_idx").on(t.status, t.gatherAt)],
);

/**
 * 7. REGISTRATIONS — Đơn đăng ký show (UNIQUE(show_id, user_id), hỗ trợ upsert khi đăng ký lại)
 */
export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    showId: uuid("show_id")
      .notNull()
      .references(() => shows.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: registrationStatusEnum("status").notNull().default("PENDING"),
    isConfirmed: boolean("is_confirmed").notNull().default(false),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    isTeamLeader: boolean("is_team_leader").notNull().default(false),
    aoDaiStatus: aoDaiStatusEnum("ao_dai_status").notNull().default("NONE"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("UNPAID"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    cancelledBy: uuid("cancelled_by").references(() => users.id, { onDelete: "set null" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("registrations_show_user_uniq").on(t.showId, t.userId),
    index("registrations_show_status_idx").on(t.showId, t.status),
    index("registrations_user_status_idx").on(t.userId, t.status),
  ],
);

/**
 * 8. AUDIT_LOGS — Nhật ký truy vết thao tác quản trị & thay đổi slot
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: auditTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_target_idx").on(t.targetType, t.targetId),
    index("audit_logs_actor_idx").on(t.actorUserId),
  ],
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(staffProfiles, {
    fields: [users.id],
    references: [staffProfiles.userId],
  }),
  sessions: many(sessions),
  inviteTokens: many(inviteTokens),
  registrations: many(registrations),
}));

export const staffProfilesRelations = relations(staffProfiles, ({ one }) => ({
  user: one(users, {
    fields: [staffProfiles.userId],
    references: [users.id],
  }),
}));

export const showsRelations = relations(shows, ({ many }) => ({
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  show: one(shows, {
    fields: [registrations.showId],
    references: [shows.id],
  }),
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type StaffProfile = typeof staffProfiles.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type Registration = typeof registrations.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
