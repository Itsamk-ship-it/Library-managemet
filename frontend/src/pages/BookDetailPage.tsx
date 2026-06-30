import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { Book, BorrowRecord } from "../api/types";
import { useAuth } from "../context/AuthContext";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoan, setHasLoan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const { book } = await api<{ book: Book }>(`/books/${id}`);
      setBook(book);
      if (user) {
        const { records } = await api<{ records: BorrowRecord[] }>("/borrows/active");
        setHasLoan(records.some((r) => r.book.id === id));
      }
    } catch {
      setBook(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function handleBorrow() {
    if (!user) return navigate("/login", { state: { from: `/books/${id}` } });
    setBusy(true);
    setMessage(null);
    try {
      await api(`/books/${id}/borrow`, { method: "POST" });
      setMessage({ type: "ok", text: "Borrowed! Due in 14 days." });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Could not borrow" });
    } finally {
      setBusy(false);
    }
  }

  async function handleReturn() {
    setBusy(true);
    setMessage(null);
    try {
      await api(`/books/${id}/return`, { method: "POST" });
      setMessage({ type: "ok", text: "Returned. Thanks!" });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Could not return" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="center pad"><div className="spinner" /></div>;
  if (!book) return <p className="muted center pad">Book not found. <Link to="/">Back to catalog</Link></p>;

  return (
    <div className="detail">
      <Link to="/" className="back-link">← Back to catalog</Link>

      <div className="detail-grid">
        <div className="detail-cover">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} />
          ) : (
            <div className="book-cover-fallback large">
              <span>{book.title.slice(0, 1)}</span>
            </div>
          )}
        </div>

        <div className="detail-info">
          {book.category && <span className="book-category">{book.category.name}</span>}
          <h1>{book.title}</h1>
          <p className="detail-author">by {book.author}</p>

          <div className="detail-meta">
            {book.publishedAt && <span>Published {book.publishedAt}</span>}
            {book.isbn && <span>ISBN {book.isbn}</span>}
            <span>{book.borrowCount} total borrows</span>
          </div>

          <div className="availability">
            {book.available > 0 ? (
              <span className="pill pill-available">{book.available} of {book.totalCopies} available</span>
            ) : (
              <span className="pill pill-out">All copies out</span>
            )}
          </div>

          {message && (
            <div className={`alert ${message.type === "ok" ? "alert-ok" : "alert-error"}`}>{message.text}</div>
          )}

          <div className="detail-actions">
            {hasLoan ? (
              <button className="btn btn-primary" disabled={busy} onClick={handleReturn}>
                {busy ? "…" : "Return this book"}
              </button>
            ) : (
              <button
                className="btn btn-primary"
                disabled={busy || book.available < 1}
                onClick={handleBorrow}
              >
                {busy ? "…" : book.available < 1 ? "Unavailable" : "Borrow"}
              </button>
            )}
          </div>

          {book.description && <p className="detail-description">{book.description}</p>}
        </div>
      </div>
    </div>
  );
}
