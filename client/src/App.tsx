/**
 * Root application component for the Dialect Digital Tableau.
 * Renders the main shell with brand theming. Will be extended with
 * phase-based routing in Feature #4 (Player Lobby).
 */
const App = () => {
  return (
    <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-heading font-bold text-orange mb-4">
          Dialect
        </h1>
        <p className="text-storm-300 text-lg">Digital Tableau — Loading...</p>
      </div>
    </div>
  );
};

export default App;
