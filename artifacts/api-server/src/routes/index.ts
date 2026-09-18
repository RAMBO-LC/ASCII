import { Router, type IRouter } from "express";
import healthRouter from "./health";
import MargUpRouter from "./MargUp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(MargUpRouter);

export default router;
