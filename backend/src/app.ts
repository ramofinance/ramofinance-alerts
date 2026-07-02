import express from "express";

export const createServer = () => {
  const app = express();

  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  return app;
};
