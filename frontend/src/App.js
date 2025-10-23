import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export default function App() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    async function load() {
        const res = await fetch('/api/tasks');
        setTasks(await res.json());
    }
    useEffect(() => { load(); }, []);
    async function addTask(e) {
        e.preventDefault();
        if (!title.trim())
            return;
        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });
        setTitle('');
        load();
    }
    async function toggle(id, done) {
        await fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done }),
        });
        load();
    }
    async function remove(id) {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        load();
    }
    return (_jsxs("main", { style: { fontFamily: 'system-ui', maxWidth: 720, margin: '48px auto' }, children: [_jsx("h1", { children: "TP2 Tasks" }), _jsxs("form", { onSubmit: addTask, style: { display: 'flex', gap: 8 }, children: [_jsx("input", { value: title, onChange: e => setTitle(e.target.value), placeholder: "Nouvelle t\u00E2che\u2026", style: { flex: 1, padding: 8 } }), _jsx("button", { children: "Ajouter" })] }), _jsx("ul", { children: tasks.map(t => (_jsxs("li", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("input", { type: "checkbox", checked: t.done, onChange: e => toggle(t.id, e.target.checked) }), _jsx("span", { style: { textDecoration: t.done ? 'line-through' : 'none' }, children: t.title }), _jsx("button", { onClick: () => remove(t.id), children: "Supprimer" })] }, t.id))) })] }));
}
