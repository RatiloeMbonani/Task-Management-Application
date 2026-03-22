const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root',
    database: 'task_app'
});

db.connect(err => {
    if (err) {
        console.error("❌ DB Error:", err);
    } else {
        console.log("✅ Connected to MySQL");
    }
});

app.get('/', (req, res) => {
    res.send("Backend working!");
});

/* =========================
   SIGNUP
========================= */
app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;

    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkSql, [email], (checkErr, checkResult) => {
        if (checkErr) return res.status(500).json({ message: "Database error" });

        if (checkResult.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const insertSql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        db.query(insertSql, [name, email, password], (insertErr, insertResult) => {
            if (insertErr) return res.status(500).json({ message: "Failed to create user" });

            res.json({
                message: "Signup successful",
                user: {
                    id: insertResult.insertId,
                    name,
                    email
                }
            });
        });
    });
});

/* =========================
   LOGIN
========================= */
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT id, name, email FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (result.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({
            message: "Login successful",
            user: result[0]
        });
    });
});

/* =========================
   TASKS
========================= */
app.get('/tasks', (req, res) => {
    db.query("SELECT * FROM tasks ORDER BY due_date ASC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get('/tasks/user/:userId', (req, res) => {
    const { userId } = req.params;

    db.query(
        "SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC",
        [userId],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
});

app.post('/tasks', (req, res) => {
    const { user_id, title, category, due_date, progress, status } = req.body;

    const sql = `
        INSERT INTO tasks (user_id, title, category, due_date, progress, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [user_id, title, category, due_date, progress ?? 0, status ?? 'pending'],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Task added successfully" });
        }
    );
});

app.put('/tasks/:id', (req, res) => {
    const { progress, status } = req.body;
    const { id } = req.params;

    const sql = "UPDATE tasks SET progress = ?, status = ? WHERE id = ?";
    db.query(sql, [progress, status, id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Task updated successfully" });
    });
});

app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM tasks WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Task deleted successfully" });
    });
});

/* =========================
   DASHBOARD SUMMARY
========================= */
app.get('/dashboard-summary/:userId', (req, res) => {
    const { userId } = req.params;

    db.query("SELECT * FROM tasks WHERE user_id = ?", [userId], (err, tasks) => {
        if (err) return res.status(500).json(err);

        const today = new Date().toISOString().split("T")[0];

        const totalTasks = tasks.length;
        const dueToday = tasks.filter(task => String(task.due_date).split("T")[0] === today).length;
        const highPriority = 0;
        const assignedToMe = totalTasks;

        const todo = tasks.filter(task => task.status === "pending");
        const inProgress = tasks.filter(task => task.status === "in-progress");
        const completed = tasks.filter(task => task.status === "completed");

        res.json({
            totalTasks,
            dueToday,
            highPriority,
            assignedToMe,
            todo,
            inProgress,
            completed
        });
    });
});

/* =========================
   ANALYTICS SUMMARY
========================= */
app.get('/analytics-summary/:userId', (req, res) => {
    const { userId } = req.params;

    db.query("SELECT * FROM tasks WHERE user_id = ?", [userId], (err, tasks) => {
        if (err) return res.status(500).json(err);

        const completedTasks = tasks.filter(task => task.status === "completed").length;
        const pendingTasks = tasks.filter(task => task.status === "pending").length;
        const totalTasks = tasks.length;

        const today = new Date().toISOString().split("T")[0];
        const upcomingDeadlines = tasks.filter(task => String(task.due_date).split("T")[0] >= today).length;

        const categoryCounts = {};
        tasks.forEach(task => {
            const category = task.category || "Other";
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const categoryLabels = Object.keys(categoryCounts);
        const categoryData = Object.values(categoryCounts);

        const progressLabels = tasks.map(task => task.title);
        const progressData = tasks.map(task => task.progress);

        res.json({
            completedTasks,
            pendingTasks,
            totalTasks,
            upcomingDeadlines,
            categoryLabels,
            categoryData,
            progressLabels,
            progressData
        });
    });
});

app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});