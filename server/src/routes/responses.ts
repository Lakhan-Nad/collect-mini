import express from "express";

import * as ResponseController from "../controllers/responses";
import { bearerAuth, responseById, responseOwner } from "../utils/middlewares";

const router = express.Router();

router.param("responseId", responseById);

router.get(
  "/:responseId",
  bearerAuth,
  responseOwner,
  ResponseController.getResponse
);

export default router;
