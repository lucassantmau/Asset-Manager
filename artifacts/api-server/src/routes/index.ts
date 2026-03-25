import { Router, type IRouter } from "express";
import healthRouter from "./health";
import casesRouter from "./cases";
import lawyersRouter from "./lawyers";
import paymentsRouter from "./payments";
import blogRouter from "./blog";
import webhookRouter from "./webhook";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(casesRouter);
router.use(lawyersRouter);
router.use(paymentsRouter);
router.use(blogRouter);
router.use(webhookRouter);
router.use(authRouter);

export default router;
