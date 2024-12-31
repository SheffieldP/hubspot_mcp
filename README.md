# HubSpot MCP Server

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

### Prompts

The server provides a demonstration prompt:

* `hubspot-demo`: Interactive prompt for HubSpot operations
  * Required arguments:
    * `operation` - The type of operation to perform (e.g., "create", "get")
    * `object_type` - The type of object to operate on (e.g., "contact", "company")
  * Guides users through HubSpot operations

## Setup

### Prerequisites

You'll need a HubSpot access token. You can obtain this by:
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
     - tickets
     - crm.objects.contacts.write
     - crm.objects.contacts.sensitive.read
     - crm.objects.companies.sensitive.read
     - sales-email-read
     - crm.objects.deals.sensitive.read
     - crm.objects.companies.write
     - crm.objects.companies.read
     - crm.objects.deals.read
     - crm.objects.deals.write
     - crm.objects.contacts.read
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
  -e HUBSPOT_ACCESS_TOKEN=your_access_token_here \
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
        "-e",
        "HUBSPOT_ACCESS_TOKEN=your_access_token_here",
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
