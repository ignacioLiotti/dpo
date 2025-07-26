"use server";

import { revalidatePath } from "next/cache";
import { authActionClient, ActionError } from "@/app/auth/safe-action";
import { deleteObraSchema } from "../schema";

export const deleteObraAction = authActionClient
  .schema(deleteObraSchema)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    try {
      // Verify user has access to this obra
      const { data: obra, error: obraError } = await supabase
        .from("obras")
        .select("user_id, organization_id")
        .eq("id", parsedInput.id)
        .single();

      if (obraError || !obra) {
        throw new ActionError("Obra not found");
      }

      const { error } = await supabase
        .from("obras")
        .delete()
        .eq("id", parsedInput.id);

      if (error) {
        throw new ActionError(`Error deleting obra: ${error.message}`);
      }

      revalidatePath("/obras");
      return { success: true };
    } catch (error) {
      if (error instanceof ActionError) {
        throw error;
      }
      throw new ActionError("Failed to delete obra");
    }
  });