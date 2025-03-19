// Vercel serverless function to handle HTTP requests and bridge to MCP server
const { spawn } = require('child_process');
const path = require('path');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

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
      
      // Simple echo for debugging
      if (req.url === '/echo') {
        return res.status(200).json(body);
      }

      // For now, let's return a mock response for debugging
      return res.status(200).json({
        status: 'success',
        message: 'MCP server received request',
        received: body
      });

      /* Commenting out Python execution for now to debug deployment
      // Get the path to the MCP server script
      const scriptPath = path.join(process.cwd(), 'src', 'mcp_server_hubspot', 'server.py');

      // Spawn a Python process to run the MCP server
      const pythonProcess = spawn('python', [scriptPath]);
      
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
