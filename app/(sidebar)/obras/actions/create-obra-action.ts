"use server";

import { revalidatePath } from "next/cache";
import { authActionClient, ActionError } from "@/app/auth/safe-action";
import { createObraSchema } from "../schema";

export const createObraAction = authActionClient
  .schema(createObraSchema)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    try {
      // Verify user has access to the organization
      if (parsedInput.organization_id) {
        const { data: membership } = await supabase
          .from('organization_memberships')
          .select('role')
          .eq('user_id', user.id)
          .eq('organization_id', parsedInput.organization_id)
          .eq('is_active', true)
          .single();
          
        if (!membership) {
          throw new ActionError("User does not have access to this organization");
        }
        
        // Check if user has permission to create obras
        if (!['owner', 'admin', 'member'].includes(membership.role)) {
          throw new ActionError("Insufficient permissions to create obras");
        }
      }

      // Remove user_id from input if it exists (it's set automatically)
      const { user_id: _ignoredUserId, ...inputWithoutUserId } = parsedInput as any;
      
      // Convert timestamp strings to date strings for DATE columns
      const dataToInsert = {
        ...inputWithoutUserId,
        user_id: user.id, // Always use authenticated user's ID
        organization_id: parsedInput.organization_id || null,
        // Convert timestamps to date strings (YYYY-MM-DD)
        fecha_inicio: parsedInput.fecha_inicio ? new Date(parsedInput.fecha_inicio).toISOString().split('T')[0] : null,
        fecha_fin: parsedInput.fecha_fin ? new Date(parsedInput.fecha_fin).toISOString().split('T')[0] : null,
        fecha_inicio_prevista: parsedInput.fecha_inicio_prevista ? new Date(parsedInput.fecha_inicio_prevista).toISOString().split('T')[0] : null,
        fecha_basico: parsedInput.fecha_basico ? new Date(parsedInput.fecha_basico).toISOString().split('T')[0] : null,
        fecha_creacion: new Date().toISOString().split('T')[0], // Default to today's date
      };

      const { data, error } = await supabase
        .from("obras")
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        throw new ActionError(`Error creating obra: ${error.message}`);
      }

      revalidatePath("/obras");
      return { success: true, data };
    } catch (error) {
      if (error instanceof ActionError) {
        throw error;
      }
      throw new ActionError("Failed to create obra");
    }
  });