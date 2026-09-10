/**
 * lib/ai/tools/tool-declarations.ts
 *
 * Gemini FunctionDeclaration objects for all 13 portfolio AI tools.
 * These are sent as part of the Live session config (embedded in the ephemeral token).
 *
 * Google Search grounding is configured separately via getGoogleGroundingToolConfig().
 */

import { Type, type Tool } from "@google/genai";

/**
 * All custom tool declarations for the portfolio agent.
 * Keep in sync with ALLOWED_TOOLS in types/ai.ts.
 */
export const PORTFOLIO_TOOL_DECLARATIONS: Tool[] = [
  {
    functionDeclarations: [
      // ── Portfolio Tools ─────────────────────────────────────────────────────
      {
        name: "get_my_profile",
        description:
          "Get verified public information about Kishore — his name, headline, bio, location, contact email, portfolio URL, LinkedIn URL, and availability status. Use this as the primary source for basic profile questions.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_my_projects",
        description:
          "Get verified projects from Kishore's portfolio. Optionally filter by a keyword (technology name, topic, or project type). Returns project titles, descriptions, technologies used, GitHub links, and live demo links.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:
                "Optional keyword to filter projects (e.g. 'RAG', 'Python', 'AI', 'Next.js'). Leave empty to get all projects.",
            },
          },
        },
      },
      {
        name: "get_my_skills",
        description:
          "Get Kishore's verified skills grouped by category (e.g. AI/ML, Programming, Databases, Tools). Use this when visitors ask about technologies or skills.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_my_education",
        description:
          "Get Kishore's verified education history — institutions, degrees, fields of study, dates, and scores.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_my_certifications",
        description:
          "Get Kishore's verified certifications — titles, issuers, dates, and credential links.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_my_social_links",
        description:
          "Get Kishore's public social media and professional profile links (GitHub, LinkedIn, LeetCode, etc.).",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_my_resume",
        description:
          "Get the URL to Kishore's current resume/CV. Use when a visitor asks for the resume or CV link.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_my_blog_posts",
        description:
          "Get Kishore's published technical blog posts and in-depth engineering articles (topics: RAG architectures, LLM Orchestration with LangChain, AI Agent Systems, and Generative AI). Optionally filter by keyword. Returns article titles, summaries, tags, read times, and redirectable links to read the full articles on LinkedIn.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:
                "Optional keyword to filter blog posts (e.g. 'RAG', 'LangChain', 'Agent', 'AI'). Leave empty to get all articles.",
            },
          },
        },
      },

      // ── GitHub Tools ─────────────────────────────────────────────────────────
      {
        name: "get_my_github",
        description:
          "Get Kishore's public GitHub profile — username, name, bio, follower count, and total public repository count. Use for general GitHub profile questions.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_my_github_repositories",
        description:
          "Get a list of Kishore's public GitHub repositories sorted by most recently updated. Returns name, description, language, stars, forks, and URL. Use when asked about his GitHub projects or open-source work.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_github_repository",
        description:
          "Get detailed information about a specific public GitHub repository belonging to Kishore. Only works for repositories in the Kishoreabc account.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            repository: {
              type: Type.STRING,
              description:
                "The repository name (e.g. 'portfolio', 'rag-pipeline'). Do NOT include the username prefix.",
            },
          },
          required: ["repository"],
        },
      },
      {
        name: "get_github_repository_readme",
        description:
          "Get the README content of a specific public GitHub repository belonging to Kishore. Use when a visitor asks for more details about a specific project.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            repository: {
              type: Type.STRING,
              description: "The repository name (e.g. 'portfolio'). Do NOT include the username prefix.",
            },
          },
          required: ["repository"],
        },
      },
      {
        name: "get_github_activity",
        description:
          "Get Kishore's recent GitHub activity — which repositories were recently updated or pushed to. Use when asked what Kishore is currently working on.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },

      // ── Search Tool ──────────────────────────────────────────────────────────
      {
        name: "search_my_public_web_presence",
        description:
          "Search the public web for current information specifically about Kishore R. Use this ONLY when portfolio and GitHub data don't have the answer, or when the visitor asks about very recent activity. The search is automatically scoped to Kishore — do not add his name to the query yourself.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:
                "The search query describing what information is needed. Focus on the specific topic (e.g. 'latest project', 'recent article', 'conference talk'). Do NOT include 'Kishore' — it is added automatically.",
            },
          },
          required: ["query"],
        },
      },
    ],
  },
];
