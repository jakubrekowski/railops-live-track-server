import { createMiddleware } from "hono/factory"

export const requireApiKey = createMiddleware(async (c, next) => {
  const expected = process.env.API_KEY
  if (!expected) {
    return c.json({ error: "API_KEY is not configured on the server" }, 500)
  }
  const provided = c.req.header("x-api-key")
  if (provided !== expected) {
    return c.json({ error: "Unauthorized" }, 401)
  }
  await next()
})
