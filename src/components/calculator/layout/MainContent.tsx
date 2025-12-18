import ResultsHeader from '../results/ResultsHeader';
import ScenarioSelectors from '../results/ScenarioSelectors';
import ResultsTable from '../results/ResultsTable';

function MainContent() {
  return (
    <div className="main-content">
      <ResultsHeader />
      <ScenarioSelectors />
      <ResultsTable />
    </div>
  );
}

export default MainContent;
