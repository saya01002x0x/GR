import Link from 'next/link';

export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1
            style={{
              fontSize: '6rem',
              fontWeight: 800,
              color: '#e52e5c',
              margin: 0,
              lineHeight: 1,
            }}
          >
            404
          </h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0' }}>
            Page Not Found
          </h2>
          <p style={{ color: '#666', maxWidth: '400px', margin: '0 auto 2rem' }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/en"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#e52e5c',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go to Homepage
          </Link>
        </div>
      </body>
    </html>
  );
}
