// Script to create or restore the @droplinkofficial profile in Supabase
// Run this in your project (Node.js/TS environment) or adapt for a one-time use in your app

import { supabase } from "@/integrations/supabase/client";

async function ensureDroplinkOfficialProfile() {
  const username = "droplinkofficial";
  // Check if profile exists (case-insensitive)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (existing && existing.id) {
    console.log("@droplinkofficial already exists with id:", existing.id);
    return;
  }

  // Insert new profile (customize fields as needed)
  const { data, error } = await supabase.from("profiles").insert({
    username,
    business_name: "DropLink Official",
    description: "Official DropLink account.",
    has_premium: true,
    // Add any other required fields here
  });

  if (error) {
    console.error("Failed to create @droplinkofficial:", error);
  } else {
    console.log("@droplinkofficial profile created:", data);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  ensureDroplinkOfficialProfile();
}
