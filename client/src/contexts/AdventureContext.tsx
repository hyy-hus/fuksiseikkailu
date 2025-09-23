import { createContext, useContext, useState, ReactNode } from "react";

export interface Adventure {
    id: number;
    name: string;

    ongoing: boolean;
    can_add_scores: boolean;
    test: boolean;
}

interface AdventureContextType {
    selectedAdventure: Adventure | null;
    setSelectedAdventure: (adventure: Adventure | null) => void;
}

const AdventureContext = createContext<AdventureContextType | undefined>(undefined);

export function AdventureProvider({ children }: { children: ReactNode }) {
    const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);

    return (
        <AdventureContext.Provider value={{ selectedAdventure, setSelectedAdventure }}>
            {children}
        </AdventureContext.Provider>
    );
}

export function useAdventure() {
    const ctx = useContext(AdventureContext);
    if (!ctx) {
        throw new Error("useAdventure must be used wihtin an AdventureProvider")
    }

    return ctx;
}
