// public/sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

console.log('Service Worker: Загружен');

// 1. Прекеширование ассетов билда (CSS, JS, шрифты, иконки и т.д.)
// Vite генерирует файл workbox-precaching-manifest.js (или встраивает в sw) при сборке
// который содержит список файлов билда с хэшами.
// Вручную указывать их не нужно, если используете интеграцию Vite + Workbox.
// Если вы не используете интеграцию, можно вручную указать критичные файлы:
// const urlsToCache = ['/index.html', '/manifest.json', ...];
// caches.open('vite-build-assets-v1').then(cache => cache.addAll(urlsToCache));

// В этом примере предполагается, что `self.__WB_MANIFEST` будет предоставлен сборкой (например, через @vitejs/plugin-workbox)
// Если `self.__WB_MANIFEST` не существует (например, при разработке или без плагина), прекеширование не произойдет.
try {
    precacheAndRoute(self.__WB_MANIFEST || []); // Прекешируем ассеты билда
    console.log('Service Worker: Прекеширование ассетов запланировано');
} catch (e) {
    console.warn('Service Worker: Не удалось выполнить прекеширование (MANIFEST может отсутствовать):', e);
    // В dev режиме или без плагина MANIFEST может не быть, это нормально для базовой функциональности SW.
}


// 2. Кэширование статических ресурсов (CSS, JS, изображения, шрифты) с стратегией CacheFirst
registerRoute(
    ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'image',
    new CacheFirst({
        cacheName: 'static-resources-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100, // Максимум 100 элементов
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
            }),
        ],
    })
);

// 3. Кэширование API-запросов к Supabase с стратегией NetworkFirst
// Используем конкретный URL проекта из предоставленной ссылки
registerRoute(
    ({ url }) => url.origin === 'https://sxfbodtjfkmueucuqlyx.supabase.co', // Полный URL проекта Supabase
    new NetworkFirst({
        cacheName: 'supabase-api-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50, // Максимум 50 ответов API
                maxAgeSeconds: 5 * 60, // 5 минут для свежести данных
            }),
        ],
    })
);

// 4. Кэширование шрифтов с стратегией CacheFirst
registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
        cacheName: 'font-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 30,
                maxAgeSeconds: 1 * 30 * 24 * 60 * 60, // 1 месяц
            }),
        ],
    })
);

// 5. Обработка HTML-страниц (например, для SPA маршрутизации) - стратегия NetworkFirst с Fallback
// Это помогает при навигации по внутренним маршрутам PWA
registerRoute(
    ({ request, url }) => {
        return request.mode === 'navigate' && url.origin === self.location.origin;
    },
    new NetworkFirst({
        cacheName: 'pages-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 10,
                maxAgeSeconds: 1 * 24 * 60 * 60, // 1 день
            }),
        ],
    })
);

// Событие активации SW (удаление старых кэшей при обновлении SW)
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Активация...');
    // Список кэшей, которые НЕ должны быть удалены
    const expectedCacheNames = [
        'static-resources-cache',
        'supabase-api-cache',
        'font-cache',
        'pages-cache',
        // Добавьте сюда имена кэшей, которые вы используете, если они отличаются от указанных выше
    ];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!expectedCacheNames.includes(cacheName)) {
                        console.log('Service Worker: Удаление старого кэша', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Обработка fetch-событий не требуется, так как все маршруты зарегистрированы через Workbox
