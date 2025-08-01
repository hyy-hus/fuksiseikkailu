let authToken: string | null = localStorage.getItem("auth_token");

export const authStore = {
    getToken: () => authToken,
    setToken: (t: string | null) => {
        authToken = t;
        if (t) localStorage.setItem("auth_token", t);
        else localStorage.removeItem("auth_token");
    }
}
