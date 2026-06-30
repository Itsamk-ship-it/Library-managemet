import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";
import type { Book, Category } from "../api/types";

interface BookForm {
  title: string;
  author: string;
  isbn: string;
  description: string;
  coverUrl: string;
  publishedAt: string;
  totalCopies: string;
  categoryId: string;
}

const emptyForm: BookForm = {
  title: "",
  author: "",
  isbn: "",
  description: "",
  coverUrl: "",
  publishedAt: "",
  totalCopies: "1",
  categoryId: "",
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");

  async function loadAll() {
    setLoading(true);
    const [b, c] = await Promise.all([
      api<{ items: Book[] }>("/books", { query: { limit: 100, sort: "title" } }),
      api<{ categories: Category[] }>("/categories"),
    ]);
    setBooks(b.items);
    setCategories(c.categories);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(book: Book) {
    setEditing(book);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? "",
      description: book.description ?? "",
      coverUrl: book.coverUrl ?? "",
      publishedAt: book.publishedAt?.toString() ?? "",
      totalCopies: book.totalCopies.toString(),
      categoryId: book.categoryId ?? "",
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      title: form.title,
      author: form.author,
      isbn: form.isbn || null,
      description: form.description || null,
      coverUrl: form.coverUrl || null,
      publishedAt: form.publishedAt ? Number(form.publishedAt) : null,
      totalCopies: Number(form.totalCopies),
      categoryId: form.categoryId || null,
    };
    try {
      if (editing) {
        await api(`/books/${editing.id}`, { method: "PUT", body: payload });
      } else {
        await api("/books", { method: "POST", body: payload });
      }
      setShowForm(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save book");
    }
  }

  async function handleDelete(book: Book) {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    try {
      await api(`/books/${book.id}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not delete");
    }
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await api("/categories", { method: "POST", body: { name: newCategory.trim() } });
      setNewCategory("");
      await loadAll();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not add category");
    }
  }

  if (loading) return <div className="center pad"><div className="spinner" /></div>;

  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Manage books</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add book</button>
      </div>

      <section className="panel">
        <h2 className="section-title">Categories</h2>
        <div className="chips">
          {categories.map((c) => (
            <span key={c.id} className="chip">{c.name} · {c._count?.books ?? 0}</span>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="inline-form">
          <input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button className="btn btn-ghost">Add</button>
        </form>
      </section>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Category</th>
              <th>Avail / Total</th>
              <th>Borrows</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.author}</td>
                <td>{b.category?.name ?? "—"}</td>
                <td>{b.available} / {b.totalCopies}</td>
                <td>{b.borrowCount}</td>
                <td className="row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Edit book" : "Add book"}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit} className="form">
              <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
              <label>Author<input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required /></label>
              <div className="form-row">
                <label>ISBN<input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></label>
                <label>Published year<input type="number" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} /></label>
              </div>
              <div className="form-row">
                <label>Total copies<input type="number" min={1} value={form.totalCopies} onChange={(e) => setForm({ ...form, totalCopies: e.target.value })} required /></label>
                <label>
                  Category
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">— None —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>Cover image URL<input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} placeholder="https://…" /></label>
              <label>Description<textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary">{editing ? "Save changes" : "Create book"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
