import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title:'WarungKu POS', description:'Sistem Kasir & Manajemen Warung Madura', manifest:'/manifest.webmanifest' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
