import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage, UsersPage, LoginPage } from "./pages";

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
