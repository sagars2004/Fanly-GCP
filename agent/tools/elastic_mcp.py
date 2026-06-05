import os
import json
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

class ElasticMCPClient:
    def __init__(self):
        self.elastic_url = os.getenv("ELASTIC_URL")
        self.elastic_api_key = os.getenv("ELASTIC_API_KEY")
        
    def is_configured(self) -> bool:
        return bool(self.elastic_url and self.elastic_api_key)
        
    def get_server_params(self) -> StdioServerParameters:
        # Copy current environment and set ES_HOST and ES_API_KEY for MCP server
        env = os.environ.copy()
        env["ES_HOST"] = self.elastic_url
        env["ES_API_KEY"] = self.elastic_api_key
        
        return StdioServerParameters(
            command="npx",
            args=["-y", "@elastic/mcp-server-elasticsearch"],
            env=env
        )

    async def list_indices(self) -> str:
        """List all indices in the Elasticsearch cluster to see what data tables are available.
        """
        if not self.is_configured():
            return "Elasticsearch is not configured. ELASTIC_URL or ELASTIC_API_KEY is missing."
            
        print("[ElasticMCP] Executing tool: list_indices")
        server_params = self.get_server_params()
        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool("list_indices")
                    # Extract text content from result
                    if hasattr(result, "content") and result.content:
                        return result.content[0].text
                    return str(result)
        except Exception as e:
            print(f"[ElasticMCP] Error running list_indices: {e}")
            return f"Error executing list_indices: {str(e)}"

    async def get_mappings(self, index: str) -> str:
        """Get the mapping schema of a specific Elasticsearch index to understand its fields and data types.
        
        Args:
            index: The name of the index to retrieve mapping for (e.g. 'fanly_listings' or 'fanly_matches').
        """
        if not self.is_configured():
            return "Elasticsearch is not configured. ELASTIC_URL or ELASTIC_API_KEY is missing."
            
        print(f"[ElasticMCP] Executing tool: get_mappings for index '{index}'")
        server_params = self.get_server_params()
        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool("get_mappings", arguments={"index": index})
                    if hasattr(result, "content") and result.content:
                        return result.content[0].text
                    return str(result)
        except Exception as e:
            print(f"[ElasticMCP] Error running get_mappings: {e}")
            return f"Error executing get_mappings: {str(e)}"

    async def search(self, index: str, body: dict) -> str:
        """Search an index in Elasticsearch using standard Query DSL body.
        
        Args:
            index: The name of the index to search (e.g., 'fanly_listings' or 'fanly_matches').
            body: The Elasticsearch Query DSL JSON object (e.g. {"query": {"match_all": {}}}).
        """
        if not self.is_configured():
            return "Elasticsearch is not configured. ELASTIC_URL or ELASTIC_API_KEY is missing."
            
        print(f"[ElasticMCP] Executing tool: search on index '{index}' with query: {json.dumps(body)}")
        server_params = self.get_server_params()
        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool("search", arguments={"index": index, "body": body})
                    if hasattr(result, "content") and result.content:
                        return result.content[0].text
                    return str(result)
        except Exception as e:
            print(f"[ElasticMCP] Error running search: {e}")
            return f"Error executing search: {str(e)}"
