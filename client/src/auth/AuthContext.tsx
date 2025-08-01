import { createContext } from "react";

interface AuthContextProps {
    token: string | null;
    setToken: (token: string | null) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

