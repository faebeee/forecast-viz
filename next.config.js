/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    async headers() {
        return [
            {
                source: '/api/<route-name>',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, max-age=3600',
                    },
                ],
            },
        ];
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/me',
                permanent: true,
            },
        ]
    },
}

module.exports = nextConfig
