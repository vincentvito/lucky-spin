import { z } from "zod";

export const prizeSchema = z.object({
  name: z.string().min(1, "Prize name is required").max(100),
  probability: z
    .number()
    .min(0.01, "Minimum probability is 1%")
    .max(1.0, "Maximum probability is 100%"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
  total_quantity: z.number().int().positive().nullable(),
  sort_order: z.number().int(),
});

export const campaignSchema = z
  .object({
    name: z.string().min(1, "Campaign name is required").max(200),
    description: z.string().max(1000).optional(),
    board_headline: z
      .string()
      .min(1)
      .max(100)
      .default("Scan & Win!"),
    board_subheadline: z
      .string()
      .max(200)
      .default("Try your luck and win amazing prizes!"),
    board_bg_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .default("#FFFFFF"),
    board_text_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .default("#000000"),
    board_accent_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .default("#FF6B00"),
    wheel_base_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .nullable()
      .default(null),
    play_bg_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .nullable()
      .default(null),
    prizes: z.array(prizeSchema).min(1, "At least one prize is required").max(20),
  })
  .refine(
    (data) => {
      const totalProb = data.prizes.reduce((sum, p) => sum + p.probability, 0);
      return totalProb <= 1.0;
    },
    { message: "Total prize probability must not exceed 100%", path: ["prizes"] }
  );

export const playSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  campaignSlug: z.string().min(1),
});

export const businessSchema = z.object({
  business_name: z.string().min(1, "Business name is required").max(200),
});

export type CampaignFormData = z.infer<typeof campaignSchema>;
export type PrizeFormData = z.infer<typeof prizeSchema>;
export type PlayFormData = z.infer<typeof playSchema>;
