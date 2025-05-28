import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export const action = createSafeActionClient();

export const authActionClient = createSafeActionClient().use(async ({ next }) => {
  const supabase = await createClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  return next({
    ctx: {
      user,
      supabase,
    },
  });
}); 