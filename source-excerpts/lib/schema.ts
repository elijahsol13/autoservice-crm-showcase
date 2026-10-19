// lib/schema.ts
import { z } from "zod";

const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;

export const bookingSchema = z.object({
  name: z.string()
    .min(2, "Имя должно содержать минимум 2 буквы")
    .max(50, "Имя слишком длинное"),
  phone: z.string()
    .regex(phoneRegex, "Введите корректный номер (например, +7 999 123-45-67)"),
});