import { Hono } from 'hono';

import type { AppEnv } from '../types/runtime';

import accountsRouter from './accounts';
import activitiesRouter from './activities';
import auditLogsRouter from './audit-logs';
import authRouter from './auth';
import contactsRouter from './contacts';
import healthRouter from './health';
import leadsRouter from './leads';
import opportunitiesRouter from './opportunities';
import pipelineStagesRouter from './pipeline-stages';
import reportsRouter from './reports';
import tasksRouter from './tasks';
import usersRouter from './users';

const router = new Hono<AppEnv>();

router.route('/', healthRouter);
router.route('/accounts', accountsRouter);
router.route('/contacts', contactsRouter);
router.route('/leads', leadsRouter);
router.route('/activities', activitiesRouter);
router.route('/tasks', tasksRouter);
router.route('/opportunities', opportunitiesRouter);
router.route('/reports', reportsRouter);
router.route('/pipeline-stages', pipelineStagesRouter);
router.route('/audit-logs', auditLogsRouter);
router.route('/users', usersRouter);
router.route('/auth', authRouter);

export default router;
