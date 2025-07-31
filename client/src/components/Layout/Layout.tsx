import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@auth";

export function Layout() {
    const { token, logout } = useAuth();

    return (
        <div className="app-layout">
            <nav className="navbar">
                <Link to="/">Home</Link>
                <Link to="/users">Users</Link>
                {!token && <Link to="/login">Login</Link>}
                {token && (
                    <button onClick={() => logout()} >Logout</button>
                )}
            </nav>

            <aside className="sidebar">
                <p>Sidebar content</p>
            </aside>

            <main>
                <Outlet />
            </main>
        </div>
    )
}
