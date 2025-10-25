export default function NotFound() {
  return (
    <main style={{ padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ marginBottom: '1rem' }}>Страница не найдена</p>
      <a href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
        Вернуться на главную
      </a>
    </main>
  );
}
