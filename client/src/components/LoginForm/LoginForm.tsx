import { useState } from 'react';
import { useLoginAuthLoginPost } from '@api'
import { useAuth } from '@auth';
import { navigate } from '../../router/navigate';
import { Button } from '@components/Button';

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

                    const redirectTo = localStorage.getItem("postLoginRedirect");
                    if (redirectTo) {
                        localStorage.removeItem("postLoginRedirect");
                        navigate(redirectTo);
                    } else {
                        navigate("/");
                    }
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
                <Button type="submit" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>

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
