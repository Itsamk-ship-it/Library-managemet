import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="brand">
          📚 Bookworm
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>
            Catalog
          </NavLink>
          {user && <NavLink to="/my-loans">My Loans</NavLink>}
          {user && <NavLink to="/history">History</NavLink>}
          {user?.role === "ADMIN" && <NavLink to="/admin">Dashboard</NavLink>}
          {user?.role === "ADMIN" && <NavLink to="/admin/books">Manage Books</NavLink>}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-user">
                {user.name}
                {user.role === "ADMIN" && <span className="badge">admin</span>}
              </span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
