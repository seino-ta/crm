import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import errorHandler from './middleware/error-handler';
import notFoundHandler from './middleware/not-found';
import requestLogger from './middleware/request-logger';
import { rateLimit } from './middleware/rate-limit';
import routes from './routes';
import { successResponse } from './utils/response';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(rateLimit);

app.get('/api', (_req, res) => {
  res.json(successResponse({ message: 'CRM API root' }));
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
