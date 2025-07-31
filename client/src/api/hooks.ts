import { useQuery } from '@tanstack/react-query';
import {
    getListUsersUsersGetQueryOptions,
    ListUsersUsersGetQueryResult,
    ListUsersUsersGetQueryError
} from "./endpoints";

export function useUsers() {
    const query = useQuery<
        ListUsersUsersGetQueryResult,
        ListUsersUsersGetQueryError
    >(getListUsersUsersGetQueryOptions());

    return {
        ...query,
    }
}
