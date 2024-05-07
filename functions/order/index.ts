import express from "express";
import { createClient } from "@supabase/supabase-js";
import process from "node:process";
import { corsHeaders } from "../cors.ts"; 
require('dotenv').config();

// Now you can access your environment variables using process.env
console.log(process.env.MY_VARIABLE);


const app = express();

app.use(express.json());
app.use((req: any, res: any, next: any) => {
  Object.entries(corsHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });
  next();
});

// Initialize Supabase client during server startup
const supabase = createClient(process.env.URL, process.env.KEY);
app.post("/order", async (req: any, res: any) => {
  try {
    const token = req.headers.authorization.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    const user_id = user?.id;

    console.log("req body", req.body);
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user_id,
      })
      .single();
    if (orderError) {
      console.error("Supabase insert error:", orderError.message);
      return res.status(500).json({ error: orderError.message });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    // Assuming 'req' is your request object and it has a 'body' property
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const order_id = data.id;

    for (let item of payload) {
      const { data: checkoutData, error: checkoutError } = await supabase
        .from("order-item")
        .insert({
          order_id,
          item_id: item.item_id,
        });

      if (checkoutError) {
        console.error(checkoutError);
      }
    }

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
// app.get("/order", async (req, res) => {
//   try {
//     // Fetch all data from the 'orders' table
//     const { data: orderData, error: orderError } = await supabase
//       .from("orders")
//       .select("*");

//     if (orderError) {
//       console.error("Supabase error fetching orders:", orderError.message);
//       return res.status(500).json({ error: orderError.message });
//     }

//     // Return the retrieved order data
//     return res.status(200).json(orderData);
//   } catch (error) {
//     console.error("Internal server error:", error.message);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.get("/order", async (req: any, res: any) => {
  let { data: orders, error } = await supabase.from("order-item").select(`
      order_id,
      items ( name, price)
    `);

  if (error) return res.status(500).json({ error: error.message });
  return res.json(orders);
});

app.listen(8800, () => {
  console.log("Server is running on port 8800");
});
