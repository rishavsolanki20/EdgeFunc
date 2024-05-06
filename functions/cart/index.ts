
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../cors.ts";

console.log(`Function cart and running!`);

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

    // If the request body contains data, insert it into the "cart" table
    if (req.body) {
      const requestBody: CartItem = await req.json();
      const {  id, name, price } = requestBody;

      const { error } = await supabaseClient.from("cart").insert([
        {
          item_id:id,
          name,
          price,
          user_id,
        },
      ]);

      updateCartId(); 
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


function updateCartId(){
  
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/cart' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
