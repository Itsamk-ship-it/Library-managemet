import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { BorrowRecord } from "../api/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function MyLoansPage() {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { records } = await api<{ records: BorrowRecord[] }>("/borrows/active");
      setRecords(records);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReturn(bookId: string) {
    setBusyId(bookId);
    try {
      await api(`/books/${bookId}/return`, { method: "POST" });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not return");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="center pad"><div className="spinner" /></div>;

  return (
    <div className="stack">
      <h1>My current loans</h1>
      {records.length === 0 ? (
        <p className="muted">You have no active loans. <Link to="/">Browse the catalog →</Link></p>
      ) : (
        <div className="loan-list">
          {records.map((r) => (
            <div key={r.id} className={`loan-row ${r.overdue ? "overdue" : ""}`}>
              <div className="loan-main">
                <Link to={`/books/${r.book.id}`} className="loan-title">{r.book.title}</Link>
                <span className="muted">{r.book.author}</span>
              </div>
              <div className="loan-dates">
                <span>Borrowed {formatDate(r.borrowedAt)}</span>
                <span className={r.overdue ? "due-overdue" : ""}>
                  {r.overdue ? "Overdue — " : "Due "}{formatDate(r.dueAt)}
                </span>
              </div>
              <button
                className="btn btn-ghost"
                disabled={busyId === r.book.id}
                onClick={() => handleReturn(r.book.id)}
              >
                {busyId === r.book.id ? "…" : "Return"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
