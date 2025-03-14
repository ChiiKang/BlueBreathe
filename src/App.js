import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import EducationalInsights from './pages/EducationalInsights';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<EducationalInsights />} />
      </Routes>
    </div>
  );
}

export default App;