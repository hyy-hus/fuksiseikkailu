import { ReactNode, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { authStore } from "./authStore";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("auth_token"));

    useEffect(() => {
        if (token) {
            localStorage.setItem("auth_token", token);
        } else {
            localStorage.removeItem("auth_token");
        }
    }, [token]);

    const setToken = (t: string | null) => {
        setTokenState(t);
        authStore.setToken(t);
    }

    const logout = () => {
        setTokenState(null);
    }

    return (
        <AuthContext.Provider value={{ token, setToken: setToken, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

