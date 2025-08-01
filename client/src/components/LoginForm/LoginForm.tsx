import { useState } from 'react';
import { useLoginAuthLoginPost } from '@api'
import { useAuth } from '@auth';
import { navigate } from '../../router/navigate';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { AxiosError } from 'axios';

interface APIError {
    detail: string;
}

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
        showError && ((loginMutation.error as AxiosError)?.response?.data as APIError)?.detail
            ? ((loginMutation.error as AxiosError)?.response?.data as APIError)?.detail
            : "Invalid username or password";

    if (!token) {
        return (
            <form className="LoginForm flex flex-col gap-4" onSubmit={handleLogin}>
                <Input type="text"
                    label="Username"
                    name="username"
                    placeholder="Keijo"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loginMutation.isPending}
                />
                <Input type="password"
                    label="Password"
                    name="username"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                />
                {showError && (
                    <div className="flex items-center justify-center bg-red-200 border-2 border-red-300 rounded text-red-950 p-4 text-sm">
                        {errorMessage}
                    </div>
                )}
                <Button type="submit" disabled={loginMutation.isPending} variant="blue">
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
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
