import express from 'express';
import {
  createContact,
  listContacts,
  getContactById,
  updateContact,
  deleteContact,
  bulkUpsertContacts,
  createContactList,
  listContactLists,
  getContactListById,
  deleteContactList,
  addContactsToList,
  removeContactFromList,
} from '../db/contactRepository.js';
import { parseCsvContacts } from '../utils/csvImporter.js';
import { recordAuditEvent } from '../db/auditRepository.js';
import { authenticateToken, requireWorkspaceRole } from '../middlewares/auth.js';
import { z } from 'zod';
import { validateRequestBody } from '../schemas/apiSchemas.js';

const router = express.Router();
router.use(authenticateToken);

const CreateContactSchema = z.object({
  email: z.string().email('Dirección de correo electrónico inválida'),
  firstName: z.string().max(100).optional().default(''),
  lastName: z.string().max(100).optional().default(''),
  customFields: z.record(z.any()).optional().default({}),
  isSubscribed: z.boolean().optional().default(true),
});

const UpdateContactSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  customFields: z.record(z.any()).optional(),
  isSubscribed: z.boolean().optional(),
});

const CreateListSchema = z.object({
  name: z.string().min(1, 'El nombre de la lista es obligatorio').max(100),
  description: z.string().max(255).optional().default(''),
});

const ImportCsvSchema = z.object({
  csvText: z.string().min(1, 'El contenido CSV no puede estar vacío'),
  targetListId: z.string().optional().nullable(),
});

// -------------------------------------------------------------
// Contact Lists Routes (placed before /:id to avoid route collision)
// -------------------------------------------------------------

/**
 * GET /api/contacts/lists
 * List all contact lists in workspace
 */
router.get('/lists', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const lists = await listContactLists(req.workspaceId);
    res.json(lists);
  } catch (err) {
    console.error('Error listando listas de contactos:', err);
    res.status(500).json({ error: 'Error al obtener listas de contactos.' });
  }
});

/**
 * POST /api/contacts/lists
 * Create a new contact list
 */
router.post(
  '/lists',
  requireWorkspaceRole('editor'),
  validateRequestBody(CreateListSchema),
  async (req, res) => {
    try {
      const newList = await createContactList({
        workspaceId: req.workspaceId,
        ...req.validatedBody,
      });

      await recordAuditEvent({
        workspaceId: req.workspaceId,
        userId: req.user?.id || null,
        action: 'contact_list.created',
        resourceType: 'contact_list',
        resourceId: newList.id,
        metadata: { name: newList.name },
        ipAddress: req.ip,
      });

      res.status(201).json(newList);
    } catch (err) {
      console.error('Error creando lista de contactos:', err);
      res.status(400).json({ error: err.message || 'Error al crear la lista.' });
    }
  }
);

/**
 * GET /api/contacts/lists/:listId
 * Retrieve list details and its contacts
 */
router.get('/lists/:listId', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const list = await getContactListById(req.params.listId, req.workspaceId);
    if (!list) {
      return res.status(404).json({ error: 'Lista de contactos no encontrada.' });
    }

    const contacts = await listContacts(req.workspaceId, { listId: list.id });
    res.json({ ...list, contacts });
  } catch (err) {
    console.error('Error obteniendo lista de contactos:', err);
    res.status(500).json({ error: 'Error al obtener la lista de contactos.' });
  }
});

/**
 * DELETE /api/contacts/lists/:listId
 * Delete a contact list
 */
router.delete('/lists/:listId', requireWorkspaceRole('admin'), async (req, res) => {
  try {
    const list = await getContactListById(req.params.listId, req.workspaceId);
    if (!list) {
      return res.status(404).json({ error: 'Lista no encontrada.' });
    }

    await deleteContactList(req.params.listId, req.workspaceId);

    await recordAuditEvent({
      workspaceId: req.workspaceId,
      userId: req.user?.id || null,
      action: 'contact_list.deleted',
      resourceType: 'contact_list',
      resourceId: list.id,
      metadata: { name: list.name },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Lista eliminada correctamente.' });
  } catch (err) {
    console.error('Error eliminando lista:', err);
    res.status(500).json({ error: 'Error al eliminar la lista de contactos.' });
  }
});

/**
 * POST /api/contacts/lists/:listId/members
 * Add contacts to a list
 */
router.post('/lists/:listId/members', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de contactIds.' });
    }

    const list = await getContactListById(req.params.listId, req.workspaceId);
    if (!list) {
      return res.status(404).json({ error: 'Lista no encontrada.' });
    }

    const result = await addContactsToList(list.id, contactIds);
    res.json(result);
  } catch (err) {
    console.error('Error agregando miembros a la lista:', err);
    res.status(500).json({ error: 'Error al agregar contactos a la lista.' });
  }
});

