import { Router } from 'express';

import accountsRouter from './accounts';
import activitiesRouter from './activities';
import auditLogsRouter from './audit-logs';
import authRouter from './auth';
import contactsRouter from './contacts';
import healthRouter from './health';
import opportunitiesRouter from './opportunities';
import pipelineStagesRouter from './pipeline-stages';
import reportsRouter from './reports';
import tasksRouter from './tasks';

const router = Router();

router.use('/', healthRouter);
router.use('/accounts', accountsRouter);
router.use('/contacts', contactsRouter);
router.use('/activities', activitiesRouter);
router.use('/tasks', tasksRouter);
router.use('/opportunities', opportunitiesRouter);
router.use('/reports', reportsRouter);
router.use('/pipeline-stages', pipelineStagesRouter);
router.use('/audit-logs', auditLogsRouter);
router.use('/auth', authRouter);

export default router;
