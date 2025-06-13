import React, { useState } from 'react';
import './Home.css';  // Custom CSS for styling

const Home = () => {
  const [storyPrompt, setStoryPrompt] = useState('');
  const [wordCount, setWordCount] = useState('');
  const [genre, setGenre] = useState('');
  const [generatedStory, setGeneratedStory] = useState('');  // State for storing the generated story
  const [audioUrl, setAudioUrl] = useState(null); // State for storing audio URL

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (!storyPrompt || !wordCount || !genre) {
      alert('Please fill out all fields.');
      return;
    }

    // Format the input data according to your specified format
    const inputData = `Generate a ${genre} story about ${storyPrompt} in ${wordCount} words. Only output the story and don't include instructions.`;

    try {
      const response = await fetch("https://2fd9-34-126-156-31.ngrok-free.app/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: inputData }), // Send formatted input
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log(data.story); // Handle the response data as needed
      setGeneratedStory(data.story);  // Set the generated story
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const playStoryReadout = async () => {
    if (!generatedStory) {
      alert('No story has been generated yet.');
      return;
    }

    try {
      const response = await fetch("https://e1d9-34-126-156-31.ngrok-free.app/readout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: generatedStory }), // Send generated story
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);  // Set the audio URL from the response
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="page-container">
      <div className="header">
        <h1>Katha-Vaachak</h1>
      </div>

      <div className="bottom-section">
        <form onSubmit={handleSubmit} className="form-container">
          <textarea
            className="story-input"
            value={storyPrompt}
            onChange={(e) => setStoryPrompt(e.target.value)}
            placeholder="Enter your story prompt here..."
          />

          <div className="input-group">
            <label htmlFor="genre" id="generelabel">Genre</label>
            <select
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="dropdown"
            >
              <option value="">Genre</option>
              <option value="horror">Horror</option>
              <option value="moral">Moral</option>
              <option value="folk-tales">Folk Tales</option>
              <option value="mythology">Mythology</option>
              <option value="fairy-tales">Fairy Tales</option>
              <option value="general">General</option>
              <option value="fantasy">Fantasy</option>
              <option value="adventureous">Adventureous</option>
              <option value="Romantic">Romantic</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="wordCount" id="lengthlabel">Length</label>
            <input
              type="number"
              id="wordCount"
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
              placeholder="Word Count"
              min="100"
              max="10000"
              className="word-input"
            />
          </div>

          <div className="button-group">
            <button type="submit" className="submit-btn">Generate Story</button>
            <button type="button" className="play-readout-btn" onClick={playStoryReadout}>Play Readout</button>
          </div>

          {audioUrl && (
            <div className="audio-player">
              <audio controls>
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Home;
