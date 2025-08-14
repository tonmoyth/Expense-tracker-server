require("dotenv").config();
const express = require("express");
const cors = require("cors");
const PORT = 3000;
const { MongoClient, ServerApiVersion } = require("mongodb");

// Middleware to parse JSON
const app = express();
app.use(express.json());
app.use(cors());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const database = client.db("Expense-tracker");
    const expensesCollection = database.collection("Expense");

    // POST /expenses  Add new expense
    app.post("/expenses", async (req, res) => {
      try {
        const { title, amount, category, date } = req.body;

        // Validation
        if (!title || title.length < 3)
          return res
            .status(400)
            .json({ message: "Title must be at least 3 characters" });
        if (!amount || Number(amount) <= 0)
          return res
            .status(400)
            .json({ message: "Amount must be greater than 0" });
        if (!date || isNaN(new Date(date).getTime()))
          return res.status(400).json({ message: "Invalid date" });

        const newExpense = {
          title,
          amount: parseInt(amount),
          category: category || "Others",
          date: new Date(date),
        };

        const result = await expensesCollection.insertOne(newExpense);
        res.status(201).json({ _id: result.insertedId, ...newExpense });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // GET all expenses
    app.get("/expenses", async (req, res) => {
      try {
        const expenses = await expensesCollection
          .find()
          .sort({ date: -1 })
          .toArray();
        res.json(expenses);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch expenses", error });
      }
    });
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Sample route
app.get("/", (req, res) => {
  res.send("expense server");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
