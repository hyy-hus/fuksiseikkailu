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

export class NotificationManager {
    isPageVisible: boolean;

    constructor() {
        this.isPageVisible = true;

        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
        });
    }

    async requestPermission() {
        if ("Notification" in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    notify(title: string, options: NotificationOptions, hasPermission: boolean) {
        const { type, priority, forceSystem } = options;
        if (priority === "low" || type === "success" || type == "error") {
            return this.showInAppNotification(title, options);
        }

        if ((priority === "high" || forceSystem) && !this.isPageVisible && hasPermission) {
            return this.showSystemNotification(title, options);
        }

        return this.showInAppNotification(title, options);
    }

    showInAppNotification(title: string, options: NotificationOptions) {
        console.log(title, options);

        // const { description, type = 'info', action } = options;
        //
        // switch (type) {
        //     case 'success':
        //         return toast.success(title, { description, action });
        //     case 'error':
        //         return toast.error(title, { description, action });
        //     case 'warning':
        //         return toast.warning(title, { description, action });
        //     default:
        //         return toast.info(title, { description, action });
        // }
    }

    showSystemNotification(title: string, options: NotificationOptions) {
        const { description, onClick } = options;

        const notification = new Notification(title, {
            body: description,
            icon: '/favicon.ico',
            tag: 'app-notification',
        });

        if (onClick) {
            notification.onclick = () => {
                window.focus();
                onClick();
                notification.close();
            };
        }

        setTimeout(() => notification.close(), 5000);

        return notification;
    }
}

const getInitialPermission = () => {
    if (typeof window !== 'undefined' && "Notification" in window) {
        return Notification.permission;
    }

    return "default";
}

interface NotificationContextType {
    permission: NotificationPermission;
    requestPermission: () => void;
    notify: (title: string, options: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [manager] = useState(() => new NotificationManager());
    const [permission, setPermission] = useState<NotificationPermission>(getInitialPermission());

    const requestPermission = useCallback(async () => {
        const granted = await manager.requestPermission();
        setPermission(granted ? 'granted' : Notification.permission);
    }, [manager]);

    const notify = useCallback((title: string, options: NotificationOptions) => {
        manager.notify(title, options, permission === 'granted');
    }, [manager, permission])

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
