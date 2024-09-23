import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import Editor from './Editor';
import useLocalStorage from '../hooks/useLocalStorage';
import Header from './Header';
import ProjectName from './projectName';
import Loader from './Loader';
import '../../src/index.css';
import axios from 'axios';
import { debounce } from 'lodash';

const GEMINI_API_KEY = 'AIzaSyAqap2NWQ_ZHco018rf-1-9nbrOoOuRCkE';
const SERVER_URL = 'http://localhost:5000';

function App() {
  const [projectName, setProjectName] = useState('');
  const [html, setHtml] = useLocalStorage('html', '');
  const [css, setCss] = useLocalStorage('css', '');
  const [js, setJs] = useLocalStorage('js', '');
  const [models, setModels] = useState('');
  const [controllers, setControllers] = useState('');
  const [routes, setRoutes] = useState('');
  const [srcDoc, setSrcDoc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const socket = io(SERVER_URL);

    socket.on('fileUpdated', ({ projectName: updatedProject, filename, content }) => {
      if (updatedProject === projectName) {
        updateFileContent(filename, content);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [projectName]);

  const updateFileContent = (filename, content) => {
    switch (filename) {
      case 'client/index.html':
        setHtml(content);
        break;
      case 'client/style.css':
        setCss(content);
        break;
      case 'client/script.js':
        setJs(content);
        break;
      case 'server/models/item.js':
        setModels(content);
        break;
      case 'server/controllers/itemController.js':
        setControllers(content);
        break;
      case 'server/routes/routes.js':
        setRoutes(content);
        break;
      default:
        console.log(`Unhandled file update: ${filename}`);
    }
  };

  const saveFile = async (fileName, content) => {
    try {
      await axios.post(`${SERVER_URL}/save-file`, { projectName, filePath: fileName, content });
      console.log(`${fileName} saved successfully`);
    } catch (error) {
      console.error(`Error saving ${fileName}:`, error);
      setError(`Failed to save ${fileName}. Please try again.`);
    }
  };

  const debouncedSaveHtml = useCallback(debounce((content) => saveFile('client/index.html', content), 1000), [projectName]);
  const debouncedSaveCss = useCallback(debounce((content) => saveFile('client/style.css', content), 1000), [projectName]);
  const debouncedSaveJs = useCallback(debounce((content) => saveFile('client/script.js', content), 1000), [projectName]);
  const debouncedSaveModelJs = useCallback(debounce((content) => saveFile('server/models/item.js', content), 1000), [projectName]);
  const debouncedSaveControllersJs = useCallback(debounce((content) => saveFile('server/controllers/itemController.js', content), 1000), [projectName]);
  const debouncedSaveRoutesJs = useCallback(debounce((content) => saveFile('server/routes/routes.js', content), 1000), [projectName]);

  useEffect(() => {
    if (projectName) {
      debouncedSaveHtml(html);
    }
  }, [html, projectName, debouncedSaveHtml]);

  useEffect(() => {
    if (projectName) {
      debouncedSaveCss(css);
    }
  }, [css, projectName, debouncedSaveCss]);

  useEffect(() => {
    if (projectName) {
      debouncedSaveJs(js);
    }
  }, [js, projectName, debouncedSaveJs]);

  useEffect(() => {
    if (projectName) {
      debouncedSaveModelJs(models);
    }
  }, [models, projectName, debouncedSaveModelJs]);

  useEffect(() => {
    if (projectName) {
      debouncedSaveControllersJs(controllers);
    }
  }, [controllers, projectName, debouncedSaveControllersJs]);

  useEffect(() => {
    if (projectName) {
      debouncedSaveRoutesJs(routes);
    }
  }, [routes, projectName, debouncedSaveRoutesJs]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSrcDoc(`
        <html>
          <body>${html}</body>
          <style>${css}</style>
          <script>${js}</script>
        </html>
      `);
    }, 250);

    return () => clearTimeout(timeout);
  }, [html, css, js]);

  const handlePreview = () => {
    const previewWindow = window.open();
    previewWindow.document.write(`
      <html>
        <body>${html}</body>
        <style>${css}</style>
        <script>${js}</script>
      </html>
    `);
    previewWindow.document.close();
  };

  const fetchProjectFiles = async (projectName) => {
    try {
      const clientResponse = await axios.get(`${SERVER_URL}/project-files/${projectName}/client`);
      const clientFiles = clientResponse.data;
  
      setHtml(clientFiles['index.html'] || '');
      setCss(clientFiles['style.css'] || '');
      setJs(clientFiles['script.js'] || '');

      const serverResponse = await axios.get(`${SERVER_URL}/project-files/${projectName}/server`);
      const serverFiles = serverResponse.data;

      setModels(serverFiles['models/item.js'] || '');
      setControllers(serverFiles['controllers/itemController.js'] || '');
      setRoutes(serverFiles['routes/routes.js'] || '');

    } catch (error) {
      console.error('Error fetching project files:', error);
      setError('Failed to load project files. Please try again.');
    }
  };

  const generateCode = async (prompt) => {
    setIsLoading(true);
    setError('');
  
    try {
      const enhancedPrompt = `Generate a modern, responsive, and professional website using separate HTML5, CSS3 with Tailwind, and JavaScript for the following prompt: "${prompt}". Ensure the generated code is structured, fully functional, and visually appealing. Follow the detailed instructions below for each component:
  
  Frontend Instructions:
  1. HTML:
     - Use semantic HTML5 elements (header, nav, main, section, article, aside, footer) appropriately.
     - Include a responsive navigation menu.
     - Implement a logical content structure with a clear hierarchy.
     - Add appropriate Bootstrap 5 classes for layout and components.
     - Include necessary meta tags, title, and links to CSS and JS files.
     - Ensure the structure accommodates all content requirements from the prompt.
     - Use ARIA attributes where necessary for accessibility.
  
  2. CSS:
     - Create a separate CSS file with a professional, modern design.
     - Implement a cohesive color scheme using CSS variables.
     - Utilize Flexbox and/or CSS Grid for layouts.
     - Incorporate responsive design principles, including a mobile-first approach.
     - Use Tailwind-inspired utility classes for common styling patterns.
     - Implement custom animations and transitions for interactive elements.
     - Ensure typography is clear and readable across devices.
     - Override and extend Bootstrap styles to create a unique look.
     - Use media queries to fine-tune responsiveness.
     - Optimize for performance by minimizing redundant styles.
  
  3. JavaScript:
     - Create a separate JavaScript file.
     - Implement form validation for all input fields.
     - Add event listeners for user interactions (clicks, hovers, submits).
     - Create functions to handle any required data processing.
     - Implement DOM manipulation for dynamic content updates.
     - Ensure smooth animations and transitions where applicable.
     - Add error handling and user feedback mechanisms.
     - Implement any specific functionality mentioned in the prompt.
     - Use modern ES6+ syntax and best practices.
     - Ensure the script is non-blocking and optimized for performance.
  
  Backend Instructions (MongoDB Integration):
  1. Models:
     - Define MongoDB models with Mongoose based on the specific requirements from the prompt.
     - Ensure that each model includes appropriate schema validations, references, and relationships.
     - Create model methods for complex queries if necessary.
     
  2. Controllers:
     - Write controllers to handle CRUD operations based on the MongoDB models.
     - Implement logic for processing data, including data validation, filtering, and pagination.
     - Add error handling and return appropriate responses for success and failure scenarios.
  
  3. Routes:
     - Define Express.js routes to handle incoming HTTP requests and connect them to the appropriate controllers.
     - Ensure that routes are well-structured and follow RESTful principles.
     - Use route middlewares for authentication, authorization, and any other necessary middleware functions.
  
  General Guidelines:
  - Ensure all code is valid, well-formatted, and follows best practices.
  - Implement responsive design principles throughout all components.
  - Optimize for accessibility and performance.
  - Use comments to explain complex code sections.
  - Ensure cross-browser compatibility.
  - Implement error handling and graceful degradation.
  
  Output Format:
  - Generate the following outputs:
    - HTML, CSS, and JavaScript Code
    - MongoDB Models
    - Controllers
    - Routes
   
  Output format:
  ---HTML---
  [Your generated HTML code here]
  ---CSS---
  [Your generated CSS code here]
  ---JavaScript---
  [Your generated JavaScript code here]
  ---Models---
  [Your generated MongoDB models here]
  ---Controllers---
  [Your generated controllers here]
  ---Routes---
  [Your generated routes here]
  ---END---`;
  
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
  
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancedPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 99999999,
          }
        })
      });
  
     
      console.log(response)

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(generatedText)
      
      const htmlMatch = generatedText.match(/---HTML---([\s\S]*?)---CSS---/);
      const cssMatch = generatedText.match(/---CSS---([\s\S]*?)---JavaScript---/);
      const jsMatch = generatedText.match(/---JavaScript---([\s\S]*?)---END---/);
      const modelMatch = generatedText.match(/---Models---([\s\S]*?)---Controllers---/);
      const controllerMatch = generatedText.match(/---Controllers([\s\S]*?)---Routes---/);
      const routesMatch = generatedText.match(/---Routes---([\s\S]*?)---END---/);

      if (htmlMatch) {
        setHtml(htmlMatch[1].trim());
        console.log(htmlMatch[1].trim())
      } 
      if (cssMatch) { 
        setCss(cssMatch[1].trim());  
        console.log(cssMatch[1].trim())
      }
      if (jsMatch) { 
        setJs(jsMatch[1].trim()); 
        console.log(jsMatch[1].trim())
      }
      
      if (modelMatch) { 
        setModels(modelMatch[1].trim());
        console.log(modelMatch[1].trim())
      }
      if (controllerMatch) { 
        setControllers(controllerMatch[1].trim()); 
        console.log(controllerMatch[1].trim())
      }
      if (routesMatch) { 
        setRoutes(routesMatch[1].trim());
        console.log(routesMatch[1].trim())
      }

    } catch (error) {
      console.error('Error generating code:', error);
      setError('Failed to generate code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!projectName) {
    return <ProjectName onSubmit={async (name) => {
      setProjectName(name);
      await fetchProjectFiles(name);
    }} />;
  }

  return (
    <>
      <Header onPreview={handlePreview} onGenerateCode={generateCode} projectName={projectName} />
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {error && <div className="error-message">{error}</div>}
          <div className="pane top-pane">
            <Editor
              language="xml"
              displayName="HTML"
              value={html}
              onChange={setHtml}
            />
            <Editor
              language="css"
              displayName="CSS"
              value={css}
              onChange={setCss}
            />
            <Editor
              language="javascript"
              displayName="JS"
              value={js}
              onChange={setJs}
            />
          </div>
          <div className="pane">
            <iframe
              srcDoc={srcDoc}
              title="output"
              sandbox="allow-scripts"
              frameBorder="0"
              width="100%"
              height="100%"
            />
          </div>
        </>
      )}
    </>
  );
}

export default App;