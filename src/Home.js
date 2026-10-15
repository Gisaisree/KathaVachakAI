import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';  // Custom CSS for styling
import { getApiBaseUrl } from './config';
import authFetch, { SessionExpiredError, parseJsonSafe } from './auth/authFetch';

const MIN_WORDS = 100;
const MAX_WORDS = 10000;

const Home = () => {
  const navigate = useNavigate();
  const [storyPrompt, setStoryPrompt] = useState('');
  const [wordCount, setWordCount] = useState('');
  const [genre, setGenre] = useState('');
  const [generatedStory, setGeneratedStory] = useState('');  // State for storing the generated story
  const [audioUrl, setAudioUrl] = useState(null); // State for storing audio URL
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReadoutLoading, setIsReadoutLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generateError, setGenerateError] = useState(null);
  const [readoutError, setReadoutError] = useState(null);

  const isBusy = isGenerating || isReadoutLoading;
  const baseUrl = getApiBaseUrl();

  const validate = () => {
    const errors = {};
    if (!storyPrompt.trim()) errors.prompt = 'Prompt is required.';
    if (!genre) errors.genre = 'Please select a genre.';
    const words = Number(wordCount);
    if (!wordCount || !Number.isInteger(words) || words < MIN_WORDS || words > MAX_WORDS) {
      errors.wordCount = `Length must be between ${MIN_WORDS} and ${MAX_WORDS} words.`;
    }
    return errors;
  };

  const handleSessionExpired = () => {
    navigate('/login', {
      replace: true,
      state: { message: 'Session expired. Please log in again.' },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (isBusy) return;

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Format the input data according to your specified format
    const inputData = `Generate a ${genre} story about ${storyPrompt.trim()} in ${wordCount} words. Only output the story and don't include instructions.`;

    setIsGenerating(true);
    setGenerateError(null);
    setReadoutError(null);
    try {
      const response = await authFetch(`${baseUrl}/api/story/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: inputData }), // Send formatted input
      });

      const data = await parseJsonSafe(response);
      if (!response.ok || !data || typeof data.story !== 'string' || !data.story) {
        throw new Error("Story generation failed");
      }

      setGeneratedStory(data.story);  // Set the generated story
      setAudioUrl(null); // Any previous audio belongs to the previous story
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        handleSessionExpired();
        return;
      }
      console.error("Error:", error);
      setGenerateError('Story generation failed. Check configuration or try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const playStoryReadout = async () => {
    if (!generatedStory || isBusy) return;

    setIsReadoutLoading(true);
    setReadoutError(null);
    try {
      const response = await authFetch(`${baseUrl}/api/story/readout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: generatedStory }), // Send generated story
      });

      const data = await parseJsonSafe(response);
      if (!response.ok || !data || typeof data.audioUrl !== 'string' || !data.audioUrl) {
        throw new Error("Readout failed");
      }

      setAudioUrl(data.audioUrl);  // Set the audio URL from the response
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        handleSessionExpired();
        return;
      }
      console.error("Error:", error);
      // The story stays visible so the user can still read it.
      setReadoutError('Audio generation failed. You can still read the story.');
    } finally {
      setIsReadoutLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="header">
        <h1>Katha-Vaachak</h1>
      </div>

      <div className="bottom-section">
        {!baseUrl && (
          <div className="status-banner error-banner" role="alert">
            <strong>Configuration needed</strong>
            <p>Story service is not configured. Set REACT_APP_API_BASE_URL.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-container" noValidate>
          <textarea
            className="story-input"
            value={storyPrompt}
            onChange={(e) => setStoryPrompt(e.target.value)}
            placeholder="Enter your story prompt here..."
            aria-label="Story prompt"
            disabled={isGenerating}
          />
          {fieldErrors.prompt && <p className="field-error" role="alert">{fieldErrors.prompt}</p>}

          <div className="input-group">
            <label htmlFor="genre" id="generelabel">Genre</label>
            <select
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="dropdown"
              disabled={isGenerating}
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
          {fieldErrors.genre && <p className="field-error" role="alert">{fieldErrors.genre}</p>}

          <div className="input-group">
            <label htmlFor="wordCount" id="lengthlabel">Length</label>
            <input
              type="number"
              id="wordCount"
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
              placeholder="Word Count"
              min={MIN_WORDS}
              max={MAX_WORDS}
              className="word-input"
              disabled={isGenerating}
            />
          </div>
          {fieldErrors.wordCount && <p className="field-error" role="alert">{fieldErrors.wordCount}</p>}

          <div className="button-group">
            <button type="submit" className="submit-btn" disabled={isBusy || !baseUrl}>
              {isGenerating ? 'Generating…' : 'Generate Story'}
            </button>
            <button
              type="button"
              className="play-readout-btn"
              onClick={playStoryReadout}
              disabled={!generatedStory || isBusy || !baseUrl}
            >
              {isReadoutLoading ? 'Creating audio…' : 'Play Readout'}
            </button>
          </div>

          <div aria-live="polite">
            {isGenerating && <p className="status-text">Generating story… please wait</p>}
            {isReadoutLoading && <p className="status-text">Creating audio…</p>}
            {generateError && <p className="status-banner error-banner" role="alert">{generateError}</p>}
            {readoutError && <p className="status-banner error-banner" role="alert">{readoutError}</p>}
          </div>

          {generatedStory && (
            <section className="story-panel" aria-label="Generated story">
              <h2>Generated Story</h2>
              <div className="story-text" data-testid="story-text">{generatedStory}</div>
            </section>
          )}

          {audioUrl && (
            <div className="audio-player">
              <audio controls src={audioUrl}>
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
