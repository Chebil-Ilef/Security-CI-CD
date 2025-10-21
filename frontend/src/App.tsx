import React, { useEffect, useState } from 'react';

type Task = { id: number; title: string; done: boolean };

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');

  async function load() {
    const res = await fetch('/api/tasks');
    setTasks(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setTitle('');
    load();
  }

  async function toggle(id: number, done: boolean) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 720, margin: '48px auto' }}>
      <h1>TP2 Tasks</h1>
      <form onSubmit={addTask} style={{ display: 'flex', gap: 8 }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Nouvelle tâche…"
          style={{ flex: 1, padding: 8 }}
        />
        <button>Ajouter</button>
      </form>
      <ul>
        {tasks.map(t => (
          <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={e => toggle(t.id, e.target.checked)}
            />
            <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>
              {t.title}
            </span>
            <button onClick={() => remove(t.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </main>
  );
}