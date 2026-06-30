export type Role = "USER" | "ADMIN";
export type BorrowStatus = "BORROWED" | "RETURNED" | "OVERDUE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { books: number };
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  coverUrl: string | null;
  publishedAt: number | null;
  totalCopies: number;
  available: number;
  borrowCount: number;
  categoryId: string | null;
  category: Category | null;
  createdAt: string;
}

export interface BorrowRecord {
  id: string;
  status: BorrowStatus;
  borrowedAt: string;
  dueAt: string;
  returnedAt: string | null;
  book: Book;
  overdue?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminStats {
  stats: {
    totalBooks: number;
    totalCopies: number;
    totalUsers: number;
    activeLoans: number;
    overdueLoans: number;
    totalCategories: number;
  };
  recentBorrows: Array<{
    id: string;
    borrowedAt: string;
    status: BorrowStatus;
    book: { title: string; author: string };
    user: { name: string; email: string };
  }>;
  topBooks: Array<{ id: string; title: string; author: string; borrowCount: number }>;
}
