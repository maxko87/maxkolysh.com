import ResultsHeader from '../results/ResultsHeader';
import ScenarioSelectors from '../results/ScenarioSelectors';
import ResultsTable from '../results/ResultsTable';

function MainContent() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <ResultsHeader />
      <ScenarioSelectors />
      <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
        <ResultsTable />
      </div>
    </div>
  );
}

export default MainContent;
