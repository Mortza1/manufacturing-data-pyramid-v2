import { Router, type IRouter } from "express";
import healthRouter from "./health";
import v2SaveRouter from "./v2Save";

const router: IRouter = Router();

router.use(healthRouter);
router.use(v2SaveRouter);

export default router;
