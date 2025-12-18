import ScenarioSelectors from '../results/ScenarioSelectors';
import ResultsTable from '../results/ResultsTable';

function MainContent() {
  return (
    <div className="main-content">
      <ScenarioSelectors />
      <ResultsTable />
    </div>
  );
}

export default MainContent;
