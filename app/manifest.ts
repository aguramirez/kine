import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OMEGAFIT',
    short_name: 'OMEGAFIT',
    description: 'Gestión de pacientes',
    start_url: '/',
    display: 'standalone',
    background_color: '#ff6d00',
    theme_color: '#ff6d00',
    icons: [
      {
        src: '/api/icon-square',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
