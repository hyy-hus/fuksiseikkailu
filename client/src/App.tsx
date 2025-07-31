import { Routes, Route, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { lazy, Suspense, useEffect } from "react";
import { setNavigator } from "./router/navigate";

// import { HomePage, UsersPage, LoginPage } from "@pages";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const UsersPage = lazy(() => import("./pages/UsersPage").then((m) => ({ default: m.UsersPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));

export function App() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="login" element={<LoginPage />} />
                </Route>
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
