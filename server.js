require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const db = require("./db");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const docs = JSON.parse(
  fs.readFileSync(path.join(__dirname, "docs.json"), "utf-8")
);

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.post("/api/chat", (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: "Missing sessionId or message" });
  }

  db.run(`INSERT OR IGNORE INTO sessions (id) VALUES (?)`, [sessionId]);

  db.all(
    `SELECT role, content 
     FROM messages 
     WHERE session_id = ? 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [sessionId],
    async (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      const previousMessages = rows.reverse();

      db.run(
        `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`,
        [sessionId, "user", message]
      );

      try {
        const docsText = docs
          .map((doc) => `Title: ${doc.title}\nContent: ${doc.content}`)
          .join("\n\n");

        const historyText = previousMessages
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0,
          messages: [
            {
              role: "system",
              content: `You are a support assistant.

STRICT RULES:
- Answer ONLY using the provided documentation.
- If the answer is not found in the documentation, reply EXACTLY:
"Sorry, I don’t have information about that."
- Do not guess.
- Do not add extra information.`,
            },
            {
              role: "user",
              content: `Documentation:
${docsText}

Conversation History:
${historyText}

User Question:
${message}`,
            },
          ],
        });

        let reply =
          completion.choices[0]?.message?.content?.trim() ||
          "Sorry, I don’t have information about that.";

        db.run(
          `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`,
          [sessionId, "assistant", reply]
        );

        res.json({
          reply,
          contextUsed: previousMessages.length,
          tokensUsed: completion.usage?.total_tokens || 0,
        });
      } catch (error) {
  console.error("OPENAI ERROR:", error.message);

  // Fallback: document-only manual matching
  let reply = "Sorry, I don’t have information about that.";

  const lowerMessage = message.toLowerCase();

  for (let doc of docs) {
    const docText = (doc.title + " " + doc.content).toLowerCase();
    if (docText.includes("password") && lowerMessage.includes("password")) {
      reply = doc.content;
      break;
    }
    if (docText.includes("refund") && lowerMessage.includes("refund")) {
      reply = doc.content;
      break;
    }
  }

  db.run(
    `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`,
    [sessionId, "assistant", reply]
  );

  res.json({
    reply,
    contextUsed: previousMessages.length,
    tokensUsed: 0,
    fallbackMode: true
  });
}
    }
  );
});

app.get("/api/conversations/:sessionId", (req, res) => {
  const { sessionId } = req.params;

  db.all(
    `SELECT role, content, created_at 
     FROM messages 
     WHERE session_id = ? 
     ORDER BY created_at ASC`,
    [sessionId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      res.json(rows);
    }
  );
});

app.get("/api/sessions", (req, res) => {
  db.all(
    `SELECT id, updated_at 
     FROM sessions 
     ORDER BY updated_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      res.json(rows);
    }
  );
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
