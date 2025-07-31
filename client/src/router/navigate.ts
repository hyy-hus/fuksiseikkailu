let navigateFn: ((path: string) => void) | null = null;

export function setNavigator(navigate: (path: string) => void) {
    navigateFn = navigate;
}

export function navigate(path: string) {
    if (navigateFn) {
        navigateFn(path);
    } else {
        window.location.href = path;
    }
}
