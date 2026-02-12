
export default function DropPayCheckout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9' }}>
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '2rem 2.5rem', textAlign: 'center', maxWidth: 350 }}>
        <h2 style={{ color: '#0369a1', marginBottom: 16 }}>DropPay (Pi Payments)</h2>
        <p style={{ color: '#888', marginBottom: 24 }}>The pay page feature is currently disabled.<br />This is a test/fake payment page only.</p>
        <a href="/drop-pay-fake.html" style={{ display: 'inline-block', background: '#f3f4f6', color: '#222', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.625rem 1.25rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s', marginTop: 16 }}>Go to Fake Pay Page</a>
      </div>
    </div>
  );
}
