import { useUsers } from "../../api/hooks";

export function UserList() {
    const { data, isLoading, error } = useUsers();

    if (isLoading) {
        return (
            <div>
                Loading...
            </div>
        )
    }

    if (error) {
        return (
            <div>
                Error
            </div>
        )
    }

    console.log(data.data);

    return (
        <div className="UserList">
            <ul>
                {
                    data.data?.map(u => (
                        <li key={u.id}>{u.name}</li>
                    ))
                }
            </ul>
        </div>
    )
}
