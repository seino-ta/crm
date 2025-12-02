import { Router } from 'express';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { contactFilterSchema, createContactSchema, updateContactSchema, type CreateContactInput, type UpdateContactInput } from '../modules/contact/contact.schema';
import { createContact, getContactById, listContacts, softDeleteContact, updateContact } from '../modules/contact/contact.service';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate());

router.get('/', async (req, res, next) => {
  try {
    const parsed = contactFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(createError(422, 'Validation error', { details: parsed.error.flatten() }));
    }
    const result = await listContacts(parsed.data);
    res.json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const contact = await getContactById(id);
    res.json(successResponse(contact));
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(createContactSchema), async (req, res, next) => {
  try {
    const payload = req.body as CreateContactInput;
    const contact = await createContact(payload, req.user?.id);
    res.status(201).json(successResponse(contact));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBody(updateContactSchema), async (req, res, next) => {
  try {
    const payload = req.body as UpdateContactInput;
    const { id } = req.params as { id: string };
    const contact = await updateContact(id, payload, req.user?.id);
    res.json(successResponse(contact));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    await softDeleteContact(id, req.user);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
