"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { BlogPostSchema, BlogPostFormData } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createBlogPost(data: BlogPostFormData) {
  await requireAdmin();

  const validated = BlogPostSchema.parse(data);

  const blog = await prisma.blogPost.create({
    data: {
      ...validated,
      publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/blogs");
  return { success: true, blog };
}

export async function updateBlogPost(id: string, data: BlogPostFormData) {
  await requireAdmin();

  const validated = BlogPostSchema.parse(data);

  const blog = await prisma.blogPost.update({
    where: { id },
    data: {
      ...validated,
      publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath(`/blogs/${blog.slug}`);
  revalidatePath("/admin/blogs");
  return { success: true, blog };
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();

  await prisma.blogPost.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/blogs");
  return { success: true };
}

export async function toggleBlogPublished(id: string, published: boolean) {
  await requireAdmin();

  const blog = await prisma.blogPost.update({
    where: { id },
    data: { published },
  });

  revalidatePath("/");
  revalidatePath(`/blogs/${blog.slug}`);
  revalidatePath("/admin/blogs");
  return { success: true };
}

export async function toggleBlogFeatured(id: string, featured: boolean) {
  await requireAdmin();

  const blog = await prisma.blogPost.update({
    where: { id },
    data: { featured },
  });

  revalidatePath("/");
  revalidatePath(`/blogs/${blog.slug}`);
  revalidatePath("/admin/blogs");
  return { success: true };
}

import { GoogleGenAI } from "@google/genai";
import { toSlug } from "@/lib/utils";

async function fetchUrlMetadata(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
    });

    if (!res.ok) {
      return {};
    }

    const html = await res.text();
    const ogTitleMatch =
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
    const ogDescMatch =
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const metaDescMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);

    const ogImageMatch =
      html.match(/<meta[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image(?::secure_url)?["']/i) ||
      html.match(/<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:image(?::src)?["']/i) ||
      html.match(/<img[^>]*class=["'][^"']*cover[_-]image[^"']*["'][^>]*src=["']([^"']*)["']/i);
    const ogDateMatch =
      html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*name=["']date["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*name=["']publish_date["'][^>]*content=["']([^"']*)["']/i);

    // Extract text from body (strip scripts, styles, SVGs, HTML tags)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyText = "";
    if (bodyMatch) {
      bodyText = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<svg[\s\S]*?<\/svg>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000);
    }

    let extractedCover = (ogImageMatch?.[1] || "").replace(/&amp;/g, "&").trim();
    // Ignore generic LinkedIn placeholder icons
    if (extractedCover.includes("static.licdn.com/aero-v1/sc/h/")) {
      extractedCover = "";
    }

    return {
      title: ogTitleMatch?.[1] || titleMatch?.[1]?.trim(),
      description: ogDescMatch?.[1] || metaDescMatch?.[1]?.trim(),
      coverImage: extractedCover,
      publishedDate: ogDateMatch?.[1] || "",
      bodySnippet: bodyText,
    };
  } catch (err) {
    console.warn("fetchUrlMetadata failed, proceeding with URL only:", err);
    return {};
  }
}

export async function generateBlogQuickRead({
  url,
  apiKey,
  model,
}: {
  url: string;
  apiKey?: string;
  model?: string;
}) {
  await requireAdmin();

  if (!url || !url.trim().startsWith("http")) {
    return {
      success: false,
      error: "Please enter a valid URL starting with http:// or https://",
    };
  }

  const config = await prisma.siteConfig.findUnique({
    where: { id: "singleton" },
    select: { geminiApiKey: true, geminiModel: true },
  });

  const effectiveKey = apiKey?.trim() || config?.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!effectiveKey) {
    return {
      success: false,
      needsApiKey: true,
      error:
        "Gemini API key is required. Please set it in Admin Settings (Profile & Config) or .env.local.",
    };
  }

  const effectiveModel = (
    model?.trim() ||
    config?.geminiModel?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    "gemini-2.5-flash"
  ).toLowerCase();

  try {
    const pageData = await fetchUrlMetadata(url.trim());
    const ai = new GoogleGenAI({ apiKey: effectiveKey });

    const prompt = `You are an expert AI/ML technical writer and developer advocate for Kishore R (Aspiring AI/ML & Generative AI Engineer).
Kishore has published or shared a technical article/post at the following link:
Target URL: ${url}
Extracted Title: ${pageData.title || "Not detected"}
Extracted Description/Hook: ${pageData.description || "Not detected"}
Extracted Snippet: ${pageData.bodySnippet || "Not available"}
Extracted Image: ${pageData.coverImage || "None"}

Your objective is to generate an in-depth, structured "Quick Read" breakdown for Kishore's portfolio visitors, populating all necessary blog details.
Even if the URL is a LinkedIn post or has brief context, infer the core AI/ML or software engineering topics, tools, and technical value from the URL and snippet.

Return ONLY a JSON object with these exact keys:
{
  "title": "A crisp, engaging title for the blog post",
  "slug": "url-friendly-kebab-case-slug",
  "summary": "A concise 2-3 sentence executive summary of the engineering problem, solution, and value.",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "readTime": "4 min read",
  "publishedAt": "YYYY-MM-DD",
  "coverImage": "URL to high-quality relevant tech image if available or empty string",
  "content": "## Overview\\n\\n[Detailed explanation of the problem, why it matters, and high-level architecture]\\n\\n### Key Technical Insights\\n\\n[Deep dive into mechanisms, frameworks, algorithms, or pipelines]\\n\\n### Implementation Details & Trade-offs\\n\\n[Concrete trade-offs, performance nuances, or pseudocode/architecture insights]\\n\\n### Practical Takeaways\\n\\n- [Actionable takeaway 1]\\n- [Actionable takeaway 2]\\n- [Actionable takeaway 3]"
}`;

    const response = await ai.models.generateContent({
      model: effectiveModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);

    const title = parsed.title || pageData.title || "AI Engineering Deep-Dive";
    const slug = parsed.slug || toSlug(title);

    let parsedDate = "";
    if (parsed.publishedAt && !isNaN(Date.parse(parsed.publishedAt))) {
      parsedDate = new Date(parsed.publishedAt).toISOString().split("T")[0];
    } else if (pageData.publishedDate && !isNaN(Date.parse(pageData.publishedDate))) {
      parsedDate = new Date(pageData.publishedDate).toISOString().split("T")[0];
    } else {
      parsedDate = new Date().toISOString().split("T")[0];
    }

    let coverImage = (pageData.coverImage || parsed.coverImage || "").replace(/&amp;/g, "&").trim();

    // Auto-upload extracted cover image to Cloudinary so it is permanent and avoids hotlink issues
    if (coverImage && coverImage.startsWith("http")) {
      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "wasbvar9";
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

        const formData = new FormData();
        formData.append("file", coverImage);
        formData.append("upload_preset", uploadPreset);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(8000),
          }
        );

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData.secure_url) {
            coverImage = cloudData.secure_url;
          }
        }
      } catch (uploadErr) {
        console.warn("Cloudinary auto-upload failed, keeping direct clean image URL:", uploadErr);
      }
    }

    return {
      success: true,
      data: {
        title,
        slug,
        summary: parsed.summary || pageData.description || "",
        tags: Array.isArray(parsed.tags) ? parsed.tags : ["Generative AI", "Engineering"],
        readTime: parsed.readTime || "4 min read",
        publishedAt: parsedDate,
        coverImage,
        content: parsed.content || "",
      },
    };
  } catch (err: any) {
    console.error("Gemini blog generation error:", err);
    return {
      success: false,
      error:
        err?.message ||
        "Failed to generate Quick Read content with Gemini API. Please verify your API key.",
    };
  }
}
