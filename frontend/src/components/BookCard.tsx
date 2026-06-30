import { Link } from "react-router-dom";
import type { Book } from "../api/types";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <div className="book-cover">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} />
        ) : (
          <div className="book-cover-fallback">
            <span>{book.title.slice(0, 1)}</span>
          </div>
        )}
        {book.available > 0 ? (
          <span className="pill pill-available">{book.available} available</span>
        ) : (
          <span className="pill pill-out">Out of stock</span>
        )}
      </div>
      <div className="book-body">
        {book.category && <span className="book-category">{book.category.name}</span>}
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
      </div>
    </Link>
  );
}
