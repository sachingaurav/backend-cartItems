const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Create an Express application
const app = express();
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://sakshamsharmawalmart:a0sQ4cJSVhxIb6dU@cluster0.dfbgtxu.mongodb.net/mydatabase",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const cartItemSchema = new mongoose.Schema({
  itemId: String,
  count: Number,
});

const CartItem = mongoose.model("CartItem", cartItemSchema);

app.use(express.json());

app.post("/api/cart", async (req, res) => {
  console.log("Request at /api/cart");
  console.log(req.body);
  const cartItems = req.body;
  try {
    console.log(cartItems);
    const cartItemObjects = [];

    for (const item of cartItems) {
      const { itemId, count } = item;

      const existingCartItem = await CartItem.findOne({ itemId: itemId });
      if (existingCartItem) {
        if (count == 0) {
          console.log("here");
          existingCartItem.deleteOne();
        } else {
          existingCartItem.count = count;
          await existingCartItem.save();
        }
      } else if (count != 0) {
        const newCartItem = new CartItem({ itemId: itemId, count: count });
        cartItemObjects.push(newCartItem);
        await newCartItem.save();
      }
    }
    console.log(
      `${cartItemObjects.length} new cart items inserted into MongoDB`
    );
    res.sendStatus(200);
  } catch (error) {
    console.error("Error inserting cart items:", error);
    res.sendStatus(500);
  }
});

app.get("/cartItemsWithProducts", async (req, res) => {
  try {
    console.log("Request at /cartItemsWithProducts");
    const cartItems = await CartItem.find({});
    const itemIds = cartItems.flatMap((item) => item.itemId);
    const cartWithProductInfo = await fetch(
      "http://localhost:3000/get-product-details",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemIds),
      }
    );
    var cartWithProductInfoJSON = await cartWithProductInfo.json();
    cartWithProductInfoJSON.forEach((element) => {
      const count = cartItems.filter((item) => item.itemId == element.id)[0]
        .count;
      element.count = count;
    });
    res.send(cartWithProductInfoJSON);
  } catch (error) {
    console.error("Error retrieving cart items from database:", error);
    res.status(500).send("Error retrieving cart items from database");
  }
});

app.get("/cartItems", async (req, res) => {
  console.log("Request at /cartItems");
  const cartItems = await CartItem.find({});
  const items = cartItems.map((item) => {
    return { itemId: item.itemId, count: item.count };
  });
  res.send(items);
});

app.get("/order-confirmed", async (req, res) => {
  console.log("Confirming order");
  const cartItems = await CartItem.find({});
  if (cartItems.length != 0) {
    const delRes = await CartItem.deleteMany({});
    console.log(delRes);
    console.log("Cart items deleted");
    res.send("Cart items deleted");
  }
  console.log("not deleted");
});

// Start the server
app.listen(3001, () => {
  console.log("Server is running at PORT:3001");
});
