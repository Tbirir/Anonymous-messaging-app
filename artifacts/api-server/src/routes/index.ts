import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import whisperRouter from "./whisper";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(whisperRouter);

export default router;
