import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Book, Category, Pagination } from "../api/types";
import { BookCard } from "../components/BookCard";

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [popular, setPopular] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"recent" | "title" | "popular">("recent");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    api<{ categories: Category[] }>("/categories").then((r) => setCategories(r.categories)).catch(() => {});
    api<{ books: Book[] }>("/books/popular").then((r) => setPopular(r.books)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api<{ items: Book[]; pagination: Pagination }>("/books", {
      query: { q: search, category, sort, page, limit: 12 },
    })
      .then((r) => {
        setBooks(r.items);
        setPagination(r.pagination);
      })
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  return (
    <div className="stack-lg">
      <section className="hero">
        <h1>Find your next read</h1>
        <p>Browse the catalog, borrow what you love, and keep track of your reading history.</p>
        <input
          className="search-input"
          placeholder="Search by title, author or ISBN…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </section>

      {popular.length > 0 && !search && !category && (
        <section>
          <h2 className="section-title">🔥 Popular right now</h2>
          <div className="book-grid">
            {popular.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="toolbar">
          <div className="chips">
            <button
              className={`chip ${category === "" ? "chip-active" : ""}`}
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`chip ${category === c.slug ? "chip-active" : ""}`}
                onClick={() => {
                  setCategory(c.slug);
                  setPage(1);
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="select">
            <option value="recent">Newest</option>
            <option value="title">Title A–Z</option>
            <option value="popular">Most borrowed</option>
          </select>
        </div>

        {loading ? (
          <div className="center pad"><div className="spinner" /></div>
        ) : books.length === 0 ? (
          <p className="muted center pad">No books found. Try a different search.</p>
        ) : (
          <div className="book-grid">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="pagination">
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span className="muted">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              className="btn btn-ghost"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
