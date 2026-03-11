import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OMEGAFIT',
    short_name: 'OMEGAFIT',
    description: 'Gestión de pacientes',
    start_url: '/',
    display: 'standalone',
    background_color: '#9A938B',
    theme_color: '#9A938B',
    icons: [
      {
        src: '/api/icon-square',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
