import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function App() {
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balance, setBalance] = useState({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    description: "",
    amount: "",
    currency: "INR",
    paidBy: ""
  });

  // ---------------- LOAD DATA ----------------
  const loadAll = async () => {
    try {
      const [u, e, b] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/expenses`),
        axios.get(`${API}/balance`)
      ]);

      setUsers(u.data || []);
      setExpenses(e.data || []);
      setBalance(b.data || {});
    } catch (err) {
      console.log("API Error:", err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ---------------- USERS ----------------
  const addUser = async () => {
    const name = prompt("Enter user name");
    if (!name) return;

    await axios.post(`${API}/users`, { name });
    loadAll();
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;

    await axios.delete(`${API}/users/${id}`);
    loadAll();
  };

  // ---------------- EXPENSE ----------------
  const addExpense = async () => {
    if (!form.description || !form.amount || !form.paidBy) {
      alert("Fill all fields");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/expenses`, {
        description: form.description,
        amount: Number(form.amount),
        currency: form.currency,
        paidBy: Number(form.paidBy)
      });

      setForm({
        description: "",
        amount: "",
        currency: "INR",
        paidBy: ""
      });

      loadAll();
    } catch (err) {
      console.log(err.message);
    }

    setLoading(false);
  };

  // ---------------- CLEAR DATA ----------------
  const clearData = async () => {
    if (!confirm("Clear all data?")) return;

    await axios.delete(`${API}/clear`);
    loadAll();
  };

  // ---------------- UI ----------------
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={{ textAlign: "center" }}>💰 Split Expense App</h1>

        <button onClick={clearData} style={styles.clearBtn}>
          Clear All Data
        </button>

        {/* USERS */}
        <h2>👥 Users</h2>
        <button onClick={addUser} style={styles.btn}>+ Add User</button>

        <div style={styles.row}>
          {users.map(u => (
            <div key={u.id} style={styles.card}>
              {u.name}
              <button onClick={() => deleteUser(u.id)} style={styles.deleteBtn}>
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* EXPENSE FORM */}
        <h2>➕ Add Expense</h2>

        <div style={styles.form}>
          <input
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            style={styles.input}
          />

          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            style={styles.input}
          />

          <select
            value={form.currency}
            onChange={e => setForm({ ...form, currency: e.target.value })}
            style={styles.input}
          >
            <option>INR</option>
            <option>USD</option>
            <option>EUR</option>
          </select>

          <select
            value={form.paidBy}
            onChange={e => setForm({ ...form, paidBy: e.target.value })}
            style={styles.input}
          >
            <option value="">Select Payer</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={addExpense} style={styles.btn}>
          {loading ? "Adding..." : "Add Expense"}
        </button>

        {/* EXPENSE LIST */}
        <h2>📋 Expenses</h2>
        {expenses.length === 0 && <p>No expenses yet</p>}

        {expenses.map(e => {
          const payer = users.find(u => u.id === e.paidBy);

          return (
            <div key={e.id} style={styles.expense}>
              <div>
                <b>{e.description}</b>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Paid by: {payer ? payer.name : "Unknown"}
                </div>
              </div>

              <div>
                ₹{Math.round(e.amount || 0)}
                <div style={{ fontSize: "10px" }}>converted</div>
              </div>
            </div>
          );
        })}

        {/* BALANCE */}
        <h2>💸 Balances</h2>
        {Object.keys(balance).length === 0 && <p>No balance data</p>}

        {Object.entries(balance).map(([id, val]) => {
          const user = users.find(u => u.id === Number(id));

          return (
            <div key={id} style={styles.balance}>
              <b>{user ? user.name : "Unknown User"}</b>
              <span style={{ color: val >= 0 ? "green" : "red" }}>
                {val >= 0
                  ? `+₹${Math.round(val)}`
                  : `-₹${Math.abs(Math.round(val))}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- STYLES ----------------
const styles = {
  page: {
    fontFamily: "Arial",
    background: "#f4f6f9",
    minHeight: "100vh",
    padding: "20px"
  },
  container: {
    maxWidth: "900px",
    margin: "auto",
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.1)"
  },
  btn: {
    background: "#4CAF50",
    color: "white",
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "10px"
  },
  clearBtn: {
    background: "#ff4d4d",
    color: "white",
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  input: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "6px"
  },
  row: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  card: {
    background: "#eef2ff",
    padding: "10px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center"
  },
  deleteBtn: {
    marginLeft: "10px",
    color: "red",
    border: "none",
    background: "transparent",
    cursor: "pointer"
  },
  form: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  expense: {
    display: "flex",
    justifyContent: "space-between",
    background: "#f9fafb",
    padding: "10px",
    marginTop: "5px",
    borderRadius: "8px"
  },
  balance: {
    display: "flex",
    justifyContent: "space-between",
    background: "#f1f5f9",
    padding: "8px",
    marginTop: "5px",
    borderRadius: "6px"
  }
};