import './globals.css';

export const metadata = {
  title: 'VehicleIQ',
  description: 'Vehicle identification and two-photo vehicle comparison tool.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
