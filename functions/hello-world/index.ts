/* eslint-disable prettier/prettier */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../cors.ts";

console.log(`Function "select-from-table-with-auth-rls" up and running!`);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ??
        "https://vlhilrmgqjuxaibhwave.supabase.co",
      Deno.env.get("SUPABASE_ANON_KEY") ??
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsaGlscm1ncWp1eGFpYmh3YXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQwMTkwODcsImV4cCI6MjAyOTU5NTA4N30.CCKs3yoZKthyTqEN7xh_DO9sMHFW7PfdoKSGCG35m5k",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // First get the token from the Authorization header
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    const {
      data: { user },
    } = await supabaseClient.auth.getUser(token);

 
    let { data: rows, error } = await supabaseClient
      .from("items")
      .select("*")
      .eq("user_id", user?.id);
    if (!error && rows) {
      return new Response(JSON.stringify({ user, data: rows }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.log("Error fetching data: ", error);
      throw error;
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});