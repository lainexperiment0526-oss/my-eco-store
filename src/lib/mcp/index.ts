import { defineMcp } from "@lovable.dev/mcp-js";
import listAppsTool from "./tools/list-apps";
import getAppTool from "./tools/get-app";
import listCategoriesTool from "./tools/list-categories";
import listBlogPostsTool from "./tools/list-blog-posts";

export default defineMcp({
  name: "openapp-mcp",
  title: "OpenApp Directory",
  version: "0.1.0",
  instructions:
    "Public tools for browsing the OpenApp directory: search apps, fetch app details, list categories, and read published blog posts. All data returned is intentionally public.",
  tools: [listAppsTool, getAppTool, listCategoriesTool, listBlogPostsTool],
});
