import ResultsHeader from '../results/ResultsHeader';
import ScenarioSelectors from '../results/ScenarioSelectors';
import ResultsTable from '../results/ResultsTable';

function MainContent() {
  return (
    <div>
      <ResultsHeader />
      <ScenarioSelectors />
      <ResultsTable />
    </div>
  );
}

export default MainContent;
