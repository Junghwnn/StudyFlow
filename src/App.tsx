
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BrowserRouter,
  NavLink,
  Routes,
  Route,
} from "react-router-dom";
import "./App.css";

type Task = {
  id: number;
  title: string;
  subject: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
};

type NewTask = Omit<Task, "id" | "completed">;

const api = axios.create({
  baseURL: "http://localhost:3001/api",
});

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function Sidebar() {
  const links = [
    { name: "Dashboard", path: "/" },
    { name: "My Tasks", path: "/tasks" },
    { name: "Calendar", path: "/calendar" },
    { name: "Progress", path: "/progress" },
  ];

  return (
    <aside className="sidebar">
      <h1>StudyFlow</h1>
      <nav>
        {links.map(({ name, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }: { isActive: boolean }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function Dashboard({ tasks }: { tasks: Task[] }) {
  const completed = tasks.filter((t) => t.completed).length;

  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 3);

  const dueSoon = tasks.filter((t) => {
    if (t.completed) return false;
    const deadline = new Date(`${t.dueDate}T23:59:59`);
    return deadline >= now && deadline <= soon;
  }).length;

  const upcoming = [...tasks]
    .filter((t) => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <div>
      <h2>Dashboard</h2>
      <p className="subtitle">
        Welcome back! Here's your study overview.
      </p>

      <div className="stats">
        {[
          { title: "Total Tasks", value: tasks.length },
          { title: "Due Soon", value: dueSoon },
          { title: "Completed", value: completed },
        ].map((stat) => (
          <div className="stat-card" key={stat.title}>
            <p>{stat.title}</p>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <section className="task-card">
        <div className="section-header">
          <h3>Upcoming Tasks</h3>
          <NavLink to="/tasks" className="add-button">
            + Add Task
          </NavLink>
        </div>

        {upcoming.length === 0 ? (
          <p>No upcoming tasks.</p>
        ) : (
          upcoming.map((task) => (
            <div className="task-row" key={task.id}>
              <div>
                <h4>{task.title}</h4>
                <p>{task.subject}</p>
              </div>
              <span>{formatDate(task.dueDate)}</span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function MyTasks({
  tasks,
  onAdd,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  onAdd: (task: NewTask) => Promise<boolean>;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] =
    useState<Task["priority"]>("Medium");
  const [saving, setSaving] = useState(false);

  async function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim() || !subject.trim() || !dueDate) return;

    setSaving(true);

    try {
      const success = await onAdd({
        title: title.trim(),
        subject: subject.trim(),
        dueDate,
        priority,
      });

      if (success) {
        setTitle("");
        setSubject("");
        setDueDate("");
        setPriority("Medium");
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>My Tasks</h2>
      <p className="subtitle">
        Manage and organize your assignments.
      </p>

      <section className="task-card">
        <div className="section-header">
          <h3>All Tasks</h3>
          <button
            type="button"
            className="add-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Task"}
          </button>
        </div>

        {showForm && (
          <form className="task-form" onSubmit={addTask}>
            <h3>Add New Task</h3>

            <label>
              Task Name
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Math Homework"
                required
              />
            </label>

            <label>
              Subject
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                required
              />
            </label>

            <label>
              Due Date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </label>

            <label>
              Priority
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Task["priority"])
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <button
              type="submit"
              className="add-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Task"}
            </button>
          </form>
        )}

        {tasks.length === 0 && (
          <p>No tasks yet. Add your first task!</p>
        )}

        {[...tasks]
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .map((task) => (
            <div className="task-row" key={task.id}>
              <div className="task-info">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => void onToggle(task)}
                />
                <div>
                  <h4 className={task.completed ? "completed" : ""}>
                    {task.title}
                  </h4>
                  <p>{task.subject}</p>
                </div>
              </div>

              <div className="task-actions">
                <span
                  className={`priority priority-${task.priority.toLowerCase()}`}
                >
                  {task.priority}
                </span>
                <span>{formatDate(task.dueDate)}</span>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => void onDelete(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}


function Calendar({ tasks }: { tasks: Task[] }) {
  const [currentMonth, setCurrentMonth] = useState(
    new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    new Date().getFullYear()
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    null
  );

  const firstDay = new Date(
    currentYear,
    currentMonth,
    1
  ).getDay();

  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const totalCells =
    Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  function dateKey(day: number) {
    return [
      currentYear,
      String(currentMonth + 1).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
  }

  function changeMonth(amount: number) {
    const newDate = new Date(
      currentYear,
      currentMonth + amount,
      1
    );

    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
    setSelectedDate(null);
  }

  const selectedTasks = tasks.filter(
    (task) => task.dueDate === selectedDate
  );

  return (
    <div>
      <h2>Calendar</h2>
      <p className="subtitle">
        View your assignments and upcoming deadlines.
      </p>

      <section className="task-card">
        <div className="calendar-header">
          <h3>
            {new Date(
              currentYear,
              currentMonth,
              1
            ).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h3>

          <div className="calendar-controls">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
            >
              →
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          {[
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ].map((day) => (
            <div className="calendar-weekday" key={day}>
              {day}
            </div>
          ))}

          {Array.from({ length: totalCells }, (_, index) => {
            const day = index - firstDay + 1;
            const valid = day > 0 && day <= daysInMonth;
            const key = valid ? dateKey(day) : "";

            const dayTasks = valid
              ? tasks.filter((task) => task.dueDate === key)
              : [];

            return (
              <button
                type="button"
                key={index}
                className={[
                  "calendar-day",
                  !valid ? "calendar-empty" : "",
                  key === todayKey ? "calendar-today" : "",
                  key === selectedDate
                    ? "calendar-selected"
                    : "",
                ].join(" ")}
                disabled={!valid}
                onClick={() => setSelectedDate(key)}
              >
                {valid && (
                  <>
                    <span className="calendar-date">
                      {day}
                    </span>

                    {dayTasks.map((task) => (
                      <span
                        className={`calendar-event priority-${task.priority.toLowerCase()}`}
                        key={task.id}
                        title={task.title}
                      >
                        {task.completed ? "✓ " : ""}
                        {task.title}
                      </span>
                    ))}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="selected-day-panel">
            <h3>
              Assignments for {formatDate(selectedDate)}
            </h3>

            {selectedTasks.length === 0 ? (
              <p>No assignments due on this date.</p>
            ) : (
              selectedTasks.map((task) => (
                <div className="task-row" key={task.id}>
                  <div>
                    <h4>{task.title}</h4>
                    <p>{task.subject}</p>
                  </div>
                  <span>
                    {task.completed ? "Completed" : task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}


function Progress({ tasks }: { tasks: Task[] }) {
  const completed = tasks.filter((t) => t.completed).length;
  const rate = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const subjects = [...new Set(tasks.map((t) => t.subject))];

  return (
    <div>
      <h2>Progress</h2>
      <p className="subtitle">
        Track your productivity and assignment completion.
      </p>

      <div className="stats">
        {[
          { title: "Total Tasks", value: tasks.length },
          { title: "Completed", value: completed },
          { title: "Completion Rate", value: `${rate}%` },
        ].map((stat) => (
          <div className="stat-card" key={stat.title}>
            <p>{stat.title}</p>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <section className="task-card">
        <h3>Task Completion by Subject</h3>

        {subjects.map((subject) => {
          const list = tasks.filter((t) => t.subject === subject);
          const done = list.filter((t) => t.completed).length;
          const percent = Math.round((done / list.length) * 100);

          return (
            <div className="progress-item" key={subject}>
              <div className="progress-label">
                <span>{subject}</span>
                <span>{percent}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await api.get<Task[]>("/tasks");
        setTasks(response.data);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Cannot connect to the StudyFlow API.");
      } finally {
        setLoading(false);
      }
    }

    void fetchTasks();
  }, []);

  async function addTask(task: NewTask): Promise<boolean> {
    try {
      const response = await api.post<Task>("/tasks", task);
      setTasks((previous) => [...previous, response.data]);
      setError("");
      return true;
    } catch (err) {
      console.error(err);
      setError("Failed to add task.");
      return false;
    }
  }

  async function toggleTask(task: Task) {
    try {
      const response = await api.put<Task>(`/tasks/${task.id}`, {
        completed: !task.completed,
      });

      setTasks((previous) =>
        previous.map((t) =>
          t.id === task.id ? response.data : t
        )
      );
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to update task.");
    }
  }

  async function deleteTask(id: number) {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((previous) => previous.filter((t) => t.id !== id));
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to delete task.");
    }
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />

        <main className="content">
          {error && (
            <p style={{ color: "#b91c1c" }} role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <p>Loading tasks...</p>
          ) : (
            <Routes>
              <Route
                path="/"
                element={<Dashboard tasks={tasks} />}
              />
              <Route
                path="/tasks"
                element={
                  <MyTasks
                    tasks={tasks}
                    onAdd={addTask}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                  />
                }
              />
              <Route
                path="/calendar"
                element={<Calendar tasks={tasks} />}
              />
              <Route
                path="/progress"
                element={<Progress tasks={tasks} />}
              />
            </Routes>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
