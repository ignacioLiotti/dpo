"use server";

import { encodedRedirect } from "./utils";
import { createServerSupabaseClient } from "./server-utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createServerSupabaseClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link."
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Revalidate the auth state
  revalidatePath("/", "layout");
  
  // Instead of redirecting immediately, show success message
  return encodedRedirect("success", "/sign-in", "Successfully signed in! Redirecting...");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createServerSupabaseClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createServerSupabaseClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed"
    );
  }

  return encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  
  // Revalidate the auth state
  revalidatePath("/", "layout");
  
  redirect("/sign-in");
};

// Additional auth actions for better organization management
export const refreshSessionAction = async () => {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error("Session refresh error:", error);
    return { error: error.message };
  }
  
  revalidatePath("/", "layout");
  return { data };
};

export const updateUserProfileAction = async (formData: FormData) => {
  const supabase = await createServerSupabaseClient();
  const fullName = formData.get("fullName")?.toString();
  const avatarUrl = formData.get("avatarUrl")?.toString();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "User not authenticated" };
  }

  const updates: any = {};
  
  if (fullName !== undefined) {
    updates.full_name = fullName;
  }
  
  if (avatarUrl !== undefined) {
    updates.avatar_url = avatarUrl;
  }

  // Update auth user metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: updates
  });

  if (authError) {
    console.error("Auth update error:", authError);
    return { error: authError.message };
  }

  // Also update the profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (profileError) {
    console.error("Profile update error:", profileError);
    return { error: profileError.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
};

export const deleteAccountAction = async () => {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "User not authenticated" };
  }

  // This would typically involve cleanup of user data
  // For now, just sign out (actual account deletion would need admin privileges)
  await supabase.auth.signOut();
  
  revalidatePath("/", "layout");
  redirect("/sign-in");
};