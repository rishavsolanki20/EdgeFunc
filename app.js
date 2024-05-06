const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const process = require("process");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Supabase client during server startup
const supabase = createClient(
  "https://vlhilrmgqjuxaibhwave.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsaGlscm1ncWp1eGFpYmh3YXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQwMTkwODcsImV4cCI6MjAyOTU5NTA4N30.CCKs3yoZKthyTqEN7xh_DO9sMHFW7PfdoKSGCG35m5k"
);
app.post("/order", async (req, res) => {
  if (req.method === "OPTIONS") {
    // Respond to preflight requests for CORS
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    return res.sendStatus(204); // No content
  }

  try {
    const token = req.headers.authorization.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    const user_id = user?.id;

    console.log("req body",req.body);
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user_id,
      });

    if (orderError) {
      console.error("Supabase insert error:", orderError.message);
      return res.status(500).json({ error: orderError.message });
    }

    const order_id = orderData[0].id;
    console.log("order_id",order_id)
    for (const item of item_id) {
      const { cart_id: item_id } = item; // Assuming each object has an 'id' field for item_id
      await supabase
        .from("order-item")
        .insert({
          order_id,
          item_id
        });
    }

    console.log("Order created successfully:", orderData);

    // Now, delete all the items associated with the user's cart
    const { data: deleteData, error: deleteError } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", user_id);

    if (deleteError) {
      console.error("Error deleting cart items:", deleteError.message);
      return res.status(500).json({ error: deleteError.message });
    }

    console.log("Cart items deleted successfully:", deleteData);

    return res.status(201).send("Order created successfully");
  } catch (error) {
    console.error("Internal server error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint to retrieve all data from the 'orders' table
app.get("/order", async (req, res) => {
  try {
    // Fetch all data from the 'orders' table
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*");

    if (orderError) {
      console.error("Supabase error fetching orders:", orderError.message);
      return res.status(500).json({ error: orderError.message });
    }

    // Return the retrieved order data
    return res.status(200).json(orderData);
  } catch (error) {
    console.error("Internal server error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(8800, () => {
  console.log("Server is running on port 8800");
});
