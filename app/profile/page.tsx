import { createClient } from "@/supabase/server";
import { InfoIcon, UserCircle } from "lucide-react";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileForm } from "@/app/profile/profile-components/profile-form";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import type { Profile } from "@/types/supabase";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch profile data
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*") // Select specific columns if needed: 'username, full_name, avatar_url, website'
    .eq("id", user.id)
    .single();

  // Handle potential errors during profile fetch
  if (error && error.code !== 'PGRST116') { // PGRST116: Row not found is okay, means no profile yet
    console.error("Error fetching profile:", error);
    // Optionally display an error message to the user
  }

  const userEmail = user.email || "No email provided";
  const username = profile?.username || "No username set";
  const fullName = profile?.full_name || "No full name set";
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-2xl mx-auto py-8">
      {/* Protected Page Info Box */}
      <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center border border-border">
        <InfoIcon size="16" strokeWidth={2} />
        This is your profile page, only visible to you when logged in.
      </div>

      {/* Profile Display Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl ?? undefined} alt={fullName ?? username} />
            <AvatarFallback>
              <GradientAvatar size={60} username={fullName} />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{fullName}</CardTitle>
            <CardDescription>@{username} &middot; {userEmail}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display other profile details if available */}
          {profile?.website && (
            <p className="text-sm text-muted-foreground">
              Website:{" "}
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                {profile.website}
              </a>
            </p>
          )}
          {/* Placeholder for more details or edit button */}
          <p className="text-sm text-muted-foreground pt-4">
            (Profile editing functionality coming soon!)
          </p>
        </CardContent>
      </Card>

      <ProfileForm profile={profile} />


      {/* Raw User Data (Optional - Keep for debugging?) */}
      <details className="mt-4">
        <summary className="text-sm font-medium cursor-pointer">View Raw Auth Data</summary>
        <pre className="mt-2 text-xs font-mono p-3 rounded border bg-muted max-h-48 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </details>

    </div>
  );
}
