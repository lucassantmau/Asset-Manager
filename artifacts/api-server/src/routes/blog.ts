import { Router, type IRouter } from "express";
import { db, blogPostsTable } from "@workspace/db";
import { GetBlogPostsQueryParams, GetBlogPostParams } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/blog", async (req, res) => {
  const query = GetBlogPostsQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;

  const posts = await db
    .select()
    .from(blogPostsTable)
    .orderBy(desc(blogPostsTable.publishedAt))
    .limit(limit)
    .offset(offset);

  const total = await db.$count(blogPostsTable);

  res.json({
    posts: posts.map((p) => ({
      id: p.uuid,
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      content: p.content,
      category: p.category,
      imageUrl: p.imageUrl,
      publishedAt: p.publishedAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
});

router.get("/blog/:slug", async (req, res) => {
  const params = GetBlogPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: params.error.message });
    return;
  }

  const found = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.slug, params.data.slug))
    .limit(1);

  if (!found.length) {
    res.status(404).json({ error: "NOT_FOUND", message: "Blog post not found" });
    return;
  }

  const p = found[0];
  res.json({
    id: p.uuid,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    content: p.content,
    category: p.category,
    imageUrl: p.imageUrl,
    publishedAt: p.publishedAt.toISOString(),
  });
});

export default router;
