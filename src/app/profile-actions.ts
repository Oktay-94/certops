"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isValidProfileId } from "@/lib/profiles";
import { profileCookieOptions } from "@/lib/profile-cookie";

// Sets the active learner profile. Validated against the fixed profile list —
// the id is the truth that lands in cookie + every new question_attempt.
export async function setActiveProfile(id: string): Promise<void> {
  if (!isValidProfileId(id)) throw new Error(`Invalid profile id: ${id}`);

  const store = await cookies();
  store.set(profileCookieOptions(id));

  // Stats on dashboard/stats are profile-scoped — refresh after a switch.
  revalidatePath("/", "layout");
}
