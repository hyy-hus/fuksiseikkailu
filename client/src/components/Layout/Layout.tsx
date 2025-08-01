import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@auth";
import { Button } from "@components/Button";
import { IoMenu } from "react-icons/io5";
import { FaSun, FaMoon } from "react-icons/fa";
import { useState } from "react";

export function Layout() {
    const { token, logout } = useAuth();

    const [darkMode, setDarkMode] = useState<boolean>(document.documentElement.classList.contains("dark"));

    function toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.contains("dark");
        if (isDark) {
            html.classList.remove("dark");
            setDarkMode(false);
        }
        else {
            html.classList.add("dark");
            localStorage.setItem("theme", "dark");
            setDarkMode(true);
        }
    }

    return (
        <div className="h-screen grid grid-rows-[auto_1fr] grid-cols-[20rem_1fr] font-display text-zinc-900 dark:text-zinc-50">

            <nav className="col-span-2 bg-zinc-300 dark:bg-slate-900 border-b border-zinc-400 dark:border-slate-700 flex items-center p-4 gap-4">
                <Button variant="transparent"><IoMenu /></Button>
                <Link to="/" className="hover:underline">Home</Link>
                <Link to="/users" className="hover:underline">Users</Link>
                <Link to="/playground" className="hover:underline">Playground</Link>
                {!token && <Link to="/login" className="hover:underline">Login</Link>}
                {token && (
                    <button onClick={() => logout()} >Logout</button>
                )}

            </nav>

            <aside className="Sidebar bg-zinc-300 dark:bg-slate-900 border-r border-zinc-400 dark:border-slate-700 p-4">
                <p>Sidebar content</p>
                <Button onClick={toggleTheme} variant="transparent">
                    <span>Theme:</span> {darkMode ?
                        <FaSun /> :
                        <FaMoon />
                    }
                </Button>
            </aside>

            <main className="bg-zinc-200 dark:bg-slate-900 dark:text-zinc-100 p-4 overflow-y-auto">
                <Outlet />
            </main>
        </div >
    )
}
