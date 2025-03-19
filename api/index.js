// Vercel serverless function to handle HTTP requests and bridge to MCP server
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-HubSpot-Access-Token');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    return res.status(200).json({ status: 'ok' });
  }

  // Test endpoint
  if (req.method === 'GET' && req.url === '/ping') {
    return res.status(200).send('pong');
  }

  // Main endpoint for MCP requests
  if (req.method === 'POST') {
    try {
      // Get the request body
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      // Check for access token in header first, then in body
      const accessToken = req.headers['x-hubspot-access-token'] || body.accessToken || body.hubspotAccessToken;
      if (!accessToken) {
        return res.status(400).json({
          error: 'Missing access token',
          message: 'HubSpot access token must be provided in either the X-HubSpot-Access-Token header or in the request body as accessToken or hubspotAccessToken'
        });
      }

      // Simple echo for debugging
      if (req.url === '/echo') {
        return res.status(200).json({
          receivedBody: body,
          receivedToken: accessToken ? '[PRESENT]' : '[MISSING]'
        });
      }

      // Create public directory if it doesn't exist
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // For now, let's return a mock response for debugging
      return res.status(200).json({
        status: 'success',
        message: 'MCP server received request with valid token',
        tokenPresent: !!accessToken
      });

      /* Uncomment when ready to execute Python
      // Get the path to the MCP server script
      const scriptPath = path.join(process.cwd(), 'src', 'mcp_server_hubspot', 'server.py');

      // Spawn a Python process to run the MCP server, passing the access token as an argument
      const pythonProcess = spawn('python', [scriptPath, accessToken]);
      
      // Set up response buffers
      let responseData = '';
      let errorData = '';

      // Send the input to the Python process
      pythonProcess.stdin.write(JSON.stringify(body) + '\n');
      pythonProcess.stdin.end();

      // Listen for data from the Python process
      pythonProcess.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      // Listen for errors
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      // Wait for the process to exit
      await new Promise((resolve) => {
        pythonProcess.on('close', (code) => {
          resolve(code);
        });
      });

      // If there was an error, return it
      if (errorData) {
        console.error('Python error:', errorData);
        return res.status(500).json({ error: 'Internal server error', details: errorData });
      }

      // Try to parse the response as JSON
      try {
        const jsonResponse = JSON.parse(responseData);
        return res.status(200).json(jsonResponse);
      } catch (e) {
        // If the response isn't valid JSON, just return it as text
        return res.status(200).send(responseData);
      }
      */
    } catch (error) {
      console.error('Error processing request:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  // If we get here, the method is not supported
  return res.status(405).json({ error: 'Method not allowed' });
};
