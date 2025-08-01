import { LoginForm } from "../components";

export function LoginPage() {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="font-medium">Login</h2>
            <LoginForm />
        </div>
    )
}
