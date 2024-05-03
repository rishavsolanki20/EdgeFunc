import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../cors.ts";

console.log(`Function test up and running!`);

// Define CartItem interface for type safety
interface CartItem {
  id: string;
  name: string;
  price: number;
  user_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
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

    // Fetch user details from Supabase
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    // Get user ID
    const user_id = user?.id;

    // If the request body contains data, insert it into the "cart" table
    if (req.body) {
      const requestBody: CartItem = await req.json();
      const {  name, price } = requestBody;

      const { error } = await supabaseClient.from("cart").insert([
        {
          name,
          price,
          user_id,
        },
      ]);

      // Handle insertion errors
      if (error) {
        console.log("Error inserting data into 'cart': ", error);
        throw error;
      }

      // If insertion is successful, return success response
      return new Response("Data inserted into 'cart' successfully!", {
        headers: { ...corsHeaders },
        status: 200,
      });
    }

    // If no data is provided in the request body, return an error response
    return new Response("No data provided in the request body", {
      headers: { ...corsHeaders },
      status: 400,
    });

  } catch (error) {
    // Handle any errors
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
