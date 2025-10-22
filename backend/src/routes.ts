import { Router } from 'express';
export const api = Router();

let tasks = [
  { id: 1, title: 'Learn Docker', done: false },
  { id: 2, title: 'Integrate Prometheus', done: false }
];

api.get('/tasks', (_req, res) => {
  res.json(tasks);
});

api.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const newTask = { id: Date.now(), title, done: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

api.patch('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const { done } = req.body;
  tasks = tasks.map(t => (t.id === id ? { ...t, done } : t));
  res.json({ ok: true });
});

api.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  tasks = tasks.filter(t => t.id !== id);
  res.json({ ok: true });
});