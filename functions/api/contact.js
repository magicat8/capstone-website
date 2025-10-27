export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { name, email, subject, message } = data;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const db = env.CONTACT_DB;
    if (!db) {
      console.error("CONTACT_DB binding missing");
      return new Response(
        JSON.stringify({ error: "Database binding not found" }),
        { status: 500 }
      );
    }

    // ✅ Use prepare().run() instead of exec()
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS contact_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT,
          subject TEXT,
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `).run();
    } catch (e) {
      console.error("Table creation error:", e);
      return new Response(
        JSON.stringify({ error: "Table creation failed", details: e.message }),
        { status: 500 }
      );
    }

    // Insert message
    try {
      await db.prepare(
        "INSERT INTO contact_requests (name, email, subject, message) VALUES (?, ?, ?, ?)"
      ).bind(name, email, subject, message).run();
    } catch (e) {
      console.error("Insert error:", e);
      return new Response(
        JSON.stringify({ error: "Insert failed", details: e.message }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("General error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
