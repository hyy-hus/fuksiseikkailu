import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@auth";
import { Button } from "@components/Button";
import { IoMenu } from "react-icons/io5";
import { FaSun, FaMoon } from "react-icons/fa";
import { useEffect, useState } from "react";
import { navigate } from "../../router/navigate";

import { cva } from "class-variance-authority";
import { useTranslation } from "react-i18next";


type LayoutVariant = "guest" | "admin";

function Hr() {
    return (
        <hr className="text-zinc-400 dark:text-slate-600" />
    )
}

interface LayoutProps {
    variant: LayoutVariant;
}

export function Layout({
    variant,
}: LayoutProps) {
    const { token, logout } = useAuth();

    const { t, i18n } = useTranslation();

    const [darkMode, setDarkMode] = useState<boolean>(document.documentElement.classList.contains("dark"));
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(localStorage.getItem("sidebar") === "open");

    type Language = "fi" | "sv" | "en";
    const [selectedLanguage, setSelectedLanguage] = useState<Language>((i18n.language as Language) ?? "en");

    useEffect(() => {
        i18n.changeLanguage(selectedLanguage);
    }, [selectedLanguage]);

    const navbar = cva(
        "col-span-2 border-b grid grid-cols-[auto_1fr_auto] items-center p-2",
        {
            variants: {
                variant: {
                    guest: "bg-zinc-300 dark:bg-slate-900 border-zinc-400 dark:border-slate-700",
                    admin: "bg-rose-300 dark:bg-rose-950 border-rose-400 dark:border-rose-800",
                },
                defaultVariants: {
                    variant: "guest",
                }
            }
        }
    )

    const location = useLocation();

    useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
            localStorage.setItem("sidebar", "closed");
        }
    }, [location])

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

            <nav className={navbar({ variant })}>
                <Button variant="transparent" onClick={() => toggleSidebar()}><IoMenu /></Button>
                <h1 className="font-bold hover:underline flex content-center justify-center-safe">
                    {
                        variant === "admin" ? (
                            <Link to="/admin">{t("fresher-adventure")} 2025 - {t("admin")}</Link>
                        ) : (
                            <Link to="/">{t("fresher-adventure")} 2025</Link>
                        )
                    }
                </h1>
                <div className="inline">
                    {
                        variant === "admin" ? (
                            !token ?
                                <Button variant="transparent" onClick={() => navigate("/login")}>{t("login")}</Button>
                                : <Button variant="red" onClick={() => logout()} >{t("logout")}</Button>
                        ) : (
                            !token ?
                                <Button variant="transparent" onClick={() => navigate("/team")}>{t("team")}</Button>
                                : <Button variant="red" onClick={() => logout()} >{t("team")}</Button>
                        )
                    }
                </div>

            </nav>

            <aside className={`Sidebar h-full overflow-y-auto bg-zinc-300 dark:bg-slate-900 border-r border-zinc-400 dark:border-slate-700 p-4 grid grid-rows-[auto_1fr_auto] ${sidebarOpen ? "w-full" : "overflow-hidden sr-only"}`}>
                <ul className="flex flex-col gap-4">
                    {
                        variant === "admin" ? (
                            <>
                                <li><Link to="/" className="hover:underline">{t("dashboard")}</Link></li>
                                <li><Hr /></li>
                                <li><Link to="/admin/teams" className="hover:underline">{t("teams")}</Link></li>
                                <li><Link to="/admin/players" className="hover:underline">{t("players")}</Link></li>
                                <li><Link to="/admin/checkpoints" className="hover:underline">{t("checkpoints")}</Link></li>
                                <li><Link to="/admin/news" className="hover:underline">{t("news")}</Link></li>
                                <li><Link to="/admin/scores" className="hover:underline">{t("scores")}</Link></li>
                                <li><Link to="/admin/costumes" className="hover:underline">{t("costume-contest")}</Link></li>
                                <li><Link to="/admin/leaderboard" className="hover:underline">{t("leaderboard")}</Link></li>
                                <li><Link to="/admin/adventures" className="hover:underline">{t("adventures")}</Link></li>
                                <li><Hr /></li>
                                <li><Link to="/admin/users" className="hover:underline">{t("users")}</Link></li>
                                <li><Hr /></li>
                                <li><Link to="/admin/playground" className="hover:underline">{t("playground")}</Link></li>
                                <li><Hr /></li>
                                <li><Link to="/" className="hover:underline">{t("participants")}</Link></li>
                            </>

                        ) : (
                            <>
                                <li><Link to="/" className="hover:underline">{t("frontpage")}</Link></li>
                                <li><Link to="/checkpoints" className="hover:underline">{t("checkpoints")}</Link></li>
                                <li><Link to="/map" className="hover:underline">{t("map")}</Link></li>
                                <li><Link to="/costumes" className="hover:underline">{t("costume-contest")}</Link></li>
                                <li><Link to="/leaderboard" className="hover:underline">{t("leaderboard")}</Link></li>
                            </>

                        )
                    }
                </ul>
                <div></div>
                <div className="flex items-center justify-center mt-6">
                    <Button onClick={toggleTheme} variant="transparent">
                        <span>{t("theme")}:</span> {darkMode ?
                            <FaSun /> :
                            <FaMoon />
                        }
                    </Button>
                    <select className="p-4" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value as Language)}>
                        <option value="fi">FI</option>
                        <option value="sv">SV</option>
                        <option value="en">EN</option>
                    </select>
                </div>
            </aside>

            <main className={`bg-zinc-200 dark:bg-slate-900 dark:text-zinc-100 p-4 overflow-y-auto ${sidebarOpen ? "hidden md:block md:w-full" : ""}`}>
                <Outlet />
            </main>
        </div >
    )
}
