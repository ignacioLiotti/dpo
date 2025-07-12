"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrganizationInsert } from "@/types/organizations";

export async function createOrganizationAction(data: OrganizationInsert) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Authentication error:', userError);
      return { 
        success: false, 
        error: 'Authentication error. Please sign in again.' 
      };
    }
    
    if (!user) {
      return { 
        success: false, 
        error: 'You must be signed in to create an organization.' 
      };
    }

    console.log('Server: Creating organization for user:', user.id);

    // Create the organization
    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      
      if (error.code === '42501') {
        return { 
          success: false, 
          error: 'Permission denied. Please refresh the page and try again.' 
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to create organization' 
      };
    }

    // Revalidate relevant pages
    revalidatePath('/');
    revalidatePath('/organizations');

    return { 
      success: true, 
      data: newOrg 
    };
  } catch (err) {
    console.error('Server error creating organization:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to create organization' 
    };
  }
} 