/// <reference lib="WebWorker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

console.log('Service Worker initialized');

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('push', (event: PushEvent) => {
    console.log('[SW] Push received');

    const payload = event.data?.json();
    if (!payload) {
        console.error('Push event did not contain a valid JSON payload.');
        return;
    }

    const { title, options } = payload;

    if (Notification.permission === 'granted') {
        const promiseChain = self.registration.showNotification(title, options);
        event.waitUntil(promiseChain);
    } else {
        console.warn('Push message received but notifications are not granted.');
        // You could still send a message to an open client here if you want
        // as we discussed in a previous conversation.
    }
})

// self.addEventListener('push', (event: PushEvent) => {
//     console.log('[Service Worker] Push Received.');
//
//     const payload = event.data?.json();
//     if (!payload) {
//         console.error('Push event did not contain a valid JSON payload.');
//         return;
//     }
//
//     const { title, options } = payload;
//
//     // Check for notification permission
//     if (Notification.permission === 'granted') {
//         const promiseChain = self.registration.showNotification(title, options);
//         event.waitUntil(promiseChain);
//     } else {
//         console.warn('Push message received but notifications are not granted.');
//         // You could still send a message to an open client here if you want
//         // as we discussed in a previous conversation.
//     }
// });
//
// self.addEventListener('notificationclick', (event: NotificationEvent) => {
//     console.log('[Service Worker] Notification click received.');
//     event.notification.close();
//
//     const urlToOpen = event.notification.data?.url || '/';
//
//     event.waitUntil(
//         self.clients.matchAll({ type: 'window' }).then(clientList => {
//             for (const client of clientList) {
//                 if (client.url.includes(urlToOpen) && 'focus' in client) {
//                     return client.focus();
//                 }
//             }
//             if (self.clients.openWindow) {
//                 return self.clients.openWindow(urlToOpen);
//             }
//         })
//     );
// });
