import ScenarioSelectors from '../results/ScenarioSelectors';
import ResultsTable from '../results/ResultsTable';

function MainContent() {
  return (
    <>
      <div style={{ flex: 1, paddingBottom: '48px' }}>
        <ScenarioSelectors />
        <ResultsTable />
      </div>
      <div style={{
        position: 'sticky',
        bottom: 0,
        padding: '12px 0',
        textAlign: 'center',
        fontSize: '13px',
        color: '#94a3b8',
        fontStyle: 'italic',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        marginLeft: 'calc(-1 * var(--spacing-2xl))',
        marginRight: 'calc(-1 * var(--spacing-2xl))',
        paddingLeft: 'var(--spacing-2xl)',
        paddingRight: 'var(--spacing-2xl)',
        zIndex: 100
      }}>
        Made with ❤️ by Max Kolysh
      </div>
    </>
  );
}

export default MainContent;
