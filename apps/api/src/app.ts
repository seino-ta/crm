import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';

import { handleError } from './middleware/error-handler';
import { handleNotFound } from './middleware/not-found';
import { rateLimit } from './middleware/rate-limit';
import { requestLogger } from './middleware/request-logger';
import routes from './routes';
import type { AppEnv } from './types/runtime';
import { successResponse } from './utils/response';

const app = new Hono<AppEnv>();

app.use('*', cors());
app.use('*', bodyLimit({ maxSize: 1024 * 1024 }));
app.use('*', requestLogger);
app.use('*', rateLimit);

app.get('/api', (c) => c.json(successResponse({ message: 'CRM API root' })));

app.route('/api', routes);

app.notFound((c) => handleNotFound(c));
app.onError((err, c) => handleError(err, c));

export default app;
