import express from "express";

import * as OwnerControllers from "../controllers/owner";
import { bearerAuth, bodyIsObject } from "../utils/middlewares";

const router = express.Router();

router.get("/:ownerId", bearerAuth, OwnerControllers.getOwner);

router.post("/", express.json(), bodyIsObject, OwnerControllers.addOwner);

router.get("/:ownerId/forms", bearerAuth, OwnerControllers.getForms);

router.get("/:ownerId/responses", bearerAuth, OwnerControllers.getResponses);

export default router;
