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

// Get all obras action (organization-scoped)
export async function getAllObrasAction(organizationId?: string) {
  try {
    const supabase = await createClient();
    
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

// Get obra by ID action (for backward compatibility)
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

      const { data, error } = await supabase
        .from("obras")
        .insert({
          ...parsedInput,
          user_id: user.id,
          organization_id: parsedInput.organization_id || null,
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
        .select("*");

      // Apply organization scoping or fallback to user scoping
      if (parsedInput.organization_id) {
        // Verify user has access to the organization
        const { data: membership } = await supabase
          .from('organization_memberships')
          .select('id')
          .eq('user_id', user.id)
          .eq('organization_id', parsedInput.organization_id)
          .eq('is_active', true)
          .single();
          
        if (!membership) {
          throw new ActionError("User does not have access to this organization");
        }
        
        query = query.eq("organization_id", parsedInput.organization_id);
      } else {
        // Fallback to user-scoped query for backward compatibility
        query = query.eq("user_id", user.id);
      }

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