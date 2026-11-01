
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Create SQLite database
const db = new Database("studyflow.db");

// Create tasks table
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    dueDate TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium',
    completed INTEGER NOT NULL DEFAULT 0
  )
`);

// Get all tasks
app.get("/api/tasks", (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY dueDate").all();

  res.json(
    tasks.map((task) => ({
      ...task,
      completed: Boolean(task.completed),
    }))
  );
});

// Add a task
app.post("/api/tasks", (req, res) => {
  const { title, subject, dueDate, priority = "Medium" } = req.body;

  if (!title || !subject || !dueDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const result = db.prepare(`
    INSERT INTO tasks (title, subject, dueDate, priority)
    VALUES (?, ?, ?, ?)
  `).run(title, subject, dueDate, priority);

  res.status(201).json({
    id: Number(result.lastInsertRowid),
    title,
    subject,
    dueDate,
    priority,
    completed: false,
  });
});

// Update a task
app.put("/api/tasks/:id", (req, res) => {
  const { title, subject, dueDate, priority, completed } = req.body;

  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?")
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: "Task not found" });
  }

  const updated = {
    title: title ?? existing.title,
    subject: subject ?? existing.subject,
    dueDate: dueDate ?? existing.dueDate,
    priority: priority ?? existing.priority,
    completed: completed === undefined
      ? existing.completed
      : Number(Boolean(completed)),
  };

  db.prepare(`
    UPDATE tasks
    SET title = ?, subject = ?, dueDate = ?,
        priority = ?, completed = ?
    WHERE id = ?
  `).run(
    updated.title,
    updated.subject,
    updated.dueDate,
    updated.priority,
    updated.completed,
    req.params.id
  );

  res.json({
    id: Number(req.params.id),
    ...updated,
    completed: Boolean(updated.completed),
  });
});

// Delete a task
app.delete("/api/tasks/:id", (req, res) => {
  const result = db.prepare("DELETE FROM tasks WHERE id = ?")
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json({ message: "Task deleted successfully" });
});

// Start server
app.listen(PORT, () => {
  console.log(`StudyFlow API running at http://localhost:${PORT}`);
});
