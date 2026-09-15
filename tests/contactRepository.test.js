import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetConnectionForTesting } from '../server/src/db/connection.js';
import { runMigrations } from '../server/src/db/migrations.js';
import {
  createContact,
  getContactById,
  getContactByEmail,
  listContacts,
  updateContact,
  deleteContact,
  bulkUpsertContacts,
  createContactList,
  listContactLists,
  getContactListById,
  deleteContactList,
  addContactsToList,
  removeContactFromList,
} from '../server/src/db/contactRepository.js';

describe('Contact & Audience Repository with Multi-Tenancy', () => {
  const ws1 = 'ws-company-1';
  const ws2 = 'ws-company-2';

  beforeEach(async () => {
    process.env.DB_ENGINE = 'memory';
    resetConnectionForTesting();
    await runMigrations();
  });

  afterEach(() => {
    resetConnectionForTesting();
  });

  it('creates and retrieves a contact within a workspace', async () => {
    const contact = await createContact({
      workspaceId: ws1,
      email: 'sofia@empresa.com',
      firstName: 'Sofía',
      lastName: 'Castro',
      customFields: { cargo: 'Directora', tier: 'VIP' },
      isSubscribed: true,
    });

    expect(contact).toBeDefined();
    expect(contact.id).toMatch(/^ct-/);
    expect(contact.email).toBe('sofia@empresa.com');
    expect(contact.first_name).toBe('Sofía');
    expect(contact.custom_fields.cargo).toBe('Directora');
    expect(contact.is_subscribed).toBe(true);

    const fetched = await getContactById(contact.id, ws1);
    expect(fetched.email).toBe('sofia@empresa.com');

    const byEmail = await getContactByEmail('sofia@empresa.com', ws1);
    expect(byEmail.id).toBe(contact.id);
  });

  it('guarantees workspace isolation (tenant boundaries)', async () => {
    const contactWs1 = await createContact({
      workspaceId: ws1,
      email: 'tenant@isolated.com',
      firstName: 'Tenant1',
    });

    // In WS2, this contact must NOT be retrievable
    const notFoundInWs2 = await getContactById(contactWs1.id, ws2);
    expect(notFoundInWs2).toBeNull();

    const notFoundByEmailInWs2 = await getContactByEmail('tenant@isolated.com', ws2);
    expect(notFoundByEmailInWs2).toBeNull();

    const listWs2 = await listContacts(ws2);
    expect(listWs2.length).toBe(0);
  });

  it('updates existing contact on re-creation (upsert behavior)', async () => {
    await createContact({
      workspaceId: ws1,
      email: 'update@test.com',
      firstName: 'OldName',
      customFields: { plan: 'Free' },
    });

    const updated = await createContact({
      workspaceId: ws1,
      email: 'update@test.com',
      firstName: 'NewName',
      customFields: { plan: 'Pro' },
    });

    expect(updated.first_name).toBe('NewName');
    expect(updated.custom_fields.plan).toBe('Pro');

    const all = await listContacts(ws1);
    expect(all.length).toBe(1);
  });

  it('filters contacts by search term and subscription status', async () => {
    await createContact({
      workspaceId: ws1,
      email: 'pedro.ramirez@example.com',
      firstName: 'Pedro',
      lastName: 'Ramírez',
      isSubscribed: true,
    });

    await createContact({
      workspaceId: ws1,
      email: 'maria.sol@example.com',
      firstName: 'María',
      lastName: 'Sol',
      isSubscribed: false,
    });

    // Search query
    const searchRes = await listContacts(ws1, { search: 'ramirez' });
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].email).toBe('pedro.ramirez@example.com');

    // Subscription status
    const subscribedOnly = await listContacts(ws1, { isSubscribed: true });
    expect(subscribedOnly.length).toBe(1);
    expect(subscribedOnly[0].email).toBe('pedro.ramirez@example.com');

    const unsubscribedOnly = await listContacts(ws1, { isSubscribed: false });
    expect(unsubscribedOnly.length).toBe(1);
    expect(unsubscribedOnly[0].email).toBe('maria.sol@example.com');
  });

  it('manages contact lists, membership, and member counts', async () => {
    const list = await createContactList({
      workspaceId: ws1,
      name: 'Newsletter Clientes VIP',
      description: 'Segmento mensual',
    });

    expect(list.id).toMatch(/^list-/);
    expect(list.name).toBe('Newsletter Clientes VIP');

    const c1 = await createContact({
      workspaceId: ws1,
      email: 'vip1@empresa.com',
    });
    const c2 = await createContact({
      workspaceId: ws1,
      email: 'vip2@empresa.com',
    });

    // Add members
    await addContactsToList(list.id, [c1.id, c2.id]);

    // Check list details
    const listDetails = await getContactListById(list.id, ws1);
    expect(listDetails.memberCount).toBe(2);

    // List lists
    const allLists = await listContactLists(ws1);
    expect(allLists.length).toBe(1);
    expect(allLists[0].memberCount).toBe(2);

    // Filter contacts by list
    const listMembers = await listContacts(ws1, { listId: list.id });
    expect(listMembers.length).toBe(2);

    // Remove one member
    await removeContactFromList(list.id, c1.id);
    const updatedDetails = await getContactListById(list.id, ws1);
    expect(updatedDetails.memberCount).toBe(1);

    // Delete list
    await deleteContactList(list.id, ws1);
    const postDelete = await getContactListById(list.id, ws1);
    expect(postDelete).toBeNull();

    // Contact itself remains in workspace
    const contactStillExists = await getContactById(c1.id, ws1);
    expect(contactStillExists).not.toBeNull();
  });

  it('bulk upserts contacts and assigns them to a target list', async () => {
    const list = await createContactList({
      workspaceId: ws1,
      name: 'Lista Importada',
    });

    const parsedContacts = [
      { email: 'bulk1@test.com', first_name: 'Bulk 1' },
      { email: 'bulk2@test.com', first_name: 'Bulk 2' },
      { email: 'bulk3@test.com', first_name: 'Bulk 3' },
    ];

    const bulkRes = await bulkUpsertContacts(ws1, parsedContacts, {
      targetListId: list.id,
    });

    expect(bulkRes.createdCount).toBe(3);

    const members = await listContacts(ws1, { listId: list.id });
    expect(members.length).toBe(3);
  });
});
