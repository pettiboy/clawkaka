import express from "express";
import cors from "cors";
import { createServer } from "http";
import "dotenv/config";


const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));


const server = createServer(app);

server.listen(parseInt(process.env.PORT), () => {
  console.log(`[Clawkaka] Server listening on port http://localhost:${parseInt(process.env.PORT)}`);
});
