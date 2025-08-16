const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// 👉 Serve static files from "public"
app.use(express.static("public"));

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = "OptimaBank";
const collectionName = "images";

app.post("/upload", async (req, res) => {
  try {
    const { type, user_id, voucher_id, data } = req.body; // accept both

    const db = client.db(dbName);
    let query = {};
    let logId = "";

    if (user_id) {
      query = { user_id };
      logId = user_id;
    } else if (voucher_id) {
      query = { voucher_id };
      logId = voucher_id;
    } else {
      return res
        .status(400)
        .json({ success: false, error: "No user_id or voucher_id provided" });
    }

    console.log(`🔹 /upload triggered by id: ${logId}, type: ${type}`);
    console.log("📤 Uploaded data preview:", data.slice(0, 100) + "..."); // preview first 100 chars

    const result = await db.collection(collectionName).updateOne(
      query,
      {
        $set: {
          type,
          data,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    console.log(`✅ MongoDB updateOne result:`, result);

    // Return the _id of the document
    const doc = await db.collection(collectionName).findOne(query);
    console.log(`📌 Returning MongoDB document _id: ${doc._id}`);

    res.json({ success: true, id: doc._id });
  } catch (err) {
    console.error("❌ Error in /upload:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch image by MongoDB ID
app.get("/image/:id", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const db = client.db(dbName);

    console.log(`🔹 /image/:id triggered with id: ${req.params.id}`);

    const image = await db
      .collection(collectionName)
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!image) {
      console.log("⚠️ Image not found");
      return res.json({ success: false });
    }

    console.log("✅ Image found, sending base64 data");
    res.json({ success: true, base64: image.data });
  } catch (err) {
    console.error("❌ Error in /image/:id:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/images", async (req, res) => {
  try {
    const db = client.db(dbName);
    console.log("🔹 /images triggered, returning all documents");

    const docs = await db.collection(collectionName).find().toArray();
    console.log(`📌 Found ${docs.length} documents`);
    res.json(docs);
  } catch (error) {
    console.error("❌ Error in /images:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, async () => {
  await client.connect();
  console.log("🚀 Server running at http://localhost:3000");
});
