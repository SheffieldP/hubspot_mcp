# HubSpot MCP Server
[![Docker Hub](https://img.shields.io/docker/v/buryhuang/mcp-hubspot?label=Docker%20Hub)](https://hub.docker.com/r/buryhuang/mcp-hubspot) [![smithery badge](https://smithery.ai/badge/mcp-hubspot)](https://smithery.ai/server/mcp-hubspot/prod)

## Overview

A Model Context Protocol (MCP) server implementation that provides integration with HubSpot CRM. This server enables AI models to interact with HubSpot data and operations through a standardized interface.

For more information about the Model Context Protocol and how it works, see [Anthropic's MCP documentation](https://www.anthropic.com/news/model-context-protocol).

<a href="https://glama.ai/mcp/servers/vpoifk4jai"><img width="380" height="200" src="https://glama.ai/mcp/servers/vpoifk4jai/badge" alt="HubSpot Server MCP server" /></a>

## Components

### Resources

The server exposes the following resources:

* `hubspot://hubspot_contacts`: A dynamic resource that provides access to HubSpot contacts
* `hubspot://hubspot_companies`: A dynamic resource that provides access to HubSpot companies
* `hubspot://hubspot_recent_engagements`: A dynamic resource that provides access to HubSpot engagements from the last 3 days

All resources auto-update as their respective objects are modified in HubSpot.

### Example Prompts

- Create Hubspot contacts by copying from LinkedIn profile webpage: 
    ```
    Create HubSpot contacts and companies from following:

    John Doe
    Software Engineer at Tech Corp
    San Francisco Bay Area • 500+ connections
    
    Experience
    Tech Corp
    Software Engineer
    Jan 2020 - Present · 4 yrs
    San Francisco, California
    
    Previous Company Inc.
    Senior Developer
    2018 - 2020 · 2 yrs
    
    Education
    University of California, Berkeley
    Computer Science, BS
    2014 - 2018
    ```

- Get latest activities for your company:
    ```
    What's happening latestly with my pipeline?
    ```



### Tools

The server offers several tools for managing HubSpot objects:

#### Contact Management Tools
* `hubspot_get_contacts`
  * Retrieve contacts from HubSpot
  * No input required
  * Returns: Array of contact objects

* `hubspot_create_contact`
  * Create a new contact in HubSpot (checks for duplicates before creation)
  * Input:
    * `firstname` (string): Contact's first name
    * `lastname` (string): Contact's last name
    * `email` (string, optional): Contact's email address
    * `properties` (dict, optional): Additional contact properties
      * Example: `{"phone": "123456789", "company": "HubSpot"}`
  * Behavior:
    * Checks for existing contacts with the same first name and last name
    * If `company` is provided in properties, also checks for matches with the same company
    * Returns existing contact details if a match is found
    * Creates new contact only if no match is found

#### Company Management Tools
* `hubspot_get_companies`
  * Retrieve companies from HubSpot
  * No input required
  * Returns: Array of company objects

* `hubspot_create_company`
  * Create a new company in HubSpot (checks for duplicates before creation)
  * Input:
    * `name` (string): Company name
    * `properties` (dict, optional): Additional company properties
      * Example: `{"domain": "example.com", "industry": "Technology"}`
  * Behavior:
    * Checks for existing companies with the same name
    * Returns existing company details if a match is found
    * Creates new company only if no match is found

* `hubspot_get_company_activity`
  * Get activity history for a specific company
  * Input:
    * `company_id` (string): HubSpot company ID
  * Returns: Array of activity objects

#### Engagement Tools
* `hubspot_get_recent_engagements`
  * Get HubSpot engagements from all companies and contacts from the last 3 days
  * No input required
  * Returns: Array of engagement objects with full metadata


## Multi-User Support

This MCP server is designed to work with multiple HubSpot users, each with their own access token. The server does not use a global environment variable for the access token.

Instead, each request to the MCP server should include the user's specific access token in one of the following ways:

1. In the request header: `X-HubSpot-Access-Token: your-token-here`
2. In the request body as `accessToken`: `{"accessToken": "your-token-here"}`
3. In the request body as `hubspotAccessToken`: `{"hubspotAccessToken": "your-token-here"}`

This design allows you to store user tokens in your own backend (e.g., Supabase) and pass them along with each request.

### Example Multi-User Integration

```javascript
// Example of how to use this MCP server in a multi-user setup
async function makeHubSpotRequest(userId, action, params) {
  // Retrieve the user's HubSpot token from your database
  const userToken = await getUserHubSpotToken(userId); 

  // Make request to MCP server with the user's token
  const response = await fetch('https://your-mcp-server.vercel.app/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-HubSpot-Access-Token': userToken
    },
    body: JSON.stringify({
      action,
      ...params
    })
  });
  
  return await response.json();
}
```

## Setup

### Prerequisites

You'll need a HubSpot access token for each user. You can obtain this by:
1. Creating a private app in your HubSpot account:
   Follow the [HubSpot Private Apps Guide](https://developers.hubspot.com/docs/guides/apps/private-apps/overview)
   - Go to your HubSpot account settings
   - Navigate to Integrations > Private Apps
   - Click "Create private app"
   - Fill in the basic information:
     - Name your app
     - Add description
     - Upload logo (optional)
   - Define required scopes:
     - oauth (required)
     
   - Optional scopes:
     - crm.dealsplits.read_write
     - crm.objects.companies.read
     - crm.objects.companies.write
     - crm.objects.contacts.read
     - crm.objects.contacts.write
     - crm.objects.deals.read
   - Review and create the app
   - Copy the generated access token

Note: Keep your access token secure and never commit it to version control.

### Docker Installation

You can either build the image locally or pull it from Docker Hub. The image is built for the Linux platform.

#### Supported Platforms
- Linux/amd64
- Linux/arm64
- Linux/arm/v7

#### Option 1: Pull from Docker Hub
```bash
docker pull buryhuang/mcp-hubspot:latest
```

#### Option 2: Build Locally
```bash
docker build -t mcp-hubspot .
```

Run the container:
```bash
docker run \
  buryhuang/mcp-hubspot:latest
```

## Cross-Platform Publishing

To publish the Docker image for multiple platforms, you can use the `docker buildx` command. Follow these steps:

1. **Create a new builder instance** (if you haven't already):
   ```bash
   docker buildx create --use
   ```

2. **Build and push the image for multiple platforms**:
   ```bash
   docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t buryhuang/mcp-hubspot:latest --push .
   ```

3. **Verify the image is available for the specified platforms**:
   ```bash
   docker buildx imagetools inspect buryhuang/mcp-hubspot:latest
   ```


## Usage with Claude Desktop

### Installing via Smithery

To install mcp-hubspot for Claude Desktop automatically via [Smithery](https://smithery.ai/server/mcp-hubspot/prod):

```bash
npx -y @smithery/cli@latest install mcp-hubspot --client claude
```

### Docker Usage
```json
{
  "mcpServers": {
    "hubspot": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "buryhuang/mcp-hubspot:latest"
      ]
    }
  }
}
```

## Development

To set up the development environment:

```bash
pip install -e .
```

## License

This project is licensed under the MIT License. 
