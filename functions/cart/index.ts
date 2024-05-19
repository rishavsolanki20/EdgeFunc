import express from "npm:express@^4.17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import process from "node:process";
import { corsHeaders } from "../cors.ts";
import { DataTypes, Sequelize } from "sequelize";

const app = express();

app.use(express.json());
app.use((req: any, res: any, next: any) => {
  Object.entries(corsHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });
  next();
});
const sequelize = new Sequelize('postgres.vlhilrmgqjuxaibhwave','MNEq6l0IkCGVArc5','postgres',{
  dialect: 'postgres',
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
});

// Define Sequelize model for the 'cart' table
const Cart = sequelize.define("cart", {
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

// Supabase client
const supabase = createClient(process.env.URL, process.env.KEY);

// Express route handler
app.post("/cart", async (req: any, res: any) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    const user_id = user?.id;

    if (req.body) {
      const { id, name, price } = req.body;

      // Insert data into the 'Cart' table using Sequelize
      await Cart.create({
        item_id: id,
        name,
        price,
        user_id,
      });

      return res.status(200).send("Data inserted into 'cart' successfully!");
    }

    return res.status(400).send("No data provided in the request body");
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(400).json({ error: error.message });
  }
});

// Sync Sequelize models with the database and start the Express server
sequelize.sync().then(() => {
  app.listen(8000, () => {
    console.log(`Server is running on port ${8000}`);
  });
});
