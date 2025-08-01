import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@auth";
import { Button } from "@components/Button";
import { IoMenu } from "react-icons/io5";
import { FaSun, FaMoon } from "react-icons/fa";
import { useState } from "react";
import { navigate } from "../../router/navigate";

export function Layout() {
    const { token, logout } = useAuth();

    const [darkMode, setDarkMode] = useState<boolean>(document.documentElement.classList.contains("dark"));
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(localStorage.getItem("sidebar") === "open");

    function toggleSidebar() {
        if (sidebarOpen) {
            setSidebarOpen(false);
            localStorage.setItem("sidebar", "closed");
        } else {
            setSidebarOpen(true);
            localStorage.setItem("sidebar", "open");
        }
    }

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
        <div className={`h-screen grid grid-rows-[auto_1fr] ${sidebarOpen ? "grid-cols-[1fr_0] md:grid-cols-[auto_1fr]" : "grid-cols-[1fr]"} font-display text-zinc-900 dark:text-zinc-50`}>

            <nav className="col-span-2 bg-zinc-300 dark:bg-slate-900 border-b border-zinc-400 dark:border-slate-700 flex items-center p-4 gap-4 overflow-x-auto">
                <Button variant="transparent" onClick={() => toggleSidebar()}><IoMenu /></Button>

            </nav>

            <aside className={`Sidebar bg-zinc-300 dark:bg-slate-900 border-r border-zinc-400 dark:border-slate-700 p-4 ${sidebarOpen ? "w-full" : "overflow-hidden sr-only"}`}>
                <ul className="grid h-full grid-rows-[repeat(3,_auto)_1fr_auto] gap-4">
                    <li><Link to="/" className="hover:underline">Home</Link></li>
                    <li><Link to="/users" className="hover:underline">Users</Link></li>
                    <li><Link to="/playground" className="hover:underline">Playground</Link></li>
                    <li>{!token ? <Button onClick={() => navigate("/login")}>Login</Button> :
                        (
                            <Button variant="red" onClick={() => logout()} >Logout</Button>
                        )}</li>
                    <li></li>
                    <li className="flex items-center justify-center">
                        <Button onClick={toggleTheme} variant="transparent">
                            <span>Theme:</span> {darkMode ?
                                <FaSun /> :
                                <FaMoon />
                            }
                        </Button>
                        <Button variant="transparent">
                            <span>Lang: EN</span>
                        </Button>
                    </li>
                </ul>
            </aside>

            <main className={`bg-zinc-200 dark:bg-slate-900 dark:text-zinc-100 p-4 overflow-y-auto ${sidebarOpen ? "hidden md:block md:w-full" : ""}`}>
                <Outlet />
            </main>
        </div >
    )
}
