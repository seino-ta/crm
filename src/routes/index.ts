import { Router } from 'express';

import accountsRouter from './accounts';
import authRouter from './auth';
import contactsRouter from './contacts';
import healthRouter from './health';
import opportunitiesRouter from './opportunities';
import pipelineStagesRouter from './pipeline-stages';

const router = Router();

router.use('/', healthRouter);
router.use('/accounts', accountsRouter);
router.use('/contacts', contactsRouter);
router.use('/opportunities', opportunitiesRouter);
router.use('/pipeline-stages', pipelineStagesRouter);
router.use('/auth', authRouter);

export default router;