/**
 * DELETE /api/contacts/lists/:listId/members/:contactId
 * Remove a contact from a list
 */
router.delete('/lists/:listId/members/:contactId', requireWorkspaceRole('editor'), async (req, res) => {
  try {
    const result = await removeContactFromList(req.params.listId, req.params.contactId);
    res.json(result);
  } catch (err) {
    console.error('Error removiendo contacto de la lista:', err);
    res.status(500).json({ error: 'Error al remover contacto de la lista.' });
  }
});

// -------------------------------------------------------------
// Contacts CRUD Routes
// -------------------------------------------------------------

/**
 * GET /api/contacts
 * List contacts with optional filters: listId, search, limit, offset
 */
router.get('/', requireWorkspaceRole('viewer'), async (req, res) => {
  try {
    const contacts = await listContacts(req.workspaceId, {
      listId: req.query.listId || null,
      search: req.query.search || null,
      isSubscribed: req.query.isSubscribed !== undefined ? req.query.isSubscribed === 'true' : null,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
      offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
    });
    res.json(contacts);
  } catch (err) {
    console.error('Error listando contactos:', err);
    res.status(500).json({ error: 'Error al obtener los contactos.' });
  }
});

/**
 * POST /api/contacts
 * Create or upsert a single contact
 */
router.post(
  '/',
  requireWorkspaceRole('editor'),
  validateRequestBody(CreateContactSchema),
  async (req, res) => {
    try {
      const contact = await createContact({
        workspaceId: req.workspaceId,
        ...req.validatedBody,
      });

      res.status(201).json(contact);
    } catch (err) {
      console.error('Error creando contacto:', err);
      res.status(400).json({ error: err.message || 'Error al guardar el contacto.' });
    }
  }
);

/**
 * POST /api/contacts/import-csv
 * Import and parse CSV text into workspace contacts
 */
router.post(
  '/import-csv',
  requireWorkspaceRole('editor'),
  validateRequestBody(ImportCsvSchema),
  async (req, res) => {
    try {
      const { csvText, targetListId } = req.validatedBody;
      const parsed = parseCsvContacts(csvText);

      const result = await bulkUpsertContacts(req.workspaceId, parsed.contacts, {
        targetListId,
      });

      await recordAuditEvent({
        workspaceId: req.workspaceId,
        userId: req.user?.id || null,
        action: 'contacts.imported',
        resourceType: 'contact',
        metadata: {
          totalRows: parsed.totalRows,
          createdCount: result.createdCount,
          updatedCount: result.updatedCount,
          targetListId,
        },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        totalRows: parsed.totalRows,
        importedCount: result.createdCount + result.updatedCount,
        createdCount: result.createdCount,
        updatedCount: result.updatedCount,
        errors: parsed.errors,
      });
    } catch (err) {
      console.error('Error importando CSV:', err);
      res.status(400).json({ error: err.message || 'Error al procesar el archivo CSV.' });
    }
  }
);

/**
 * PUT /api/contacts/:id
 * Update contact details
 */
router.put(
  '/:id',
  requireWorkspaceRole('editor'),
  validateRequestBody(UpdateContactSchema),
  async (req, res) => {
    try {
      const updated = await updateContact(req.params.id, req.workspaceId, req.validatedBody);
      res.json(updated);
    } catch (err) {
      console.error('Error actualizando contacto:', err);
      res.status(400).json({ error: err.message || 'Error al actualizar el contacto.' });
    }
  }
);

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete('/:id', requireWorkspaceRole('admin'), async (req, res) => {
  try {
    const existing = await getContactById(req.params.id, req.workspaceId);
    if (!existing) {
      return res.status(404).json({ error: 'Contacto no encontrado.' });
    }

    await deleteContact(req.params.id, req.workspaceId);
    res.json({ success: true, message: 'Contacto eliminado.' });
  } catch (err) {
    console.error('Error eliminando contacto:', err);
    res.status(500).json({ error: 'Error al eliminar el contacto.' });
  }
});

export default router;
