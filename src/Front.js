import React from 'react';
import { Link } from 'react-router-dom';  // Import Link from react-router-dom for navigation
import './Front.css';

const Frontpage = () => {
  return (
    <div className="app-container">
      <h1 className="heading">KathaVaachak</h1>

      {/* Read Books Button to navigate to the ReadBooks page */}
      <div className="read-books-section">
        <Link to="/ReadBooks">
          <button className="read-books-button">
            Read Books
          </button>
        </Link>
      </div>

      {/* Button to go to the model */}
      <div className="bottom-button">
        <Link to="/Home">
          <button className="go-to-model-button">Go to Model</button>
        </Link>
      </div>
    </div>
  );
};

export default Frontpage;
