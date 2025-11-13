import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User onboarding profile data
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  experience: varchar("experience"), // "entry", "mid", "senior", "executive"
  industry: varchar("industry"),
  jobTitle: varchar("job_title"),
  location: varchar("location"),
  remotePreference: varchar("remote_preference"), // "remote", "hybrid", "onsite"
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  resume: text("resume"),
  skills: text("skills").array(),
  preferences: jsonb("preferences"), // Additional search preferences
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job searches/campaigns
export const jobSearches = pgTable("job_searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  status: varchar("status").default("active"), // "active", "paused", "completed"
  searchCriteria: jsonb("search_criteria"), // Job search parameters
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications
export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobSearchId: varchar("job_search_id").references(() => jobSearches.id),
  company: varchar("company").notNull(),
  position: varchar("position").notNull(),
  jobUrl: text("job_url"),
  status: varchar("status").default("applied"), // "applied", "interview", "rejected", "offer", "accepted"
  appliedAt: timestamp("applied_at").defaultNow(),
  resumeVersion: text("resume_version"), // The tailored resume used
  coverLetter: text("cover_letter"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User metrics for dashboard
export const userMetrics = pgTable("user_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: timestamp("date").defaultNow(),
  applicationsSubmitted: integer("applications_submitted").default(0),
  resumesOptimized: integer("resumes_optimized").default(0),
  jobsFound: integer("jobs_found").default(0),
  activeAgents: integer("active_agents").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types for TypeScript
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export type JobSearch = typeof jobSearches.$inferSelect;
export type InsertJobSearch = typeof jobSearches.$inferInsert;

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = typeof jobApplications.$inferInsert;

export type UserMetrics = typeof userMetrics.$inferSelect;
export type InsertUserMetrics = typeof userMetrics.$inferInsert;

// Zod schemas for validation
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserProfileData = z.infer<typeof insertUserProfileSchema>;

export const insertJobSearchSchema = createInsertSchema(jobSearches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertJobSearchData = z.infer<typeof insertJobSearchSchema>;

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertJobApplicationData = z.infer<typeof insertJobApplicationSchema>;