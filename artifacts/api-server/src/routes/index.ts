import { Router, type IRouter } from "express";
import healthRouter from "./health";
import casesRouter from "./cases";
import lawyersRouter from "./lawyers";
import paymentsRouter from "./payments";
import blogRouter from "./blog";

const router: IRouter = Router();

router.use(healthRouter);
router.use(casesRouter);
router.use(lawyersRouter);
router.use(paymentsRouter);
router.use(blogRouter);

export default router;
