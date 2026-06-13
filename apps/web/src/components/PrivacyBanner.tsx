export function PrivacyBanner() {
  return (
    <div style={{
      background: '#052e16',
      border: '1px solid #166534',
      color: '#86efac',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      fontSize: '0.85rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1.5rem',
    }}>
      <span role="img" aria-label="lock">🔒</span>
      <span>
        <strong>Privacidad por diseño.</strong> Los archivos se procesan localmente en tu navegador y nunca se suben a ningún servidor.
      </span>
    </div>
  )
}
