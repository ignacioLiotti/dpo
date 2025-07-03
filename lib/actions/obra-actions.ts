"use server";

import { revalidatePath } from "next/cache";
import { authActionClient, ActionError } from "./safe-action";
import {
  createObraSchema,
  updateObraSchema,
  deleteObraSchema,
  getObraSchema,
  filterObrasSchema,
  type CreateObraFormValues,
  type UpdateObraFormValues,
} from "../../app/(sidebar)/obras/schema";
import { createClient } from "@/supabase/server";

// Get all obras action (for backward compatibility)
export async function getAllObrasAction() {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('userr',user);

    if (authError || !user) {
      throw new ActionError("User not authenticated");
    }

    const { data, error } = await supabase
      .from("obras")
      .select("*")
      .eq("user_id", user.id)
      .order("fecha_creacion", { ascending: false });

    if (error) {
      throw new ActionError(`Error fetching obras: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in getAllObrasAction:", error);
    return null;
  }
}

// Get obra by ID action (for backward compatibility)
export async function getObraActionByID(id: string) {
  try {
    const supabase = await createClient();
    
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

// Create obra action
export const createObraAction = authActionClient
  .schema(createObraSchema)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    try {
      const { data, error } = await supabase
        .from("obras")
        .insert({
          ...parsedInput,
          user_id: user.id,
        })
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

// Update obra action
export const updateObraAction = authActionClient
  .schema(updateObraSchema)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    try {
      const { id, ...updateData } = parsedInput;
      
      const { data, error } = await supabase
        .from("obras")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id) // Ensure user can only update their own obras
        .select()
        .single();

      if (error) {
        throw new ActionError(`Error updating obra: ${error.message}`);
      }

      revalidatePath("/obras");
      revalidatePath(`/obras/${id}`);
      return { success: true, data };
    } catch (error) {
      if (error instanceof ActionError) {
        throw error;
      }
      throw new ActionError("Failed to update obra");
    }
  });

// Delete obra action
export const deleteObraAction = authActionClient
  .schema(deleteObraSchema)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    try {
      const { error } = await supabase
        .from("obras")
        .delete()
        .eq("id", parsedInput.id)
        .eq("user_id", user.id); // Ensure user can only delete their own obras

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

// Get obra action
export const getObraAction = authActionClient
  .schema(getObraSchema)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    try {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .eq("id", parsedInput.id)
        .eq("user_id", user.id) // Ensure user can only access their own obras
        .single();

      if (error) {
        throw new ActionError(`Error fetching obra: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      if (error instanceof ActionError) {
        throw error;
      }
      throw new ActionError("Failed to fetch obra");
    }
  });

// Filter obras action
export const filterObrasAction = authActionClient
  .schema(filterObrasSchema)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    try {
      let query = supabase
        .from("obras")
        .select("*")
        .eq("user_id", user.id); // Ensure user can only access their own obras

      // Apply filters
      if (parsedInput.search) {
        query = query.ilike("obra_name", `%${parsedInput.search}%`);
      }
      
      if (parsedInput.estado) {
        query = query.eq("estado", parsedInput.estado);
      }
      
      if (parsedInput.reparticion_id) {
        query = query.eq("reparticion_id", parsedInput.reparticion_id);
      }
      
      if (parsedInput.area_id) {
        query = query.eq("area_id", parsedInput.area_id);
      }
      
      if (parsedInput.tipo_obra_id) {
        query = query.eq("tipo_obra_id", parsedInput.tipo_obra_id);
      }
      
      if (parsedInput.fecha_inicio) {
        query = query.gte("fecha_inicio", parsedInput.fecha_inicio.toISOString());
      }
      
      if (parsedInput.fecha_fin) {
        query = query.lte("fecha_fin", parsedInput.fecha_fin.toISOString());
      }

      // Apply pagination
      query = query
        .range(parsedInput.offset, parsedInput.offset + parsedInput.limit - 1)
        .order("fecha_creacion", { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new ActionError(`Error filtering obras: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      if (error instanceof ActionError) {
        throw error;
      }
      throw new ActionError("Failed to filter obras");
    }
  }); 