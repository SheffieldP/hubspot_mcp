const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-HubSpot-Access-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Handle MCP protocol messages
const handleMcpRequest = async (req, res) => {
  const body = req.body;
  console.log('Received MCP request:', JSON.stringify(body));
  
  // Extract access token
  const accessToken = req.headers['x-hubspot-access-token'] || body.accessToken || body.hubspotAccessToken;
  
  if (!accessToken) {
    return res.status(400).json({
      error: 'Missing access token',
      message: 'HubSpot access token must be provided in either the X-HubSpot-Access-Token header or in the request body'
    });
  }
  
  // Basic MCP initialization response
  if (body.mcp === true || body.action === 'initialize') {
    return res.status(200).json({
      mcp: true,
      version: '1.0.0',
      name: 'HubSpot MCP Server',
      status: 'ready'
    });
  }
  
  try {
    // Get the path to the MCP server script
    const scriptPath = path.join(process.cwd(), 'src', 'mcp_server_hubspot', 'server.py');
    console.log('Script path:', scriptPath);
    console.log('Script exists:', fs.existsSync(scriptPath));

    // Spawn a Python process to run the MCP server
    const pythonProcess = spawn('python', [scriptPath, accessToken]);
    
    let responseData = '';
    let errorData = '';

    // Send the input to the Python process
    pythonProcess.stdin.write(JSON.stringify(body) + '\n');
    pythonProcess.stdin.end();

    // Listen for data from the Python process
    pythonProcess.stdout.on('data', (data) => {
      console.log('Python output:', data.toString());
      responseData += data.toString();
    });

    // Listen for errors
    pythonProcess.stderr.on('data', (data) => {
      console.error('Python error:', data.toString());
      errorData += data.toString();
    });

    // Wait for the process to exit
    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        console.log('Python process exited with code:', code);
        resolve(code);
      });
    });

    if (exitCode !== 0 || errorData) {
      console.error('Error output:', errorData);
      if (exitCode === 127) { // Command not found
        return res.status(500).json({
          error: 'Python execution failed',
          details: 'Python command not found. Please make sure Python is installed.',
          errorOutput: errorData
        });
      }
      return res.status(500).json({
        error: 'Internal server error',
        details: errorData || `Process exited with code ${exitCode}`
      });
    }

    // Try to parse the response as JSON
    try {
      const jsonResponse = JSON.parse(responseData);
      return res.status(200).json(jsonResponse);
    } catch (e) {
      // If we can't parse as JSON, just return the raw output
      console.log('Could not parse Python output as JSON:', e.message);
      return res.status(200).send(responseData || 'No output from Python script');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Test endpoint
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Debug endpoint
app.get('/debug', async (req, res) => {
  const pythonInfo = {};
  
  try {
    const pythonVersionCmd = spawn('python', ['--version']);
    let pythonVersion = '';
    
    pythonVersionCmd.stdout.on('data', (data) => {
      pythonVersion += data.toString();
    });
    
    await new Promise((resolve) => {
      pythonVersionCmd.on('close', (code) => {
        pythonInfo.versionExitCode = code;
        pythonInfo.version = pythonVersion.trim();
        resolve();
      });
    });
  } catch (e) {
    pythonInfo.error = e.message;
  }
  
  res.status(200).json({
    nodeVersion: process.version,
    cwd: process.cwd(),
    pythonInfo,
    serverPath: path.join(process.cwd(), 'src', 'mcp_server_hubspot', 'server.py'),
    serverExists: fs.existsSync(path.join(process.cwd(), 'src', 'mcp_server_hubspot', 'server.py')),
    env: process.env.NODE_ENV || 'development'
  });
});

// Debug Python environment endpoint
app.get('/debug-python', async (req, res) => {
  try {
    // Get the path to the debug script
    const scriptPath = path.join(process.cwd(), 'src', 'mcp_server_hubspot', 'debug.py');
    console.log('Debug script path:', scriptPath);
    console.log('Debug script exists:', fs.existsSync(scriptPath));

    // Spawn a Python process to run the debug script
    const pythonProcess = spawn('python', [scriptPath]);
    
    let responseData = '';
    let errorData = '';

    // Listen for data from the Python process
    pythonProcess.stdout.on('data', (data) => {
      console.log('Python debug output:', data.toString());
      responseData += data.toString();
    });

    // Listen for errors
    pythonProcess.stderr.on('data', (data) => {
      console.error('Python debug error:', data.toString());
      errorData += data.toString();
    });

    // Wait for the process to exit
    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        console.log('Python debug process exited with code:', code);
        resolve(code);
      });
    });

    res.status(200).json({
      pythonOutput: responseData,
      pythonError: errorData,
      exitCode
    });
  } catch (error) {
    console.error('Error in debug-python endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Echo endpoint for debugging
app.post('/echo', (req, res) => {
  const accessToken = req.headers['x-hubspot-access-token'] || req.body.accessToken || req.body.hubspotAccessToken;
  res.status(200).json({
    receivedBody: req.body,
    receivedToken: accessToken ? '[PRESENT]' : '[MISSING]'
  });
});

// Main MCP endpoint
app.post('/', handleMcpRequest);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
