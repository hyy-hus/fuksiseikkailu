import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export let currentToken: string | null = null;
export const setCurrentToken = (t: string | null) => { currentToken = t };

interface AuthContextProps {
    token: string | null;
    setToken: (token: string | null) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("auth_token"));

    useEffect(() => {
        setCurrentToken(token);

        if (token) {
            localStorage.setItem("auth_token", token);
        } else {
            localStorage.removeItem("auth_token");
        }
    }, [token]);

    const setToken = (t: string | null) => {
        setTokenState(t)
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

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return ctx;
}
