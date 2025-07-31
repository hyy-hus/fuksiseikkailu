import { useState } from 'react';
import { useLoginAuthLoginPost } from '../../api/endpoints'
import { useAuth } from '../../contexts/';

export function LoginForm() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const { token, setToken, logout } = useAuth();
    const loginMutation = useLoginAuthLoginPost()

    function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        loginMutation.mutate({
            data: {
                username,
                password,
                grant_type: "password"
            },
        },
            {
                onSuccess: (res) => {
                    const token = res.data.access_token;
                    setToken(token);
                }
            }
        );
    }

    const showError = loginMutation.isError;
    const errorMessage =
        showError && (loginMutation.error as any)?.response?.data?.detail
            ? (loginMutation.error as any).response.data.detail
            : "Invalid username or password";

    if (!token) {
        return (
            <form className="LoginForm" onSubmit={handleLogin}>
                <label htmlFor="username">
                    <span>Username</span>
                    <input type="text"
                        name="username"
                        id="username"
                        value={username}
                        placeholder="Keijo"
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loginMutation.isPending}
                    />
                </label>
                <label htmlFor="password">
                    <span>Password</span>
                    <input type="password"
                        name="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loginMutation.isPending}
                    />
                </label>
                <button type="submit"
                    disabled={loginMutation.isPending}
                >
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                </button>

                {showError && (
                    <div className="error">
                        {errorMessage}
                    </div>
                )}
            </form>
        )
    }

    return (
        <div>
            <button type="button" onClick={() => logout()}>
                Logout
            </button>
        </div>
    )
}
