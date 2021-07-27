import express from "express";

import * as FormControllers from "../controllers/forms";
import {
  bodyIsObject,
  formById,
  bearerAuth,
  formOwner,
} from "../utils/middlewares";

const router = express.Router();

router.param("formId", formById);

router.get("/:formId", FormControllers.getForm);

router.post(
  "/",
  express.json(),
  bearerAuth,
  bodyIsObject,
  FormControllers.addForm
);

router.get(
  "/:formId/responses",
  bearerAuth,
  formOwner,
  FormControllers.getFormResponses
);

router.post(
  "/:formId/responses",
  express.json(),
  bearerAuth,
  bodyIsObject,
  FormControllers.addResponse
);

export default router;
