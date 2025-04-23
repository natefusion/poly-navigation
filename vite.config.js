export default {
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/osrm': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/osrm/, ''),
            },
            '/tiles': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/tiles/, ''),
            },
            '/auth': {
                target: 'http://localhost:8443',
                changeOrigin: true,
            }
        }
    },
}
