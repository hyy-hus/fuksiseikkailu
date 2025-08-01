import { useListAdventuresAdventuresGet } from "@api/endpoints";
import { PublicAdventure } from "@api/model";
import { ReactNode } from "react";

import { FaTrash, FaEdit } from "react-icons/fa";

interface ListProps {
    children: ReactNode;
}

function List({ children }: ListProps) {
    return (
        <div className="grid grid-cols-[repeat(3,auto)_1fr_repeat(4,auto)] gap-2">
            {children}
        </div>
    )
}

interface AdventureListItemProps {
    adventure: PublicAdventure;
}

function AdventureListItem({ adventure }: AdventureListItemProps) {
    return (
        <ul className="contents">
            <li><input type="checkbox" /></li>
            <li>{adventure.id}</li>
            <li>{adventure.year}</li>
            <li>{adventure.name}</li>
            <li>{adventure.ongoing}</li>
            <li>{adventure.test}</li>
            <li><FaEdit /></li>
            <li><FaTrash /></li>
        </ul>
    )
}

export function AdventureList() {
    const { data, isLoading, isError, error } = useListAdventuresAdventuresGet();

    if (isLoading) {
        return (
            <div>Loading...</div>
        );
    }

    if (isError) {
        return (
            <div className="text-red-600">
                Error loading adventures: {String((error as any)?.message ?? error)}
            </div>
        )
    }

    if (!data || data.data.length === 0) {
        return <div>No adventures found</div>
    }

    return (
        <>
            <h3>Adventures</h3>
            <List>
                {
                    data.data.map(adventure => <AdventureListItem adventure={adventure} />)
                }
            </List>
        </>
    )
}
