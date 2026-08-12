export const staffRoles = ["STAFF", "PHARMACIST", "ADMIN"] as const;

import type { User } from "@/lib/types";

export type StaffUser = User & {
  preferred_language: "FA" | "EN";
  is_active: boolean;
  is_staff: boolean;
  last_login: string | null;
  date_joined: string;
  created_at: string;
  updated_at: string;
};

export const userRoleLabels: Record<string, string> = {
  CUSTOMER: "مشتری",
  STAFF: "کارمند",
  PHARMACIST: "فارمسست",
  ADMIN: "مدیر"
};

export function canManageUsers(role: string) {
  return role === "ADMIN";
}

export function validateTemporaryPassword(password: string, editing = false) {
  if (!password && editing) return "";
  if (password.length < 8) return "رمز موقت باید حداقل ۸ نویسه باشد.";
  return "";
}
