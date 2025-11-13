import { z } from 'zod'

// JSON Resume schema for validation
export const LocationSchema = z.object({
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  countryCode: z.string().optional(),
  region: z.string().optional()
})

export const BasicsSchema = z.object({
  name: z.string().optional(),
  label: z.string().optional(),
  image: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  url: z.string().url().optional(),
  summary: z.string().optional(),
  location: LocationSchema.optional()
})

export const WorkExperienceSchema = z.object({
  name: z.string().optional(),
  position: z.string().optional(),
  url: z.string().url().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()).optional()
})

export const EducationSchema = z.object({
  institution: z.string().optional(),
  url: z.string().url().optional(),
  area: z.string().optional(),
  studyType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  score: z.string().optional(),
  courses: z.array(z.string()).optional()
})

export const SkillSchema = z.object({
  name: z.string().optional(),
  level: z.string().optional(),
  keywords: z.array(z.string()).optional()
})

export const JSONResumeSchema = z.object({
  basics: BasicsSchema.optional(),
  work: z.array(WorkExperienceSchema).optional(),
  education: z.array(EducationSchema).optional(),
  skills: z.array(SkillSchema).optional(),
  confidence: z.object({
    overall: z.number().min(0).max(1),
    basics: z.number().min(0).max(1),
    work: z.number().min(0).max(1),
    education: z.number().min(0).max(1)
  }).optional()
})