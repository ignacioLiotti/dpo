"use server";

import { authActionClient, ActionError } from "@/app/auth/safe-action";
import { createServerSupabaseClient } from "@/app/auth/server-utils";
import { getObraSchema } from "../schema";

export const getObraAction = authActionClient
  .schema(getObraSchema)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    try {
      const { data, error } = await supabase
        .from("obras")
        .select(`
          *,
          reparticiones(nombre),
          areas(nombre),
          tipos_obra(nombre)
        `)
        .eq("id", parsedInput.id)
        .single();

      if (error) {
        throw new ActionError(`Error fetching obra: ${error.message}`);
      }

      if (!data) {
        throw new ActionError("Obra not found");
      }

      return { success: true, data };
    } catch (error) {
      if (error instanceof ActionError) {
        throw error;
      }
      throw new ActionError("Failed to fetch obra");
    }
  });

export async function getAllObrasAction(organizationId?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new ActionError("User not authenticated");
    }

    // Build query based on whether organization ID is provided
    let query = supabase
      .from("obras")
      .select("*");

    if (organizationId) {
      // Organization-scoped query
      query = query.eq("organization_id", organizationId);
      
      // Verify user has access to this organization
      const { data: membership } = await supabase
        .from('organization_memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single();
        
      if (!membership) {
        throw new ActionError("User does not have access to this organization");
      }
    } else {
      // Fallback to user-scoped query for backward compatibility
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query.order("fecha_creacion", { ascending: false });

    if (error) {
      throw new ActionError(`Error fetching obras: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in getAllObrasAction:", error);
    return null;
  }
}

export async function getObraActionByID(id: string) {
  try {
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.error('Invalid obra ID provided:', id);
      return null;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Invalid UUID format for obra ID:', id);
      return null;
    }

    const supabase = await createServerSupabaseClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new ActionError("User not authenticated");
    }

    const { data, error } = await supabase
      .from("obras")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new ActionError(`Error fetching obra: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in getObraActionByID:", error);
    return null;
  }
}