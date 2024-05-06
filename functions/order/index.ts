import express from "npm:express@^4.17"; 
import { createClient } from "@supabase/supabase-js";
import process from "node:process";
import { corsHeaders } from "../cors.ts";

const app = express();

app.use(express.json());
app.post( "/order", async (req, res) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      process.env.URL ?? "?",
      process.env.KEY ?? "?",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") }
        }
      }
    );

    const token = req.headers.get("Authorization").replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    const user_id = user?.id;

    const { data, error } = await supabaseClient
      .from("order")
      .insert({
        user_id: user_id,
        item_id: req.body.item_id,
        order_date: new Date()
      });

    console.log("data", data);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(201).send("Order created successfully");
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
