import { ACTIVITY_TYPES, DEAL_STAGES } from "@/lib/constants";
import { z } from "zod";

const trimmedText = z.string().trim();
const requiredText = trimmedText.min(1);
const emailField = trimmedText.email("Invalid email");
const optionalText = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""));
const booleanish = z
  .union([z.boolean(), z.number(), z.string(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return normalized === "1" || normalized === "true" || normalized === "on" || normalized === "yes";
    }
    return false;
  });

const numberish = z
  .union([z.number(), z.string(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  });

const dateish = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""))
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Date must be YYYY-MM-DD",
  });

export const companyInputSchema = z.object({
  name: requiredText.min(1, "Company name is required"),
  stage: z.enum(DEAL_STAGES).default("new"),
  owner: optionalText,
  source: optionalText,
  notes: optionalText,
});

export const contactInputSchema = z.object({
  companyId: requiredText.min(1, "companyId is required"),
  name: requiredText.min(1, "Contact name is required"),
  role: optionalText,
  email: optionalText.refine((value) => value === "" || emailField.safeParse(value).success, {
    message: "Invalid email",
  }),
  phone: optionalText,
  linkedin: optionalText,
  notes: optionalText,
});

export const dealInputSchema = z.object({
  companyId: requiredText.min(1, "companyId is required"),
  title: requiredText.min(1, "Deal title is required"),
  stage: z.enum(DEAL_STAGES).default("new"),
  value: numberish.transform((value) => Math.max(0, value)),
  setupValue: numberish.transform((value) => Math.max(0, value)).default(0),
  monthlyValue: numberish.transform((value) => Math.max(0, value)).default(0),
  probability: numberish.transform((value) => Math.max(0, Math.min(100, value))),
  closeDate: dateish,
  owner: optionalText,
  notes: optionalText,
});

export const activityInputSchema = z.object({
  companyId: requiredText.min(1, "companyId is required"),
  contactId: optionalText,
  type: z.enum(ACTIVITY_TYPES),
  dueDate: dateish,
  done: booleanish.default(false),
  notes: optionalText,
});

export const loginSchema = z.object({
  password: requiredText.min(1),
});

export const agentCompanySchema = companyInputSchema.extend({
  id: optionalText,
});

export const agentContactSchema = z
  .object({
    id: optionalText,
    companyId: optionalText,
    companyName: optionalText,
    name: requiredText.min(1, "Contact name is required"),
    role: optionalText,
    email: requiredText
      .min(1, "Email is required")
      .refine((value) => emailField.safeParse(value).success, { message: "Invalid email" }),
    phone: optionalText,
    linkedin: optionalText,
    notes: optionalText,
  })
  .refine((value) => value.companyId !== "" || value.companyName !== "", {
    message: "companyId or companyName is required",
    path: ["companyId"],
  });

export const agentDealSchema = z
  .object({
    id: optionalText,
    companyId: optionalText,
    companyName: optionalText,
    title: requiredText.min(1, "Deal title is required"),
    stage: z.enum(DEAL_STAGES).default("new"),
    value: numberish.transform((value) => Math.max(0, value)),
    setupValue: numberish.transform((value) => Math.max(0, value)).default(0),
    monthlyValue: numberish.transform((value) => Math.max(0, value)).default(0),
    probability: numberish.transform((value) => Math.max(0, Math.min(100, value))),
    closeDate: dateish,
    owner: optionalText,
    notes: optionalText,
  })
  .refine((value) => value.companyId !== "" || value.companyName !== "", {
    message: "companyId or companyName is required",
    path: ["companyId"],
  });

export const agentActivitySchema = z
  .object({
    companyId: optionalText,
    companyName: optionalText,
    contactId: optionalText,
    type: z.enum(ACTIVITY_TYPES),
    dueDate: dateish,
    done: booleanish.default(false),
    notes: optionalText,
  })
  .refine((value) => value.companyId !== "" || value.companyName !== "", {
    message: "companyId or companyName is required",
    path: ["companyId"],
  });

export const agentSearchSchema = z.object({
  q: requiredText.min(1, "q is required"),
});

export function parseWithSchema<T>(schema: z.ZodSchema<T>, payload: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: z.ZodError<T>;
} {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }
  return { success: true, data: parsed.data };
}
