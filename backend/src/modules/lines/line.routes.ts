import { Router } from "express";
import {
  createLineController,
  deleteLineController,
  getLineByIdController,
  listLinesController,
  updateLineController
} from "./line.controller";
import { requireAdmin, requireTelegramAuth } from "../../middleware/telegram-auth";

export const lineRoutes = Router();

lineRoutes.use("/api/lines", requireTelegramAuth, requireAdmin);

lineRoutes.get("/api/lines", listLinesController);
lineRoutes.post("/api/lines", createLineController);
lineRoutes.get("/api/lines/:id", getLineByIdController);
lineRoutes.patch("/api/lines/:id", updateLineController);
lineRoutes.delete("/api/lines/:id", deleteLineController);
