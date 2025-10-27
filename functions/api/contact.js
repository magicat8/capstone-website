export async function onRequestPost({ request, env }) {
  try {
    const db = env.CONTACT_DB; // Bound in Cloudflare Pages → Settings → D1 database
    const data = await request.json();
    const { name, email, subject, message } = data;

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Ensure table exists (safe to run each request)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS contact_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        subject TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert submission
    await db
      .prepare("INSERT INTO contact_requests (name, email, subject, message) VALUES (?, ?, ?, ?)")
      .bind(name, email, subject, message)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
