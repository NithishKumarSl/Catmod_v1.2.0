import React, { useState } from 'react';
import axios from 'axios';

const ProjectName = ({ onSubmit }) => {
  const [projectName, setProjectName] = useState('');
  const [mongoUri, setMongoUri] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateProjectName = (name) => {
    return name.trim().length >= 3;
  };

  const validateMongoUri = (uri) => {
    return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validateProjectName(projectName)) {
      setError('Project name must be at least 3 characters long.');
      setIsLoading(false);
      return;
    }

    if (!validateMongoUri(mongoUri)) {
      setError('Please enter a valid MongoDB connection string.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/create-folder', {
        projectName,
        mongoUri
      }, {
        timeout: 60000 // 1min timeout
      });

      if (response.status === 200) {
        alert(`Project "${projectName}" created successfully!`);
        onSubmit(projectName);
      } else {
        setError('Failed to create project. Please try again.');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.response) {
        setError(`Error: ${error.response.data.error || error.response.data}`);
      } else if (error.request) {
        setError('No response from server. Please check your connection and server status.');
      } else {
        setError(`Failed to create project: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="projectName">
        <h1>Welcome to Your New Project</h1>
        <p>
          To get started, please provide a unique name for your project and your MongoDB connection string.
          This name will represent your vision and goals. Choose wisely, as it will be the first impression of your project!
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="projectName">Enter Project Name</label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            placeholder="e.g., My pawsome project"
          />
          <label htmlFor="mongoUri">Enter MongoDB Connection String</label>
          <input
            id="mongoUri"
            type="text"
            value={mongoUri}
            onChange={(e) => setMongoUri(e.target.value)}
            required
            placeholder="e.g., mongodb://username:password@host:port/database"
          />
          <button type="submit" disabled={isLoading}>Start Project</button>
          {isLoading && <p className="loading">Creating project...</p>}
          {error && <p className="error">{error}</p>}
        </form>
        <div className="footer">
          <p>
            Need assistance? <a href="#support">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectName;