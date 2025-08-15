require("dotenv").config();
const express = require("express");
const cors = require("cors");
const PORT = 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware to parse JSON
const app = express();
app.use(express.json());
app.use(cors({ origin: ['https://expense-tracker-client-ruddy.vercel.app'] }));

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
        const expenses = await expensesCollection.find().toArray();
        res.json(expenses);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch expenses", error });
      }
    });

    app.get('/expenses/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const expense = await expensesCollection.findOne({ _id: new ObjectId(id) });

        if (!expense) {
          return res.status(404).json({ message: 'Expense not found' });
        }

        res.json(expense);
      } catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });

    // PATCH API for updating expense
    app.patch("/expenses/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { title, amount, date, category } = req.body;

        const result = await expensesCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              title,
              amount,
              date: new Date(date),
              category,
            },
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Expense not found" });
        }

        res.json({ message: "Expense updated successfully" });
      } catch (err) {
        console.error(" Error updating expense:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // DELETE /expenses/:id  delete an expense
    app.delete("/expenses/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await expensesCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Expense not found" });
        }

        res.json({ message: "Expense deleted successfully" });
      } catch (err) {
        console.error(" Error deleting expense:", err);
        res.status(500).json({ error: "Internal server error" });
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
