import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';  // Path to your HomePage component
import Frontpage from './Front';  // Frontpage component
import ReadBooks from './ReadBooks';
import Login from './Login';
import SignUp from './SignUp';
import ProtectedRoute from './auth/ProtectedRoute';
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Frontpage />} />
        <Route path="/ReadBooks" element={<ReadBooks/>}/>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
