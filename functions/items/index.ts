const express = require("express"); 
const { corsHeaders } = require("../cors.ts");
const { createClient } = require("https://esm.sh/@supabase/supabase-js@2.7.1");
const { Sequelize, DataTypes } = require("https://esm.sh/sequelize@6.37.3");


// Now you can access your environment variables using process.env 

const app = express();

app.use(express.json());
app.use((req:any, res:any, next:any) => {
  Object.entries(corsHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });
  next();
});

// Sequelize configuration
const sequelize = new Sequelize('postgres.vlhilrmgqjuxaibhwave','MNEq6l0IkCGVArc5','postgres',{
  dialect: 'postgres',
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
});


// Define Sequelize model for the 'items' table
const Item = sequelize.define('items', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  }
});

// Supabase client
const supabase = createClient(process.env.URL, process.env.KEY);

async function getUserId(req:any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id;
}

// Express route handlers
app.get("/items", async (req:any, res:any) => {
  try {
    const user_id = await getUserId(req);
    const items = await Item.findAll();
    return res.status(200).json({ items });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(400).json({ error: error.message });
  }
});

app.post("/items", async (req:any, res:any) => {
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

// Sync Sequelize models with the database and start the Express server
sequelize.sync().then(() => {
  app.listen(8000, () => {
    console.log(`Server is running on port ${8000}`);
  });
});