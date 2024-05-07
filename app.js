const express = require("express");  
const { createClient } = require("@supabase/supabase-js");
const { Sequelize, DataTypes } = require("sequelize");
const cors = require("cors")
require('dotenv').config();



const app = express();

app.use(express.json());
app.use(cors())
const sequelize = new Sequelize('postgres', 'postgres.vlhilrmgqjuxaibhwave', 'MNEq6l0IkCGVArc5', {
  dialect: 'postgres',
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
});


// Define Sequelize model for the 'items' table
const Item = sequelize.define('items', {
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
});

const Cart = sequelize.define("carts", {
  item_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
});

const supabase = createClient(process.env.URL, process.env.KEY);

async function getUserId(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id;
}

// Express route handlers
app.get("/items", async (req, res) => {
  try {
    const user_id = await getUserId(req);
    const items = await Item.findAll();
    return res.status(200).json({ items });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(400).json({ error: error.message });
  }
});

app.post("/items", async (req, res) => {
  try {
    const user_id = await getUserId(req);
    const { name, price } = req.body;

    // Create a new item using Sequelize
    await Item.create({
      name,
      price,
      user_id,
    });

    return res.status(200).json({
      message: "Data inserted into 'items' successfully!",
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(400).json({ error: error.message });
  }
});

app.post("/cart", async (req, res) => {
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

sequelize.sync().then(() => {
  app.listen(8000, () => {
    console.log(`Server is running on port ${8000}`);
  });
});