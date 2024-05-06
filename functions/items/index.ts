import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../cors.ts";

console.log(`Function items and running!`);

// Define CartItem interface for type safety
interface CartItem {
  id: string;
  name: string;
  price: number;
}

// Function to create Supabase client
function createSupabaseClient(req: Request) {
  return createClient(
    Deno.env.get("URL") ?? "?",
    Deno.env.get("KEY") ?? "?",
    {
      headers: { Authorization: req.headers.get("Authorization")! },
    },
  );
}

// Function to fetch user ID from Supabase
async function getUserId(req: Request) {
  const supabaseClient = createSupabaseClient(req);
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const { data: { user } } = await supabaseClient.auth.getUser(token);
  return user?.id;
}

// Function to fetch items from the "items" table
async function fetchItems(req: Request) {
  try {
    const user_id = await getUserId(req);
    const supabaseClient = createSupabaseClient(req);

    const { data: items, error: fetchError } = await supabaseClient
      .from("items")
      .select("*");

    if (fetchError) {
      console.log("Error fetching data: ", fetchError);
      throw fetchError;
    }

    if (items) {
      return new Response(JSON.stringify({ items }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}

// Function to add data to the "items" table
async function addItem(req: Request) {
  try {
    const user_id = await getUserId(req);
    const supabaseClient = createSupabaseClient(req);

    const requestBody: CartItem = await req.json();
    const { name, price } = requestBody;

    const { error } = await supabaseClient.from("items").insert([
      {
        name,
        price,
        user_id,
      },
    ]);

    if (error) {
      console.log("Error inserting data: ", error);
      throw error;
    }

    return new Response(JSON.stringify("Data inserted into 'items' successfully!"), {
      headers: { ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}

// Request handler// Request handler
Deno.serve(async (req: Request) => {  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return await fetchItems(req);
  } else if (req.method === "POST") {
    return await addItem(req);
  } else {
    return new Response("Method not allowed", {
      headers: { ...corsHeaders },
      status: 405,
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
