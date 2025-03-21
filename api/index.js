// API handler for both Vercel serverless and Replit
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Detect if running on Vercel or Replit
const isVercel = process.env.VERCEL === '1';

// Express middleware style handler for Replit
const handleRequest = async (req, res) => {
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
  if (req.method === 'GET' && (req.url === '/health' || req.path === '/health')) {
    return res.status(200).json({ status: 'ok' });
  }

  // Test endpoint
  if (req.method === 'GET' && (req.url === '/ping' || req.path === '/ping')) {
    return res.status(200).send('pong');
  }

  // Debug endpoint
  if (req.method === 'GET' && (req.url === '/debug' || req.path === '/debug')) {
    const env = process.env;
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
    
    return res.status(200).json({
      nodeVersion: process.version,
      cwd: process.cwd(),
      environment: isVercel ? 'Vercel' : 'Replit/Other',
      pythonInfo,
      serverPath: path.join(process.cwd(), 'src', 'mcp_server_hubspot', 'server.py'),
      serverExists: fs.existsSync(path.join(process.cwd(), 'src', 'mcp_server_hubspot', 'server.py'))
    });
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
      if (req.url === '/echo' || req.path === '/echo') {
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

      // Use mock data on Vercel, real data elsewhere
      if (isVercel) {
        // Mock responses for Vercel
        if (body.action === 'get_contacts') {
          return res.status(200).json({
            status: 'success',
            message: 'Mock contacts data',
            data: [
              { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
            ]
          });
        } else if (body.action === 'get_companies') {
          return res.status(200).json({
            status: 'success',
            message: 'Mock companies data',
            data: [
              { id: '101', name: 'Acme Corp', domain: 'acme.com' },
              { id: '102', name: 'Globex', domain: 'globex.com' }
            ]
          });
        } else {
          // For any other action, return a generic success response
          return res.status(200).json({
            status: 'success',
            message: `Mock response for action: ${body.action}`,
            tokenValid: true
          });
        }
      } else {
        // Real Python execution (works on Replit but not Vercel)
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
      }
    } catch (error) {
      console.error('Error processing request:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  // If we get here, the method is not supported
  return res.status(405).json({ error: 'Method not allowed' });
};

// Export for both Express and Vercel
module.exports = handleRequest;
