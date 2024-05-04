import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../cors.ts";

console.log(`Function items  and running!`);

// Define CartItem interface for type safety
interface CartItem {
  id: string;
  name: string;
  price: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("URL") ??
        "?",
      Deno.env.get("KEY") ??
        "?",
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

    // Fetch items from "items" table for the user
    let { data: items, error: fetchError } = await supabaseClient
      .from("items")
      .select("*");

    // Handle fetch errors
    if (fetchError) {
      console.log("Error fetching data: ", fetchError);
      throw fetchError;
    }

    // If items are fetched successfully, return them
    if (items) {
      return new Response(JSON.stringify({ user, items }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }


    // If insertion is successful, return success response
    return new Response("Data inserted into 'cart' successfully!", {
      headers: { ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    // Handle any errors
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
console.log(Deno.env.get('SUPABASE_URL'))

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/select-from-table-with-auth-rls' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/items' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
