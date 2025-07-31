import { createContext, useContext, useState, ReactNode } from "react";

export let currentToken: string | null = null;
export const setCurrentToken = (t: string | null) => { currentToken = t };

interface AuthContextProps {
    token: string | null;
    setToken: (token: string | null) => void
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);

    const setTokenAndGlobal = (t: string | null) => {
        setToken(t)
        setCurrentToken(t)
    }

    return (
        <AuthContext.Provider value={{ token, setToken: setTokenAndGlobal }}>
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
