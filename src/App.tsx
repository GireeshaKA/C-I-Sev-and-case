function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#F37421' }}>C&amp;I – Severity and Cases</h1>
      <p style={{ color: '#666', fontSize: '1.1rem' }}>
        Unified Site Health, Severity &amp; Case Intelligence
      </p>
      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '1.5rem 0' }} />
      <p>
        This dashboard is under development. The application scaffold and
        data architecture have been initialized.
      </p>
      <h2 style={{ color: '#333', marginTop: '2rem' }}>Planned Sections</h2>
      <ul style={{ lineHeight: '2' }}>
        <li>Overview &amp; KPIs</li>
        <li>Site Health</li>
        <li>Open Cases</li>
        <li>Case Tracker</li>
        <li>Historical Trends</li>
      </ul>
      <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '2rem' }}>
        Live Incorta data integration is NOT implemented at this stage.
      </p>
    </div>
  );
}

export default App;
