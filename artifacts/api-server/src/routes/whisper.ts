import { Router, type IRouter } from "express";
import { randomBytes, createHmac } from "node:crypto";
import { and, eq, desc, sql, lt } from "drizzle-orm";
import { db, inboxes, messages, sendLimits } from "@workspace/db";
import {
  GetInboxResponse, UpdateInboxBody, UpdateInboxResponse,
  ListMessagesResponse, UpdateMessageBody, UpdateMessageParams, UpdateMessageResponse,
  DeleteMessageParams, GetPublicInboxParams, GetPublicInboxResponse,
  SendMessageBody, SendMessageParams, SendMessageResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
async function ownInbox(ownerId: string, name: string) {
  const existing = await db.select().from(inboxes).where(eq(inboxes.ownerId, ownerId));
  if (existing[0]) return existing[0];
  await db.insert(inboxes).values({
    ownerId, displayName: name || "My inbox", handle: randomBytes(9).toString("hex"),
  }).onConflictDoNothing({ target: inboxes.ownerId });
  return (await db.select().from(inboxes).where(eq(inboxes.ownerId, ownerId)))[0]!;
}
async function withCounts(inbox: typeof inboxes.$inferSelect) {
  const [counts] = await db.select({
    total: sql<number>`count(*)::int`,
    unread: sql<number>`count(*) filter (where not ${messages.isRead})::int`,
    favorites: sql<number>`count(*) filter (where ${messages.isFavorite})::int`,
  }).from(messages).where(eq(messages.inboxId, inbox.id));
  return { ...inbox, ...counts };
}
const messageJson = (m: typeof messages.$inferSelect) => ({ ...m, createdAt: m.createdAt.toISOString() });

router.get("/inbox", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Please sign in." }); return; }
  const inbox = await ownInbox(req.user.id, req.user.firstName || "");
  res.json(GetInboxResponse.parse(await withCounts(inbox)));
});
router.patch("/inbox", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Please sign in." }); return; }
  const parsed = UpdateInboxBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.displayName.trim()) { res.status(400).json({ error: "Please enter a name (1–60 characters) and a bio up to 200 characters." }); return; }
  const inbox = await ownInbox(req.user.id, req.user.firstName || "");
  const [updated] = await db.update(inboxes).set({ ...parsed.data, displayName: parsed.data.displayName.trim() }).where(eq(inboxes.id, inbox.id)).returning();
  res.json(UpdateInboxResponse.parse(await withCounts(updated)));
});
router.get("/messages", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Please sign in." }); return; }
  const inbox = await ownInbox(req.user.id, req.user.firstName || "");
  const rows = await db.select().from(messages).where(eq(messages.inboxId, inbox.id)).orderBy(desc(messages.createdAt));
  res.json(ListMessagesResponse.parse(rows.map(messageJson)));
});
router.patch("/messages/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Please sign in." }); return; }
  const params = UpdateMessageParams.safeParse(req.params);
  const body = UpdateMessageBody.safeParse(req.body);
  if (!params.success || !body.success || !Object.keys(body.data).length) { res.status(400).json({ error: "Invalid update." }); return; }
  const inbox = await ownInbox(req.user.id, req.user.firstName || "");
  const [row] = await db.update(messages).set(body.data).where(and(eq(messages.id, params.data.id), eq(messages.inboxId, inbox.id))).returning();
  if (!row) { res.status(404).json({ error: "Message not found." }); return; }
  res.json(UpdateMessageResponse.parse(messageJson(row)));
});
router.delete("/messages/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Please sign in." }); return; }
  const params = DeleteMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid message." }); return; }
  const inbox = await ownInbox(req.user.id, req.user.firstName || "");
  const deleted = await db.delete(messages).where(and(eq(messages.id, params.data.id), eq(messages.inboxId, inbox.id))).returning({ id: messages.id });
  if (!deleted.length) { res.status(404).json({ error: "Message not found." }); return; }
  res.sendStatus(204);
});
router.get("/public/:handle", async (req, res) => {
  const params = GetPublicInboxParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid link." }); return; }
  const [inbox] = await db.select().from(inboxes).where(eq(inboxes.handle, params.data.handle));
  if (!inbox) { res.status(404).json({ error: "This inbox does not exist." }); return; }
  res.json(GetPublicInboxResponse.parse(inbox));
});
router.post("/public/:handle", async (req, res) => {
  const params = SendMessageParams.safeParse(req.params);
  const body = SendMessageBody.safeParse(req.body);
  if (!params.success || !body.success || !body.data.content.trim()) { res.status(400).json({ error: "Write a message between 1 and 1,000 characters." }); return; }
  if (body.data.website) { res.status(400).json({ error: "Message blocked by spam protection." }); return; }
  const secret = process.env.SESSION_SECRET;
  if (!secret) { res.status(503).json({ error: "Message sending is temporarily unavailable." }); return; }
  const [inbox] = await db.select().from(inboxes).where(eq(inboxes.handle, params.data.handle));
  if (!inbox) { res.status(404).json({ error: "This inbox does not exist." }); return; }
  if (!inbox.acceptingMessages) { res.status(403).json({ error: "This inbox is taking a break from messages." }); return; }
  const window = Math.floor(Date.now() / 600000);
  // The proxy appends the real client address; do not trust the first, client-supplied entry.
  const ip = req.get("x-forwarded-for")?.split(",").at(-1)?.trim() || req.socket.remoteAddress || "unknown";
  const key = createHmac("sha256", secret).update(`${ip}:${window}`).digest("hex");
  await db.delete(sendLimits).where(lt(sendLimits.expiresAt, new Date()));
  const [limit] = await db.insert(sendLimits).values({ key, count: 1, expiresAt: new Date((window + 1) * 600000) })
    .onConflictDoUpdate({ target: sendLimits.key, set: { count: sql`${sendLimits.count} + 1` } }).returning();
  if (limit.count > 5) { res.setHeader("Retry-After", "600"); res.status(429).json({ error: "Please wait a few minutes before sending another message." }); return; }
  await db.insert(messages).values({ inboxId: inbox.id, content: body.data.content.trim() });
  res.status(201).json(SendMessageResponse.parse({ success: true }));
});
export default router;
