import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';  // Path to your HomePage component
import Frontpage from './Front';  // Frontpage component
import ReadBooks from './ReadBooks';
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Frontpage />} />
        <Route path="/ReadBooks" element={<ReadBooks/>}/>
        <Route path="/Home" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;