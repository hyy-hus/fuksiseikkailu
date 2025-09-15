import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@auth";
import { Button } from "@components/Button";
import { IoCloseCircleSharp, IoMenu } from "react-icons/io5";
import { FaSun, FaMoon } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { navigate } from "../../router/navigate";

import { cva } from "class-variance-authority";
import { useTranslation } from "react-i18next";
import { useAdventure } from "@contexts/AdventureContext";
import { Select } from "@components/Input";
import { PublicAdventure } from "@api/model";
import { useListAdventuresAdventuresGet } from "@api/endpoints";
import { useNotifications } from "@contexts/NotificationContext";
import { GoBell } from "react-icons/go";

import { Toaster } from 'react-hot-toast';
import clsx from "clsx";


type LayoutVariant = "guest" | "admin";

function Hr() {
    return (
        <hr className="text-olive dark:text-jonquil border-1 border-black" />
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

    const { selectedAdventure, setSelectedAdventure } = useAdventure();

    const { data } = useListAdventuresAdventuresGet();

    const adventureOptions = useMemo(() => {
        if (!data?.data) {
            return [];
        }

        return data.data.map((adventure: PublicAdventure) => ({
            key: String(adventure.id),
            value: adventure.name,
        }));
    }, [data])

    useEffect(() => {
        if (data?.data && data.data.length > 0 && !selectedAdventure) {
            const firstAdventure = data.data[0];
            setSelectedAdventure({
                id: firstAdventure.id,
                name: firstAdventure.name
            });
        }
    }, [data, selectedAdventure, setSelectedAdventure])

    const navbar = cva(
        "col-span-2 border-b-3 border-black dark:border-black bg-jonquil dark:bg-fuksi-800 text-black dark:text-fuksi-400 grid grid-cols-[auto_1fr_auto] items-center p-2",
        {
            variants: {
                variant: {
                    guest: "",
                    admin: "",
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
            localStorage.setItem("theme", "light");
            setDarkMode(false);
        }
        else {
            html.classList.add("dark");
            localStorage.setItem("theme", "dark");
            setDarkMode(true);
        }
    }

    const { permission, requestPermission } = useNotifications();
    const [notificationBar, setNotificationBar] = useState<boolean>(() => permission === "default" ? true : false);

    return (
        <div className={`relative h-screen grid grid-rows-[auto_auto_1fr] ${sidebarOpen ? "grid-cols-[1fr_0] md:grid-cols-[auto_1fr]" : "grid-cols-[1fr]"} font-display text-zinc-900 dark:text-zinc-50 text-base/7`}>
            <div><Toaster /></div>
            <nav className={navbar({ variant })}>
                <Button variant="transparent" onClick={() => toggleSidebar()}><IoMenu /></Button>
                <h1 className="font-bold hover:underline flex content-center justify-center-safe dark:text-fuksi-400">
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
                                <Button variant="transparent" onClick={() => navigate("/admin/login")}>{t("login")}</Button>
                                : <Button variant="red" onClick={() => logout()} >{t("logout")}</Button>
                        ) : (
                            !token ?
                                <Button variant="transparent" onClick={() => navigate("/team")}>{t("team")}</Button>
                                : <Button variant="transparent" onClick={() => logout()} >{t("team")}</Button>
                        )
                    }
                </div>

            </nav>

            <aside className={clsx(
                "min-w-60 h-full overflow-y-auto p-4 grid grid-rows-[auto_1fr_auto] border-r-3 border-black dark:border-black",
                "bg-fuksi-300 text-black dark:bg-fuksi-900 dark:text-fuksi-400",
                sidebarOpen ? "w-full" : "overflow-hidden hidden",
            )} >
                <ul className="flex flex-col gap-4">
                    {
                        variant === "admin" ? (
                            <>
                                <li>
                                    <Select
                                        name="adventure"
                                        label={t("adventure")}
                                        options={adventureOptions}
                                        onChange={(value: string | number) => {
                                            const id = Number(value);
                                            const name = adventureOptions.find(o => Number(o.key) === id)?.value ?? "unknown";
                                            setSelectedAdventure({ id, name });
                                        }}
                                        value={selectedAdventure?.id ?? ""}
                                    />
                                </li>
                                <li><Link to="/" className="hover:underline">{t("dashboard")}</Link></li>
                                <li><Hr /></li>
                                <li><Link to="/admin/teams" className="hover:underline">{t("teams")}</Link></li>
                                <li><Link to="/admin/players" className="hover:underline">{t("players")}</Link></li>
                                <li><Link to="/admin/checkpoints" className="hover:underline">{t("checkpoints")}</Link></li>
                                <li><Link to="/admin/map" className="hover:underline">{t("map")}</Link></li>
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
                                <li><Link to="/news" className="hover:underline">{t("news")}</Link></li>
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

            <main className={`bg-fuksi-100 text-black dark:bg-fuksi-950 dark:text-white p-4 overflow-y-auto ${sidebarOpen ? "hidden md:block md:w-full" : ""}`}>
                <Outlet />
            </main>

            {
                notificationBar && (
                    <div className="absolute top-8 left-8 right-8 bg-white dark:bg-fuksi-700 border-3 border-black dark:border-black p-4 grid grid-cols-[1fr_auto] gap-4 z-50 items-center">
                        <span
                            className="flex gap-2 hover:underline cursor-pointer"
                            onClick={() => {
                                requestPermission();
                                setNotificationBar(false);
                            }}
                        >
                            <GoBell className="self-center" />
                            {t("prompt-notifications")}
                        </span>
                        <Button variant="transparent" onClick={() => setNotificationBar(false)}>
                            <IoCloseCircleSharp />
                        </Button>
                    </div>
                )
            }
        </div>
    )
}
