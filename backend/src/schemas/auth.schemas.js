import { z } from "zod";
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.email(),
    password: z.string().min(8).max(72),
    phone: z.string().min(8).max(20).optional(),
    role: z.enum(["customer", "restaurant_owner", "delivery_partner"]).optional()
  })
});
export const loginSchema = z.object({
  body: z.object({ email: z.email(), password: z.string().min(1) })
});
