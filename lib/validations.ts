/**
 * Shared Zod validation schemas
 * Used by both client-side React Hook Form and server-side API/action validation.
 * Single source of truth — no schema duplication.
 */
import { z } from "zod";

// ─── Contact Form ─────────────────────────────────────────────

export const ContactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject is too long"),
  message: z
    .string()
    .min(20, "Message must be at least 20 characters")
    .max(5000, "Message is too long (max 5000 characters)"),
  website: z.string().max(0, "Bot detected").optional(),
});

export type ContactFormData = z.infer<typeof ContactSchema>;

// ─── Project CRUD ─────────────────────────────────────────────

export const ProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  shortDescription: z.string().min(1, "Short description is required").max(500),
  fullDescription: z.string().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  architecture: z.string().optional(),
  technologies: z.array(z.string()).min(1, "At least one technology is required"),
  githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  liveUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  metrics: z.string().optional(),
  featured: z.boolean(),
  published: z.boolean(),
  displayOrder: z.number().int(),
  githubSyncEnabled: z.boolean(),
});

export type ProjectFormData = z.infer<typeof ProjectSchema>;

// ─── Certification CRUD ───────────────────────────────────────

export const CertificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  issuer: z.string().min(1, "Issuer is required").max(200),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  published: z.boolean(),
  displayOrder: z.number().int(),
});

export type CertificationFormData = z.infer<typeof CertificationSchema>;

// ─── Skill CRUD ───────────────────────────────────────────────

export const SkillSchema = z.object({
  name: z.string().min(1, "Skill name is required").max(100),
  category: z.enum(["AI/ML", "Programming", "Databases", "Tools"]),
  iconSlug: z.string().optional(),
  displayOrder: z.number().int(),
  published: z.boolean(),
});

export type SkillFormData = z.infer<typeof SkillSchema>;

// ─── Education CRUD ───────────────────────────────────────────

export const EducationSchema = z.object({
  institution: z.string().min(1, "Institution is required").max(200),
  degree: z.string().min(1, "Degree is required").max(200),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  score: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().int(),
});

export type EducationFormData = z.infer<typeof EducationSchema>;

// ─── Social Link CRUD ─────────────────────────────────────────

export const SocialLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required").max(50),
  url: z.string().url("Must be a valid URL"),
  iconSlug: z.string().optional(),
  enabled: z.boolean(),
  displayOrder: z.number().int(),
});

export type SocialLinkFormData = z.infer<typeof SocialLinkSchema>;

// ─── Journey Entry CRUD ───────────────────────────────────────

export const JourneyEntrySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(200),
  organization: z.string().min(1, "Organization is required").max(200),
  period: z.string().min(1, "Period is required").max(100),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["education", "project", "achievement", "certification", "activity"]),
  icon: z.string().min(1),
});

export type JourneyEntryFormData = z.infer<typeof JourneyEntrySchema>;

// ─── Site Config ──────────────────────────────────────────────

export const SiteConfigSchema = z.object({
  heroTitle: z.string().min(1).max(300),
  heroSubtitle: z.string().min(1).max(500),
  availabilityStatus: z.string().max(100),
  name: z.string().min(1).max(100),
  headline: z.string().min(1).max(200),
  bio: z.string().max(2000),
  location: z.string().max(100),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  resumeUrl: z.string().url().optional().or(z.literal("")),
  aboutText: z.string().max(5000),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  leetcodeTotal: z.number().int().min(0),
  leetcodeEasy: z.number().int().min(0),
  leetcodeMedium: z.number().int().min(0),
  leetcodeHard: z.number().int().min(0),
});

export type SiteConfigFormData = z.infer<typeof SiteConfigSchema>;

// ─── Blog Post CRUD ───────────────────────────────────────────

export const BlogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(250),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(250)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  summary: z.string().min(1, "Summary is required").max(1000),
  content: z.string().optional(),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  readTime: z.string().optional(),
  canonicalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  published: z.boolean(),
  featured: z.boolean(),
  displayOrder: z.number().int(),
  publishedAt: z.string().optional(),
});

export type BlogPostFormData = z.infer<typeof BlogPostSchema>;

