import { Routes, Route, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { lazy, Suspense, useEffect } from "react";
import { setNavigator } from "./router/navigate";

import "./App.css";

const GuestHomePage = lazy(() => import("./pages/GuestHomePage").then((m) => ({ default: m.GuestHomePage })));
const AdminHomePage = lazy(() => import("./pages/AdminHomePage").then((m) => ({ default: m.AdminHomePage })));
const AdminNewsPage = lazy(() => import("./pages/AdminNewsPage").then((m) => ({ default: m.AdminNewsPage })));
const AdminLeaderboardPage = lazy(() => import("./pages/AdminLeaderboardPage").then((m) => ({ default: m.LeaderboardPage })));
const UsersPage = lazy(() => import("./pages/UsersPage").then((m) => ({ default: m.UsersPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const PlaygroundPage = lazy(() => import("./pages/PlaygroundPage").then((m) => ({ default: m.PlaygroundPage })));

const AdventuresPage = lazy(() => import("./pages/AdventuresPage").then((m) => ({ default: m.AdventuresPage })));
const CheckpointsPage = lazy(() => import("./pages/CheckpointsPage").then((m) => ({ default: m.CheckpointsPage })));
const UserCheckpointsPage = lazy(() => import("./pages/usersCheckpointPage").then((m) => ({ default: m.CheckpointsPage })));
const TeamsPage = lazy(() => import("./pages/TeamsPage").then((m) => ({ default: m.TeamsPage })));

const AdminMapPage = lazy(() => import("./pages/AdminMapPage").then((m) => ({ default: m.AdminMapPage })));

const UserMapPage = lazy(() => import("./pages/UserMapPage").then((m) => ({ default: m.UserMapPage })));
const NewsPage = lazy(() => import("./pages/NewsPage").then((m) => ({ default: m.NewsPage })));

const ScorePage = lazy(() => import("./pages/ScorePage").then((m) => ({ default: m.ScorePage })));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage").then((m) => ({ default: m.LeaderboardPage })));
const CostumePage = lazy(() => import("./pages/CostumePage").then((m) => ({ default: m.CostumePage })));
const AdminPhotosPage = lazy(() => import("./pages/AdminPhotosPage").then((m) => ({ default: m.AdminPhotosPage })));
const AdminScoresPage = lazy(() => import("./pages/AdminScoresPage").then((m) => ({ default: m.AdminScoresPage })));

const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));
const LoadingPage = lazy(() => import("./pages/LoadingPage").then((m) => ({ default: m.LoadingPage })));

const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

export function App() {
    return (
        <Suspense fallback={<LoadingPage />}>
            <Routes>
                <Route path="/admin" element={<Layout variant="admin" />}>
                    <Route index element={<AdminHomePage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route path="playground" element={<PlaygroundPage />} />
                    <Route path="adventures" element={<AdventuresPage />} />
                    <Route path="checkpoints" element={<CheckpointsPage />} />
                    <Route path="leaderboard" element={<AdminLeaderboardPage />} />
                    <Route path="map" element={<AdminMapPage />} />
                    <Route path="teams" element={<TeamsPage />} />
                    <Route path="news" element={<AdminNewsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="costumes" element={<AdminPhotosPage />} />
                    <Route path="scores" element={<AdminScoresPage />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/" element={<Layout variant="guest" />}>
                    <Route index element={<GuestHomePage />} />
                    <Route path="map" element={<UserMapPage />} />
                    <Route path="map/:slug" element={<UserMapPage />} />
                    <Route path="news" element={<NewsPage />} />
                    <Route path="scores/:slug" element={<ScorePage />} />
                    <Route path="leaderboard" element={<LeaderboardPage />} />
                    <Route path="checkpoints" element={<UserCheckpointsPage />} />
                    <Route path="costumes" element={<CostumePage />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="loading" element={<LoadingPage />} />
            </Routes>
        </Suspense>
    )
}

export function NavigatorRegistrar() {
    const navigate = useNavigate()
    useEffect(() => {
        setNavigator(navigate)
    }, [navigate])

    return null
}
