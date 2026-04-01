self.addEventListener('push', function (event) {
    if (!event.data) return;

    var data = event.data.json();
    var title = data.title || 'FLOSSK Notification';
    var options = {
        body: data.body || '',
        icon: '/assets/images/logo.png',
        badge: '/assets/images/logo.png',
        data: {
            type: data.type,
            notificationId: data.notificationId,
            metadata: data.metadata
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/dashboard/notifications');
        })
    );
});
