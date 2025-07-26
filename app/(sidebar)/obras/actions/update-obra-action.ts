"use server";

import { revalidatePath } from "next/cache";
import { authActionClient, ActionError } from "@/app/auth/safe-action";
import { updateObraSchema } from "../schema";

export const updateObraAction = authActionClient
  .schema(updateObraSchema)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    try {
      const { id, ...updateData } = parsedInput;

      // Verify user has access to this obra
      const { data: obra, error: obraError } = await supabase
        .from("obras")
        .select("user_id, organization_id")
        .eq("id", id)
        .single();

      if (obraError || !obra) {
        throw new ActionError("Obra not found");
      }

      // Convert timestamp strings to date strings for DATE columns
      const dataToUpdate = {
        ...updateData,
        fecha_inicio: updateData.fecha_inicio ? new Date(updateData.fecha_inicio).toISOString().split('T')[0] : undefined,
        fecha_fin: updateData.fecha_fin ? new Date(updateData.fecha_fin).toISOString().split('T')[0] : undefined,
        fecha_inicio_prevista: updateData.fecha_inicio_prevista ? new Date(updateData.fecha_inicio_prevista).toISOString().split('T')[0] : undefined,
        fecha_basico: updateData.fecha_basico ? new Date(updateData.fecha_basico).toISOString().split('T')[0] : undefined,
      };

      const { error } = await supabase
        .from("obras")
        .update(dataToUpdate)
        .eq("id", id);

      if (error) {
        throw new ActionError(`Error updating obra: ${error.message}`);
      }

      revalidatePath("/obras");
      revalidatePath(`/obras/${id}`);
      return { success: true };
    } catch (error) {
      if (error instanceof ActionError) {
        throw error;
      }
      throw new ActionError("Failed to update obra");
    }
  });