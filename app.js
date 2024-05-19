const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { Sequelize, DataTypes } = require("sequelize");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());
const sequelize = new Sequelize(
  "postgres",
  "postgres.vlhilrmgqjuxaibhwave",
  "MNEq6l0IkCGVArc5",
  {
    dialect: "postgres",
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
  }
);

const Item = sequelize.define("items", {
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

const Order = sequelize.define(
  "orders",
  {
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);
const Order_items = sequelize.define(
  "order-items",
  {
    order_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "orders",
        key: "id",
      },
    },
    item_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "items",
        key: "id",
      },
    },
  },
  {
    timestamps: false,
  }
);
Order_items.belongsTo(Order, { foreignKey: "order_id" });
Order_items.belongsTo(Item, { foreignKey: "item_id" });

const supabase = createClient(process.env.URL, process.env.KEY);

async function getUserId(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return user?.id;
}

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
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    const user_id = user?.id;

    if (req.body) {
      const { id, name, price } = req.body;

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

app.post("/order", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    const user_id = user?.id;

    const order = await Order.create({
      user_id: user_id,
    });
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (let item of items) {
      await Order_items.create({
        order_id: order.id,
        item_id: item.item_id,
      });
    }

    await Cart.destroy({
      where: {
        user_id: user_id,
      },
    });

    return res.status(201).send("Order created successfully");
  } catch (error) {
    console.error("Internal server error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/order", async (req, res) => {
  try {
    const orders = await Order_items.findAll({
      attributes: [],
      include: [
        {
          model: Item,
          attributes: ["name", "price"],
        },
      ],
    });

    const plainOrders = orders.map((order) => order.get({ plain: true }));

    return res.json(plainOrders);
  } catch (error) {
    console.error("Internal server error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

sequelize.sync().then(() => {
  app.listen(8000, () => {
    console.log(`Server is running on port ${8000}`);
  });
});
