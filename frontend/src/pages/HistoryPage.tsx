import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { BorrowRecord } from "../api/types";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ records: BorrowRecord[] }>("/borrows/history")
      .then((r) => setRecords(r.records))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center pad"><div className="spinner" /></div>;

  return (
    <div className="stack">
      <h1>Reading history</h1>
      {records.length === 0 ? (
        <p className="muted">Nothing here yet. <Link to="/">Borrow your first book →</Link></p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Borrowed</th>
              <th>Due</th>
              <th>Returned</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/books/${r.book.id}`}>{r.book.title}</Link>
                  <div className="muted small">{r.book.author}</div>
                </td>
                <td>{formatDate(r.borrowedAt)}</td>
                <td>{formatDate(r.dueAt)}</td>
                <td>{formatDate(r.returnedAt)}</td>
                <td>
                  <span className={`status status-${r.status.toLowerCase()}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
