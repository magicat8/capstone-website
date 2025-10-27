export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { name, email, subject, message } = data;

    // Basic validation
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Check D1 binding
    if (!env.CONTACT_DB) {
      console.error("CONTACT_DB binding missing");
      return new Response(
        JSON.stringify({ error: "CONTACT_DB binding not found" }),
        { status: 500 }
      );
    }

    // Create the table if it doesn’t exist
    try {
      await env.CONTACT_DB.exec(`
        CREATE TABLE IF NOT EXISTS contact_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT,
          subject TEXT,
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.error("Table creation error:", e);
      return new Response(
        JSON.stringify({ error: "Table creation failed", details: e.message }),
        { status: 500 }
      );
    }

    // Insert the message
    try {
      const stmt = env.CONTACT_DB.prepare(
        "INSERT INTO contact_requests (name, email, subject, message) VALUES (?, ?, ?, ?)"
      );
      await stmt.bind(name, email, subject, message).run();
    } catch (e) {
      console.error("Insert error:", e);
      return new Response(
        JSON.stringify({ error: "Insert failed", details: e.message }),
        { status: 500 }
      );
    }

    // Success
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("General error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}
