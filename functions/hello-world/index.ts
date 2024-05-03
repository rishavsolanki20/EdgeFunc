import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../cors.ts";

console.log(`Function hello-world up and running!`);

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
      .select("*")
      .eq("user_id", user_id);

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
    if (req.body) {
      const requestBody: CartItem = await req.json();
      const { name, price } = requestBody;

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
