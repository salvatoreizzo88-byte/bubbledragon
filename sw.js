const CACHE_NAME = 'stackdash-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/js/main.js',
    '/js/Game.js',
    '/js/Player.js',
    '/js/Enemy.js',
    '/js/Bubble.js',
    '/js/Level.js',
    '/js/LevelGenerator.js',
    '/js/Coin.js',
    '/js/Powerup.js',
    '/js/Input.js',
    '/js/GameState.js',
    '/js/GameConfig.js',
    '/js/UserManager.js',
    '/js/Database.js',
    '/js/AudioManager.js',
    '/js/AchievementManager.js',
    '/assets/sprites/player.png',
    '/assets/sprites/player_left.png',
    '/assets/sprites/enemy.png',
    '/assets/sprites/wall_3d.png',
    '/assets/sprites/bubble.png',
    '/assets/sprites/coin.png'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.log('Cache error:', err))
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});
