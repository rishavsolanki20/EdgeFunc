import express from "express"; 
import process from "node:process";
import { corsHeaders } from "../cors.ts";
import { createClient } from "@supabase/supabase-js"; 
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

const supabase = createClient(process.env.URL, process.env.KEY);

async function getUserId(req: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id;
}

app.get("/items", async (req: any, res: any) => {
  try {
    const user_id = await getUserId(req);
    const { data: items, error } = await supabase.from("items").select("*");

    if (error) {
      console.log("Error fetching data: ", error);
      throw error;
    }

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(400).json({ error: error.message });
  }
});

app.post("/items", async (req: any, res: any) => {
  try {
    const user_id = await getUserId(req);
    const { name, price } = req.body;

    const { error } = await supabase.from("items").insert([
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

    return res.status(200).json({
      message: "Data inserted into 'items' successfully!",
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(400).json({ error: error.message });
  }
});

app.listen(8000, () => {
  console.log(`Server is running on port ${8000}`);
});
