import React from 'react';
import AccessControl from './AccessControl';
import LoanDashboard from './LoanDashboard';

function App() {
  return (
    <AccessControl>
      <LoanDashboard />
    </AccessControl>
  );
}

export default App;