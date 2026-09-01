/**
 * Prisma seed script
 * Populates the database with Kishore R's real portfolio data.
 * Run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── SITE CONFIG ──────────────────────────────────────────────
  await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      heroTitle: "Building Intelligent Systems That Solve Real Problems.",
      heroSubtitle:
        "AI/ML & Generative AI Engineer focused on building intelligent, multimodal and production-oriented AI systems.",
      availabilityStatus: "Open to opportunities",
      name: "Kishore R",
      headline: "AI/ML & Generative AI Engineer",
      bio: "I'm a final-year B.Tech Artificial Intelligence & Machine Learning student at Bannari Amman Institute of Technology with strong foundations in Machine Learning, Deep Learning, Generative AI, RAG pipelines, multimodal AI, and LLM-powered applications. I build systems that bridge the gap between AI research and real-world deployment.",
      location: "Salem, Tamil Nadu, India",
      contactEmail: "Kishorehp134@gmail.com",
      aboutText:
        "Final-year B.Tech AI & ML student passionate about building production-ready AI systems. My work spans RAG pipelines, multimodal search, voice-first assistive technology, and LLM orchestration. I combine strong DSA fundamentals with modern AI engineering practices to create systems that actually work in production.",
      seoTitle: "Kishore R — AI/ML & Generative AI Engineer",
      seoDescription:
        "Portfolio of Kishore R, an AI/ML & Generative AI engineer specializing in RAG, multimodal AI, LLMs, and intelligent systems. Based in Salem, Tamil Nadu, India.",
      leetcodeTotal: 380,
      leetcodeEasy: 0,
      leetcodeMedium: 0,
      leetcodeHard: 0,
      achievements: [
        {
          id: "leetcode",
          title: "LeetCode",
          description: "380+ problems solved with strong focus on Data Structures & Algorithms",
          metric: "380+",
          url: "https://leetcode.com/u/KISHORE-R/",
          icon: "code",
        },
        {
          id: "nptel-java",
          title: "NPTEL — Programming in Java",
          description: "Elite + Gold certification with 92% score from SWAYAM NPTEL",
          metric: "92%",
          url: "",
          icon: "award",
        },
      ],
      journeyEntries: [
        {
          id: "btech",
          title: "B.Tech in AI & ML",
          organization: "Bannari Amman Institute of Technology",
          period: "2023 – Present",
          description:
            "Pursuing B.Tech in Artificial Intelligence & Machine Learning (CGPA: 8.33). Building a strong foundation in ML, Deep Learning, Generative AI, and software engineering.",
          type: "education",
          icon: "graduation-cap",
        },
        {
          id: "genai",
          title: "Generative AI Development",
          organization: "Self-driven",
          period: "2024 – Present",
          description:
            "Developed production-grade RAG pipelines, multimodal AI systems, and LLM-powered applications using LangChain, LangGraph, FastAPI, and vector databases.",
          type: "project",
          icon: "cpu",
        },
        {
          id: "leetcode-journey",
          title: "LeetCode / DSA Journey",
          organization: "LeetCode",
          period: "2023 – Present",
          description:
            "Solved 380+ problems across arrays, graphs, dynamic programming, trees, and more. Consistent practice to build algorithmic thinking.",
          type: "achievement",
          icon: "code",
        },
        {
          id: "nptel",
          title: "NPTEL — Programming in Java",
          organization: "SWAYAM NPTEL",
          period: "2024",
          description:
            "Earned Elite + Gold certification with 92% score in Programming in Java course.",
          type: "certification",
          icon: "award",
        },
        {
          id: "ncc",
          title: "NCC Involvement",
          organization: "National Cadet Corps",
          period: "2023 – Present",
          description:
            "Active NCC cadet — developing discipline, leadership, and teamwork alongside technical education.",
          type: "activity",
          icon: "shield",
        },
      ],
    },
  });
  console.log("✅ SiteConfig seeded");

  // ── EDUCATION ─────────────────────────────────────────────────
  await prisma.education.deleteMany();
  await prisma.education.createMany({
    data: [
      {
        institution: "Bannari Amman Institute of Technology",
        degree: "B.Tech",
        field: "Artificial Intelligence & Machine Learning",
        startDate: new Date("2023-08-01"),
        endDate: null, // currently enrolled
        score: "8.33 CGPA",
        description: "Final-year student. Focus areas: ML, Deep Learning, Generative AI, RAG, DSA.",
        displayOrder: 1,
      },
      {
        institution: "Cluny Vidya Nikethan School",
        degree: "Class XII — CBSE",
        field: null,
        startDate: new Date("2022-06-01"),
        endDate: new Date("2023-04-30"),
        score: "83.4%",
        description: null,
        displayOrder: 2,
      },
      {
        institution: "Cluny Vidya Nikethan School",
        degree: "Class X — CBSE",
        field: null,
        startDate: new Date("2020-06-01"),
        endDate: new Date("2021-04-30"),
        score: "84.8%",
        description: null,
        displayOrder: 3,
      },
    ],
  });
  console.log("✅ Education seeded");

  // ── SKILLS ────────────────────────────────────────────────────
  await prisma.skill.deleteMany();
  await prisma.skill.createMany({
    data: [
      // AI / ML / GenAI
      { name: "Machine Learning", category: "AI/ML", displayOrder: 1 },
      { name: "Deep Learning", category: "AI/ML", displayOrder: 2 },
      { name: "LLMs", category: "AI/ML", displayOrder: 3 },
      { name: "RAG", category: "AI/ML", displayOrder: 4 },
      { name: "AI Agents", category: "AI/ML", displayOrder: 5 },
      // Programming
      { name: "Python", category: "Programming", displayOrder: 1 },
      { name: "Java", category: "Programming", displayOrder: 2 },
      { name: "C", category: "Programming", displayOrder: 3 },
      { name: "Data Structures & Algorithms", category: "Programming", displayOrder: 4 },
      // Databases
      { name: "MySQL", category: "Databases", displayOrder: 1 },
      { name: "FAISS", category: "Databases", displayOrder: 2 },
      { name: "ChromaDB", category: "Databases", displayOrder: 3 },
      // Tools & Frameworks
      { name: "LangChain", category: "Tools", displayOrder: 1 },
      { name: "LangGraph", category: "Tools", displayOrder: 2 },
      { name: "FastAPI", category: "Tools", displayOrder: 3 },
      { name: "OpenAI", category: "Tools", displayOrder: 4 },
      { name: "Groq", category: "Tools", displayOrder: 5 },
      { name: "Scikit-learn", category: "Tools", displayOrder: 6 },
      { name: "Pandas", category: "Tools", displayOrder: 7 },
      { name: "NumPy", category: "Tools", displayOrder: 8 },
      { name: "Sentence Transformers", category: "Tools", displayOrder: 9 },
      { name: "CLIP", category: "Tools", displayOrder: 10 },
      { name: "BLIP", category: "Tools", displayOrder: 11 },
      { name: "PaddleOCR", category: "Tools", displayOrder: 12 },
      { name: "Tesseract OCR", category: "Tools", displayOrder: 13 },
      { name: "SSML", category: "Tools", displayOrder: 14 },
    ],
  });
  console.log("✅ Skills seeded");

  // ── SOCIAL LINKS ──────────────────────────────────────────────
  await prisma.socialLink.deleteMany();
  await prisma.socialLink.createMany({
    data: [
      {
        platform: "GitHub",
        url: "https://github.com/Kishoreabc",
        iconSlug: "github",
        enabled: true,
        displayOrder: 1,
      },
      {
        platform: "LinkedIn",
        url: "https://www.linkedin.com/in/kishore-r-615837238/",
        iconSlug: "linkedin",
        enabled: true,
        displayOrder: 2,
      },
      {
        platform: "LeetCode",
        url: "https://leetcode.com/u/KISHORE-R/",
        iconSlug: "code",
        enabled: true,
        displayOrder: 3,
      },
      {
        platform: "Email",
        url: "mailto:Kishorehp134@gmail.com",
        iconSlug: "mail",
        enabled: true,
        displayOrder: 4,
      },
    ],
  });
  console.log("✅ Social links seeded");

  // ── PROJECTS ──────────────────────────────────────────────────
  await prisma.project.deleteMany();
  await prisma.project.createMany({
    data: [
      {
        title: "RAG-Based Financial Chatbot",
        slug: "rag-financial-chatbot",
        shortDescription:
          "Retrieval-Augmented Generation pipeline for contextual Q&A over financial documents using vector embeddings, OCR, and LLMs.",
        fullDescription:
          "A production-grade RAG pipeline that enables intelligent Q&A over financial reports. The system processes unstructured documents using OCR, embeds them with sentence transformers, stores them in a FAISS vector index, and uses LLMs to generate source-grounded responses with financial ratio analysis and trend identification.",
        problem:
          "Financial analysts spend hours manually reading lengthy PDF reports to extract insights. There was no automated way to query financial documents with contextual understanding.",
        solution:
          "Built a RAG pipeline that ingests financial PDFs via PaddleOCR, chunks and embeds the content using Sentence Transformers, indexes it in FAISS, and uses OpenAI to generate accurate, source-grounded responses with citations.",
        architecture:
          "Document ingestion → OCR (PaddleOCR) → Chunking → Embedding (Sentence Transformers) → Vector storage (FAISS) → Query embedding → Similarity search → LLM (OpenAI) → Response with sources",
        technologies: ["OpenAI", "Sentence Transformers", "FAISS", "CLIP", "PaddleOCR", "Scikit-learn", "Python"],
        githubUrl: "https://github.com/Kishoreabc",
        liveUrl: null,
        imageUrl: null,
        metrics: "Source-grounded responses, financial ratio analysis, trend identification",
        featured: true,
        published: true,
        displayOrder: 1,
        githubSyncEnabled: false,
      },
      {
        title: "Multimodal Semantic Search for Fashion",
        slug: "multimodal-fashion-search",
        shortDescription:
          "Multimodal search system combining text and image queries over 20K+ fashion products using vector similarity and cosine ranking.",
        fullDescription:
          "A sophisticated recommendation system that enables users to search 20,000+ fashion products using both text descriptions and image queries. Combines MetaCLIP for visual embeddings, BLIP for image captioning, ChromaDB for vector storage, and Groq-powered LLM for natural language understanding.",
        problem:
          "Traditional fashion search relies only on keywords or filters, missing the semantic intent behind queries. Users cannot search by image similarity or combined text+image queries.",
        solution:
          "Built a multimodal pipeline using MetaCLIP for visual embeddings and BLIP for image captioning, storing vectors in ChromaDB. Users can query with text, image, or both, with cosine similarity ranking returning the most semantically relevant results.",
        architecture:
          "Product catalog → BLIP captioning + MetaCLIP visual embedding → ChromaDB vector store → Query (text/image/both) → Embedding → Cosine similarity search → Ranked results + Groq LLM explanation",
        technologies: ["OpenAI", "Groq", "MetaCLIP", "BLIP", "ChromaDB", "Tesseract OCR", "Pandas", "NumPy", "Python"],
        githubUrl: "https://github.com/kishoreabc/Multi-Model-Semantic-Search-for-Fashion-Collections",
        liveUrl: null,
        imageUrl: null,
        metrics: "20K+ products, text + image queries, cosine similarity ranking",
        featured: true,
        published: true,
        displayOrder: 2,
        githubSyncEnabled: true,
      },
      {
        title: "EchoRecall: Voice-First Memory Agent",
        slug: "echorecall-voice-memory-agent",
        shortDescription:
          "Voice-first assistive memory agent for the visually impaired — speech-to-speech interaction for object-location retrieval.",
        fullDescription:
          "An assistive AI agent designed for visually impaired users. EchoRecall allows users to verbally tell the system where they placed objects, and later ask where those objects are. The system uses Speech-to-Text to understand commands, stores memories in MySQL with vector indexing, and responds via OpenAI TTS with SSML for natural, expressive speech.",
        problem:
          "Visually impaired individuals often struggle to remember where they placed everyday objects. Existing solutions require visual interfaces or physical labeling, which are inaccessible.",
        solution:
          "Built a voice-first agent using FastAPI as the backend, Speech-to-Text for input, MySQL for persistent memory storage, and OpenAI TTS with SSML for natural voice responses. The system maintains a spatial memory of objects and locations, retrievable through natural speech.",
        architecture:
          "User speech → Speech-to-Text → FastAPI → Intent classification → MySQL memory store → Vector retrieval → OpenAI TTS with SSML → Audio response",
        technologies: ["FastAPI", "Speech-to-Text", "OpenAI TTS", "SSML", "MySQL", "Python"],
        githubUrl: "https://github.com/kishoreabc/Voice-Memory-Assistant",
        liveUrl: null,
        imageUrl: null,
        metrics: "Voice-first, low-latency, accessible for visually impaired users",
        featured: true,
        published: true,
        displayOrder: 3,
        githubSyncEnabled: true,
      },
    ],
  });
  console.log("✅ Projects seeded");

  // ── CERTIFICATIONS ────────────────────────────────────────────
  await prisma.certification.deleteMany();
  await prisma.certification.createMany({
    data: [
      {
        title: "Programming in Java",
        issuer: "SWAYAM NPTEL",
        issueDate: new Date("2024-01-01"),
        credentialId: null,
        credentialUrl: null,
        imageUrl: null,
        description: "Elite + Gold certification with 92% score. Covered core Java programming, OOP concepts, data structures in Java, and advanced topics.",
        published: true,
        displayOrder: 1,
      },
    ],
  });
  console.log("✅ Certifications seeded");

  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
