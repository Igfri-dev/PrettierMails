import { describe, it, expect } from 'vitest';
import { parseCsvContacts } from '../server/src/utils/csvImporter.js';

describe('CSV Contact Importer & Auto-Mapper', () => {
  it('parses comma-separated CSV with Spanish column names', () => {
    const csv = `correo,nombre,apellido,ciudad
lucia@ejemplo.com,Lucía,Pérez,Barcelona
marcos@ejemplo.com,Marcos,Gómez,Madrid`;

    const res = parseCsvContacts(csv);
    expect(res.contacts.length).toBe(2);
    expect(res.contacts[0].email).toBe('lucia@ejemplo.com');
    expect(res.contacts[0].first_name).toBe('Lucía');
    expect(res.contacts[0].last_name).toBe('Pérez');
    expect(res.contacts[0].custom_fields.ciudad).toBe('Barcelona');
    expect(res.contacts[1].email).toBe('marcos@ejemplo.com');
  });

  it('detects semicolon delimiter and English column names', () => {
    const csv = `email;first_name;last_name;company;role
alice@example.com;Alice;Smith;Acme;Lead Dev
bob@example.com;Bob;Jones;Initech;Manager`;

    const res = parseCsvContacts(csv);
    expect(res.contacts.length).toBe(2);
    expect(res.contacts[0].email).toBe('alice@example.com');
    expect(res.contacts[0].first_name).toBe('Alice');
    expect(res.contacts[0].custom_fields.company).toBe('Acme');
    expect(res.contacts[0].custom_fields.role).toBe('Lead Dev');
  });

  it('handles tab-separated values (TSV) delimiter', () => {
    const csv = `email\tname\trole\ndiana@tech.org\tDiana Prince\tDesigner`;

    const res = parseCsvContacts(csv);
    expect(res.contacts.length).toBe(1);
    expect(res.contacts[0].email).toBe('diana@tech.org');
    expect(res.contacts[0].first_name).toBe('Diana Prince');
    expect(res.contacts[0].custom_fields.role).toBe('Designer');
  });

  it('deduplicates emails and ignores invalid or empty emails', () => {
    const csv = `email,nombre
valid1@test.com,Valido 1
invalid-email-address,Invalido
VALID1@test.com,Valido Duplicado Mayus
valid2@test.com,Valido 2
,Sin Correo`;

    const res = parseCsvContacts(csv);
    expect(res.contacts.length).toBe(2);
    expect(res.contacts.map((c) => c.email)).toEqual(['valid1@test.com', 'valid2@test.com']);
    expect(res.invalidCount).toBeGreaterThanOrEqual(2);
  });

  it('returns empty result when CSV is empty or header only', () => {
    expect(parseCsvContacts('').contacts.length).toBe(0);
    expect(parseCsvContacts('email,nombre').contacts.length).toBe(0);
  });
});
