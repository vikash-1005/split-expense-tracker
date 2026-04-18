require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

console.log("Starting server...");
console.log("API KEY:", process.env.API_KEY);

// ---------------- LOAD DATA ----------------

let users = [];
let expenses = [];

try {
  users = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data/users.json"), "utf-8")
  );
} catch {
  users = [];
}

try {
  expenses = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data/expenses.json"), "utf-8")
  );
} catch {
  expenses = [];
}

// ---------------- SAVE DATA ----------------

const saveData = () => {
  fs.writeFileSync(
    path.join(__dirname, "data/users.json"),
    JSON.stringify(users, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "data/expenses.json"),
    JSON.stringify(expenses, null, 2)
  );
};

// ---------------- USERS ----------------

app.post("/api/users", (req, res) => {
  const user = { id: Date.now(), ...req.body };
  users.push(user);
  saveData();
  res.json(user);
});

app.get("/api/users", (req, res) => {
  res.json(users);
});

app.delete("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);

  users = users.filter(u => u.id !== id);
  expenses = expenses.filter(e => e.paidBy !== id);

  saveData();
  res.json({ message: "User deleted" });
});

// ---------------- CURRENCY API ----------------

async function convertCurrency(amount, from, to) {
  try {
    if (!from || from === to) return amount;

    const res = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.API_KEY}/latest/${from}`
    );

    const rate = res.data.conversion_rates[to];
    return amount * rate;
  } catch (err) {
    console.log("Currency API error:", err.message);
    return amount;
  }
}

// ---------------- EXPENSES ----------------

app.post("/api/expenses", async (req, res) => {
  const { amount, currency, paidBy } = req.body;

  const converted = await convertCurrency(amount, currency, "INR");

  const splitBetween = users.map(u => ({
    user: u.id,
    share: converted / users.length
  }));

  const expense = {
    id: Date.now(),
    ...req.body,
    amount: converted,
    currency: "INR",
    splitBetween
  };

  expenses.push(expense);
  saveData();

  res.json(expense);
});

app.get("/api/expenses", (req, res) => {
  res.json(expenses);
});

// ---------------- BALANCE (FIXED) ----------------

app.get("/api/balance", (req, res) => {
  let balance = {};

  expenses.forEach(exp => {
    const payer = exp.paidBy;

    if (!exp.splitBetween) return; // 🔥 FIX

    exp.splitBetween.forEach(p => {
      if (!balance[p.user]) balance[p.user] = 0;
      if (!balance[payer]) balance[payer] = 0;

      balance[p.user] -= p.share;
      balance[payer] += p.share;
    });
  });

  res.json(balance);
});

// ---------------- CLEAR ----------------

app.delete("/api/clear", (req, res) => {
  users = [];
  expenses = [];
  saveData();
  res.json({ message: "Cleared" });
});

// ---------------- START ----------------

app.listen(5000, () => {
  console.log("Server running on port 5000");
});