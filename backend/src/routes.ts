import { Router } from 'express';

// Mini in‑memory store (pas de DB pour garder le TP simple)
let tasks = [
  { id: 1, title: 'Découvrir l\'observabilité', done: false },
  { id: 2, title: 'Brancher CI sur GitHub', done: true }
];
let nextId = 3;

export const api = Router();

api.get('/tasks', (_req, res) => {
  res.json(tasks);
});

api.post('/tasks', (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const t = { id: nextId++, title, done: false };
  tasks.push(t);
  res.status(201).json(t);
});

api.patch('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const t = tasks.find(x => x.id === id);
  if (!t) return res.status(404).json({ error: 'not found' });
  if (typeof req.body?.done === 'boolean') t.done = req.body.done;
  if (typeof req.body?.title === 'string') t.title = req.body.title;
  res.json(t);
});

api.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  tasks = tasks.filter(x => x.id !== id);
  res.status(204).end();
});