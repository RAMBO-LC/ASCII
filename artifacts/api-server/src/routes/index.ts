import { Router, type IRouter } from "express";
import healthRouter from "./health";
import devmentorRouter from "./devmentor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(devmentorRouter);

export default router;
