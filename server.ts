import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // API Routes
  app.post("/api/send-arrival-email", async (req, res) => {
    const { to, requesterName, ambulanceId } = req.body;
    
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.warn("RESEND_API_KEY not found in environment.");
      return res.status(500).json({ error: "Resend API key not configured." });
    }

    const resend = new Resend(resendKey);

    try {
      const data = await resend.emails.send({
        from: "Emergency System <onboarding@resend.dev>",
        to: [to || "delivered@resend.dev"],
        subject: "Ambulance Arrived!",
        html: `
          <h1>Ambulance for ${requesterName} is here!</h1>
          <p>Ambulance <strong>${ambulanceId}</strong> has reached your location.</p>
          <p>Please stay calm and assist the paramedics.</p>
          <hr />
          <p>Emergency Response System - Real-time tracking active.</p>
        `,
      });

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Resend Email Error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
