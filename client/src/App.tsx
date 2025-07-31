import { Routes, Route, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage, UsersPage, LoginPage } from "./pages";
import { useEffect } from "react";
import { setNavigator } from "./router/navigate";

export function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="login" element={<LoginPage />} />
            </Route>
        </Routes >
    )
}

export function NavigatorRegistrar() {
    const navigate = useNavigate()
    useEffect(() => {
        setNavigator(navigate)
    }, [navigate])

    return null
}
