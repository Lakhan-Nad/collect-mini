import { Request, Response } from "express";

export function getResponse(req: Request, res: Response): void {
  res.status(200).json({ data: req.formResponse!.toObject() });
}
