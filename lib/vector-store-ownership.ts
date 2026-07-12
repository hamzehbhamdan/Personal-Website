import type { SupabaseClient } from "@supabase/supabase-js";

/** True iff `storeId` is a vector store owned by `userId` (per user_vector_stores).
 *  Fails closed (returns false) on missing id or any query error. */
export async function ownsStore(
  supabase: SupabaseClient,
  userId: string,
  storeId: string
): Promise<boolean> {
  if (!storeId) return false;
  const { data } = await supabase
    .from("user_vector_stores")
    .select("vector_store_id")
    .eq("user_id", userId)
    .eq("vector_store_id", storeId)
    .maybeSingle();
  return !!data;
}
