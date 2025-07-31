import { useState } from 'react';
import { useLoginAuthLoginPost } from '../../api/endpoints'
import { useAuth } from '../../contexts/';

export function LoginForm() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const { setToken } = useAuth();
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

    if (loginMutation.isSuccess) {
        console.log(`Token: ${loginMutation.data}`)
    }

    return (
        <form className="LoginForm" onSubmit={handleLogin}>
            <label htmlFor="username">
                <span>Username</span>
                <input type="text" name="username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Keijo" />
            </label>
            <label htmlFor="password">
                <span>Password</span>
                <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button type="submit">Login</button>
        </form>
    )
}
