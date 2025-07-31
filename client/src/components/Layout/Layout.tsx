import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@auth";

export function Layout() {
    const { token, logout } = useAuth();

    return (
        <div className="h-screen grid grid-rows-[auto_1fr] grid-cols-[20rem_1fr] font-display">

            <nav className="col-span-2 bg-zinc-600 text-white flex items-center p-4 gap-4">
                <Link to="/" className="hover:underline">Home</Link>
                <Link to="/users" className="hover:underline">Users</Link>
                {!token && <Link to="/login" className="hover:underline">Login</Link>}
                {token && (
                    <button onClick={() => logout()} >Logout</button>
                )}
            </nav>

            <aside className="Sidebar bg-zinc-400 p-4">
                <p>Sidebar content</p>
            </aside>

            <main className="bg-zinc-200 p-4 overflow-y-auto">
                <Outlet />
            </main>
        </div >
    )
}
