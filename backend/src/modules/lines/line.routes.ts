import { Router } from "express";
import {
  createLineController,
  deleteLineController,
  getLineByIdController,
  listLinesController,
  updateLineController
} from "./line.controller";

export const lineRoutes = Router();

lineRoutes.get("/api/lines", listLinesController);
lineRoutes.post("/api/lines", createLineController);
lineRoutes.get("/api/lines/:id", getLineByIdController);
lineRoutes.patch("/api/lines/:id", updateLineController);
lineRoutes.delete("/api/lines/:id", deleteLineController);
