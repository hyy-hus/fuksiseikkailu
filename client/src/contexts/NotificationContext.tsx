import { useSubscribeNotifications } from "@api/endpoints";
import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";

type NotificationType = "info" | "success" | "error";
type NotificationPriority = "low" | "normal" | "high";

interface NotificationOptions {
    description: string;
    type: NotificationType;
    priority?: NotificationPriority
    forceSystem?: boolean;
    onClick?: () => void;
}

interface NotificationContextType {
    permission: NotificationPermission;
    requestPermission: () => void;
    notify: (title: string, options: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [permission, setPermission] = useState<NotificationPermission>(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            return Notification.permission;
        }
        return "default";
    });

    const subscribeMutation = useSubscribeNotifications();

    const requestPermission = useCallback(async () => {
        if (!("Notification" in window)) {
            console.warn("Notifications not supported.");
            return;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result !== "granted") {
            console.warn("Notification permission not granted.");
            return;
        }

        try {
            const swRegistration = await navigator.serviceWorker.ready;
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: "BGoZu2hNbSnvFV7sRq0qTOI9ZxlbTVRXmrA2zQmHxmhWTicypId8HpgcQwpL92-p2jaoOsAzRsmVGraFS5YzJTk",
            });

            subscribeMutation.mutate({
                data: {
                    endpoint: subscription.endpoint,
                    keys: subscription.toJSON().keys ?? {},
                }
            });
        } catch (err) {
            console.error("Push subscription failed", err);
        }
    }, [subscribeMutation]);

    const notify = useCallback(
        (title: string, options: NotificationOptions) => {
            const isPageVisible = !document.hidden;

            const { priority, forceSystem } = options;

            const shouldShowSystem =
                (priority === "high" || forceSystem) &&
                !isPageVisible &&
                permission === "granted";

            if (shouldShowSystem) {
                const notification = new Notification(title, {
                    body: options.description,
                    icon: "/favicon.ico",
                    tag: "app-notification",
                });

                if (options.onClick) {
                    notification.onclick = () => {
                        window.focus();
                        options.onClick?.();
                        notification.close();
                    };
                }

                setTimeout(() => notification.close(), 5000);
                return;
            }

            // fallback or default in-app notification
            console.log("[In-App Notification]", title, options);
        },
        [permission]
    );

    const value = useMemo(() => ({
        permission,
        requestPermission,
        notify
    }), [permission, requestPermission, notify]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error("useNotifications must be used wihtin a NotificationsProvider")
    }

    return ctx;
}
