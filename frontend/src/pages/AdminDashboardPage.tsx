import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { AdminStats } from "../api/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<AdminStats>("/admin/stats")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center pad"><div className="spinner" /></div>;
  if (!data) return <p className="muted">Could not load stats.</p>;

  const cards = [
    { label: "Books", value: data.stats.totalBooks },
    { label: "Total copies", value: data.stats.totalCopies },
    { label: "Members", value: data.stats.totalUsers },
    { label: "Active loans", value: data.stats.activeLoans },
    { label: "Overdue", value: data.stats.overdueLoans, alert: data.stats.overdueLoans > 0 },
    { label: "Categories", value: data.stats.totalCategories },
  ];

  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Admin dashboard</h1>
        <Link to="/admin/books" className="btn btn-primary">Manage books →</Link>
      </div>

      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className={`stat-card ${c.alert ? "stat-alert" : ""}`}>
            <span className="stat-value">{c.value}</span>
            <span className="stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="two-col">
        <section className="panel">
          <h2 className="section-title">Most borrowed</h2>
          {data.topBooks.length === 0 ? (
            <p className="muted">No borrows yet.</p>
          ) : (
            <ol className="ranked-list">
              {data.topBooks.map((b) => (
                <li key={b.id}>
                  <span>{b.title}</span>
                  <span className="badge">{b.borrowCount}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="panel">
          <h2 className="section-title">Recent activity</h2>
          {data.recentBorrows.length === 0 ? (
            <p className="muted">No recent borrows.</p>
          ) : (
            <ul className="activity-list">
              {data.recentBorrows.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.user.name}</strong> borrowed <em>{r.book.title}</em>
                  </div>
                  <span className="muted small">{formatDate(r.borrowedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
