const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
const archiver = require('archiver');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: '*' }));

const activeWatchers = new Map();

function setupFileWatcher(projectName) {
  const projectPath = path.join(__dirname, 'projects', projectName);
  let watcher;

  try {
    watcher = fs.watch(projectPath, { recursive: true }, (eventType, filename) => {
      if (filename) {
        const filePath = path.join(projectPath, filename);
        console.log(`File ${filename} has been ${eventType}`);

        if (eventType === 'change') {
          fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) {
              console.error(`Error reading file ${filename}:`, err);
              return;
            }
            io.emit('fileUpdated', { projectName, filename, content });
          });
        }
      }
    });

    watcher.on('error', (error) => {
      console.error(`Watcher error for project ${projectName}:`, error);
    });

    console.log(`File watcher set up for project: ${projectName}`);
  } catch (error) {
    console.error(`Error setting up file watcher for ${projectName}:`, error);
  }

  return {
    close: () => {
      if (watcher) {
        watcher.close();
        console.log(`File watcher closed for project: ${projectName}`);
      }
    }
  };
}

app.get('/project-files/:projectName/:type', async (req, res) => {
  const { projectName, type } = req.params;

  if (!['client', 'server'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type parameter' });
  }

  const basePath = path.join(__dirname, 'projects', projectName, type);

  try {
    const fileContents = {};

    const readFiles = async (dirPath, relativePath = '') => {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        const entryRelativePath = path.join(relativePath, entry.name);
        if (entry.isDirectory()) {
          await readFiles(entryPath, entryRelativePath);
        } else {
          const content = await fs.promises.readFile(entryPath, 'utf-8');
          fileContents[entryRelativePath] = content;
        }
      }
    };

    await readFiles(basePath);

    res.json(fileContents);
  } catch (err) {
    console.error(`Error fetching ${type} files for project ${projectName}:`, err);
    res.status(500).json({ error: `Failed to load ${type} files` });
  }
});

app.post('/save-file', async (req, res) => {
  const { projectName, filePath, content } = req.body;

  if (!projectName || !filePath) {
    return res.status(400).send('Project name and file path are required');
  }
  
  const absoluteFilePath = path.join(__dirname, 'projects', projectName, filePath);
  
  const dir = path.dirname(absoluteFilePath);
  try {
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(absoluteFilePath, content, 'utf-8');
    console.log(`Saved ${filePath} for project ${projectName}`);
    res.status(200).send('File saved successfully');
  } catch (err) {
    console.error(`Error saving file ${filePath}:`, err);
    res.status(500).send('Failed to save file');
  }
});

app.post('/create-folder', async (req, res) => {
  const { projectName, mongoUri } = req.body;
  if (!projectName || projectName.trim() === '') {
    return res.status(400).send('Project name is required');
  }

  if (!mongoUri || !mongoUri.startsWith('mongodb')) {
    return res.status(400).send('Valid MongoDB connection string is required');
  }

  const projectPath = path.join(__dirname, 'projects', projectName);
  const clientPath = path.join(projectPath, 'client');
  const serverPath = path.join(projectPath, 'server');

  try {
    // Create project folders
    await fs.promises.mkdir(projectPath, { recursive: true });
    await fs.promises.mkdir(clientPath, { recursive: true });
    await fs.promises.mkdir(serverPath, { recursive: true });
    await fs.promises.mkdir(path.join(serverPath, 'controllers'), { recursive: true });
    await fs.promises.mkdir(path.join(serverPath, 'routes'), { recursive: true });
    await fs.promises.mkdir(path.join(serverPath, 'models'), { recursive: true });

    // Create client files
    const clientFiles = [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="style.css">
<title>${projectName}</title>
</head>
<body>
<h1>Welcome to ${projectName}</h1>
</body>
<script src="script.js"></script>
</html>`
      },
      {
        name: 'style.css',
        content: `/* ${projectName} Styles */
body {
    margin: 0;
    font-family: Arial, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f0f0;
}
h1 {
    color: #333;
    text-align: center;
}`
      },
      {
        name: 'script.js',
        content: `// ${projectName} JavaScript
console.log('Welcome to ${projectName}!');`
      }
    ];

    for (const file of clientFiles) {
      await fs.promises.writeFile(path.join(clientPath, file.name), file.content);
    }

    // Create server files
    const serverFiles = [
      {
        name: 'server.js',
        content: `
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

mongoose.connect('${mongoUri}', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api', routes);

// Catch-all route to serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
  console.log(\`Server is running on http://localhost:\${PORT}\`);
});`
      },
      {
        name: 'package.json',
        content: JSON.stringify({
          name: projectName,
          version: "1.0.0",
          main: "server.js",
          scripts: {
            "start": "node server.js",
            "dev": "nodemon server.js"
          },
          dependencies: {
            express: "^4.17.1",
            cors: "^2.8.5",
            mongoose: "^6.0.0",
          },
          devDependencies: {
            "nodemon": "^2.0.7"
          }
        }, null, 2)
      },
      {
        name: 'routes/routes.js',
        content: `
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

router.get('/items', itemController.getAllItems);
router.post('/items', itemController.createItem);
router.get('/items/:id', itemController.getItemById);
router.put('/items/:id', itemController.updateItem);
router.delete('/items/:id', itemController.deleteItem);

module.exports = router;`
      },
      {
        name: 'controllers/itemController.js',
        content: `
const Item = require('../models/item');

exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createItem = async (req, res) => {
  const item = new Item({
    name: req.body.name,
    description: req.body.description
  });

  try {
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (item == null) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};`
      },
      {
        name: 'models/item.js',
        content: `
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Item', itemSchema);`
      }
    ];

    for (const file of serverFiles) {
      await fs.promises.writeFile(path.join(serverPath, file.name), file.content);
    }

    // Set up file watcher for the new project
    const watcher = setupFileWatcher(projectName);
    activeWatchers.set(projectName, watcher);

    // Install server dependencies
    console.log('Installing server dependencies...');
    const npmInstallProcess = exec('npm install', { cwd: serverPath });

    npmInstallProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    npmInstallProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    npmInstallProcess.on('close', (code) => {
      console.log(`npm install process exited with code ${code}`);
      if (code === 0) {
        res.status(200).json({ message: 'Project created successfully with server dependencies installed and file watcher set up' });
      } else {
        res.status(500).json({ error: 'Failed to install server dependencies', code });
      }
    });

  } catch (error) {
    console.error('Error during project setup:', error);
    res.status(500).json({ error: 'Failed to set up project', details: error.message });
  }
});

app.get('/download-project/:projectName', (req, res) => {
  const { projectName } = req.params;
  const folderPath = path.join(__dirname, 'projects', projectName);

  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  archive.on('error', (err) => {
    throw err;
  });

  res.attachment(`${projectName}.zip`);

  archive.pipe(res);

  archive.directory(folderPath, false);
  archive.finalize();
});

app.post('/stop-watching', (req, res) => {
  const { projectName } = req.body;
  const watcher = activeWatchers.get(projectName);
  if (watcher) {
    watcher.close();
    activeWatchers.delete(projectName);
    res.status(200).json({ message: `Stopped watching project: ${projectName}` });
  } else {
    res.status(404).json({ error: `No active watcher for project: ${projectName}` });
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});