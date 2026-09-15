import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Users,
  ListFilter,
  UploadCloud,
  Code,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Check,
  Copy,
  Mail,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  importCsvContacts,
  listContactLists,
  createContactList,
  deleteContactList,
  addMembersToList,
} from '../../services/contactApi.js';
import useAuthStore from '../../store/authStore.js';

export default function ContactsModal({ isOpen, onClose }) {
  const currentWorkspace = useAuthStore((state) => state.currentWorkspace);

  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'lists' | 'import' | 'tags'
  const [contacts, setContacts] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedListFilter, setSelectedListFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New/Edit Contact Form State
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactIdToEdit, setContactIdToEdit] = useState(null);
  const [contactForm, setContactForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    isSubscribed: true,
    targetListId: '',
    customFieldsText: '',
  });

  // Manage List Members Modal State
  const [managingList, setManagingList] = useState(null);
  const [selectedContactIdsForList, setSelectedContactIdsForList] = useState([]);
  const [isSavingListMembers, setIsSavingListMembers] = useState(false);

  // New List Form State
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [listForm, setListForm] = useState({
    name: '',
    description: '',
  });

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [csvTargetListId, setCsvTargetListId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Copied tag helper
  const [copiedTag, setCopiedTag] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedTag(text);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const loadData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const [contactsData, listsData] = await Promise.all([
        listContacts({
          search: searchQuery.trim() || undefined,
          listId: selectedListFilter || undefined,
        }),
        listContactLists(),
      ]);

      setContacts(contactsData);
      setLists(listsData);
    } catch (err) {
      setErrorMsg(err.message || 'Error cargando datos de contactos.');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, searchQuery, selectedListFilter]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  // Handle Contact Save
  const handleSaveContact = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    let parsedCustomFields = {};
    if (contactForm.customFieldsText.trim()) {
      try {
        parsedCustomFields = JSON.parse(contactForm.customFieldsText);
      } catch {
        setErrorMsg('El formato de campos personalizados debe ser un JSON válido (ej: {"empresa": "Acme"}).');
        return;
      }
    }

    try {
      if (isEditingContact && contactIdToEdit) {
        await updateContact(contactIdToEdit, {
          firstName: contactForm.firstName,
          lastName: contactForm.lastName,
          isSubscribed: contactForm.isSubscribed,
          customFields: parsedCustomFields,
        });
        if (contactForm.targetListId) {
          await addMembersToList(contactForm.targetListId, [contactIdToEdit]);
        }
        setSuccessMsg('Contacto actualizado con éxito.');
      } else {
        await createContact({
          email: contactForm.email,
          firstName: contactForm.firstName,
          lastName: contactForm.lastName,
          isSubscribed: contactForm.isSubscribed,
          customFields: parsedCustomFields,
          listId: contactForm.targetListId || undefined,
        });
        setSuccessMsg('Contacto registrado con éxito.');
      }

      setIsEditingContact(false);
      setContactIdToEdit(null);
      setContactForm({
        email: '',
        firstName: '',
        lastName: '',
        isSubscribed: true,
        targetListId: '',
        customFieldsText: '',
      });
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error guardando contacto.');
    }
  };

  // Open Edit Form
  const handleOpenEdit = (contact) => {
    setContactIdToEdit(contact.id);
    setContactForm({
      email: contact.email,
      firstName: contact.first_name || '',
      lastName: contact.last_name || '',
      isSubscribed: contact.is_subscribed !== false,
      targetListId: contact.lists?.[0]?.id || '',
      customFieldsText: contact.custom_fields && Object.keys(contact.custom_fields).length > 0
        ? JSON.stringify(contact.custom_fields, null, 2)
        : '',
    });
    setIsEditingContact(true);
  };

  // Open Manage Members for a List
  const handleOpenManageMembers = (list) => {
    setManagingList(list);
    const existingMemberIds = (contacts || [])
      .filter((c) => c.lists?.some((lst) => lst.id === list.id))
      .map((c) => c.id);
    setSelectedContactIdsForList(existingMemberIds);
  };

  // Save Members to List
  const handleSaveListMembers = async () => {
    if (!managingList) return;
    setIsSavingListMembers(true);
    try {
      if (selectedContactIdsForList.length > 0) {
        await addMembersToList(managingList.id, selectedContactIdsForList);
      }
      setSuccessMsg(`Lista "${managingList.name}" actualizada con éxito.`);
      setManagingList(null);
      setSelectedContactIdsForList([]);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al actualizar miembros de la lista.');
    } finally {
      setIsSavingListMembers(false);
    }
  };

  // Delete Contact
  const handleDeleteContact = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este contacto?')) return;
    try {
      await deleteContact(id);
      setSuccessMsg('Contacto eliminado.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar contacto.');
    }
  };

  // Create List
  const handleCreateList = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createContactList(listForm);
      setSuccessMsg('Lista de contactos creada.');
      setIsCreatingList(false);
      setListForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error creando lista.');
    }
  };

  // Delete List
  const handleDeleteList = async (id) => {
    if (!window.confirm('¿Eliminar esta lista de contactos? Los contactos asociados se conservarán.')) return;
    try {
      await deleteContactList(id);
      setSuccessMsg('Lista eliminada.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error eliminando lista.');
    }
  };

  // CSV File Handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result || '');
    };
    reader.readAsText(file);
  };

  // Process CSV Import
  const handleProcessCsv = async () => {
    if (!csvContent.trim()) {
      setErrorMsg('Por favor carga un archivo CSV o escribe contenido.');
      return;
    }

    setIsImporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setImportResult(null);

    try {
      const res = await importCsvContacts({
        csvText: csvContent,
        targetListId: csvTargetListId || null,
      });

      setImportResult(res);
      setSuccessMsg(`Importación completada: ${res.createdCount} nuevos, ${res.updatedCount} actualizados.`);
      setCsvContent('');
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el archivo CSV.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Contactos y Listas de Audiencia
              </h2>
              <p className="text-xs text-slate-500">
                Espacio: <span className="font-semibold text-slate-700">{currentWorkspace?.name || 'Workspace'}</span> • Personalización y segmentación de campañas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-sm font-medium bg-white">
          <button
            onClick={() => {
              setActiveTab('contacts');
              setIsEditingContact(false);
            }}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'contacts'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Contactos ({contacts.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('lists');
              setIsCreatingList(false);
            }}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'lists'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Listas ({lists.length})
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Importar CSV
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'tags'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code className="w-4 h-4" />
            Variables de Personalización
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 font-bold">×</button>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600 font-bold">×</button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              {/* Top Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <div className="relative w-full max-w-xs">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por email o nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <select
                    value={selectedListFilter}
                    onChange={(e) => setSelectedListFilter(e.target.value)}
                    className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todas las listas</option>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setIsEditingContact(!isEditingContact);
                    setContactIdToEdit(null);
                    setContactForm({
                      email: '',
                      firstName: '',
                      lastName: '',
                      isSubscribed: true,
                      targetListId: selectedListFilter || '',
                      customFieldsText: '',
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  {isEditingContact ? 'Cerrar Formulario' : 'Nuevo Contacto'}
                </button>
              </div>

              {/* Form Inline */}
              {isEditingContact && (
                <form
                  onSubmit={handleSaveContact}
                  className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm space-y-3"
                >
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {contactIdToEdit ? 'Editar Contacto' : 'Registrar Nuevo Contacto'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        disabled={!!contactIdToEdit}
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="usuario@ejemplo.com"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={contactForm.firstName}
                        onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                        placeholder="Ana"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Apellido</label>
                      <input
                        type="text"
                        value={contactForm.lastName}
                        onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                        placeholder="García"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Asignar a Lista (Opcional)
                      </label>
                      <select
                        value={contactForm.targetListId}
                        onChange={(e) => setContactForm({ ...contactForm, targetListId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">Sin lista específica (Contacto general)</option>
                        {lists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Campos Personalizados (JSON)
                      </label>
                      <input
                        type="text"
                        value={contactForm.customFieldsText}
                        onChange={(e) => setContactForm({ ...contactForm, customFieldsText: e.target.value })}
                        placeholder='{"empresa": "Tech SA", "ciudad": "Madrid"}'
                        className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="isSubscribed"
                        checked={contactForm.isSubscribed}
                        onChange={(e) => setContactForm({ ...contactForm, isSubscribed: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="isSubscribed" className="text-xs text-slate-700 font-medium">
                        Suscrito a envíos (activo)
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingContact(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                    >
                      {contactIdToEdit ? 'Guardar Cambios' : 'Registrar'}
                    </button>
                  </div>
                </form>
              )}

              {/* Contacts Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {isLoading ? (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="text-xs">Cargando contactos...</span>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Users className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No se encontraron contactos</p>
                    <p className="text-xs text-slate-400">
                      Agrega contactos manualmente o impórtalos en lote con un archivo CSV.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Contacto</th>
                        <th className="py-2.5 px-4">Nombre Completo</th>
                        <th className="py-2.5 px-4">Listas</th>
                        <th className="py-2.5 px-4">Variables / Campos</th>
                        <th className="py-2.5 px-4">Estado</th>
                        <th className="py-2.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contacts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2 font-medium text-slate-800">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {c.email}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">
                            {c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : '—'}
                          </td>
                          <td className="py-2.5 px-4">
                            {c.lists && c.lists.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {c.lists.map((lst) => (
                                  <span
                                    key={lst.id}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  >
                                    {lst.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {c.custom_fields && Object.keys(c.custom_fields).length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {Object.entries(c.custom_fields).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono"
                                  >
                                    {k}: {String(v)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {c.is_subscribed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <UserCheck className="w-3 h-3" /> Suscrito
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <UserX className="w-3 h-3" /> Desuscrito
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEdit(c)}
                                title="Editar contacto"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(c.id)}
                                title="Eliminar contacto"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LISTS */}
          {activeTab === 'lists' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Listas de Audiencia y Segmentos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crea listas para agrupar contactos y enviar campañas masivas segmentadas
                  </p>
                </div>

                <button
                  onClick={() => setIsCreatingList(!isCreatingList)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {isCreatingList ? 'Cerrar' : 'Nueva Lista'}
                </button>
              </div>

              {isCreatingList && (
                <form
                  onSubmit={handleCreateList}
                  className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm space-y-3"
                >
                  <h4 className="text-xs font-bold text-slate-800">Crear Lista de Correo</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Nombre de la lista *</label>
                      <input
                        type="text"
                        required
                        value={listForm.name}
                        onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                        placeholder="Ej: Clientes VIP, Newsletter Semanal"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={listForm.description}
                        onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                        placeholder="Breve descripción del público objetivo"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingList(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                    >
                      Guardar Lista
                    </button>
                  </div>
                </form>
              )}

              {/* Lists Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lists.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                          <ListFilter className="w-4 h-4 text-indigo-600" />
                          {l.name}
                        </h4>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                          {l.memberCount || 0} miembros
                        </span>
                      </div>
                      {l.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{l.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedListFilter(l.id);
                            setActiveTab('contacts');
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Ver contactos →
                        </button>
                        <button
                          onClick={() => handleOpenManageMembers(l)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Añadir miembros
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteList(l.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                        title="Eliminar lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {lists.length === 0 && (
                  <div className="col-span-2 py-8 text-center text-slate-400">
                    <ListFilter className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs">No hay listas creadas en este espacio de trabajo.</p>
                  </div>
                )}
              </div>

              {/* Manage Members Modal */}
              {managingList && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <ListFilter className="w-4 h-4 text-indigo-600" />
                        Añadir Contactos a "{managingList.name}"
                      </h4>
                      <button
                        onClick={() => setManagingList(null)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500">
                      Selecciona los contactos de tu espacio que deseas asociar a esta lista:
                    </p>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg p-1">
                      {contacts.map((c) => {
                        const isAlreadyMember = c.lists?.some((lst) => lst.id === managingList.id);
                        const isChecked = selectedContactIdsForList.includes(c.id) || isAlreadyMember;
                        return (
                          <label
                            key={c.id}
                            className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isAlreadyMember}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedContactIdsForList((prev) => [...prev, c.id]);
                                } else {
                                  setSelectedContactIdsForList((prev) => prev.filter((id) => id !== c.id));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-800 truncate">{c.email}</div>
                              {(c.first_name || c.last_name) && (
                                <div className="text-[11px] text-slate-400">
                                  {c.first_name} {c.last_name}
                                </div>
                              )}
                            </div>
                            {isAlreadyMember && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                Ya en lista
                              </span>
                            )}
                          </label>
                        );
                      })}
                      {contacts.length === 0 && (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          No tienes contactos en este espacio de trabajo.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setManagingList(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        disabled={selectedContactIdsForList.length === 0 || isSavingListMembers}
                        onClick={handleSaveListMembers}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isSavingListMembers && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Añadir Seleccionados ({selectedContactIdsForList.length})
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IMPORT CSV */}
          {activeTab === 'import' && (
            <div className="space-y-4 max-w-2xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Importador Inteligente de Contactos (CSV)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Soporta detección automática de delimitador (, ; tabulación), mapeo de columnas en español e inglés
                  (email, correo, nombre, apellido) y campos adicionales convertidos automáticamente a variables.
                </p>
              </div>

              {/* Target List Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asignar contactos importados a una lista (Opcional):
                </label>
                <select
                  value={csvTargetListId}
                  onChange={(e) => setCsvTargetListId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No asignar a ninguna lista específica</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload / Drag & Drop */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                <UploadCloud className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
                <label className="cursor-pointer">
                  <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                    Selecciona un archivo CSV
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">o pega el texto CSV directamente abajo</p>
              </div>

              {/* CSV Text Area */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contenido CSV:</label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder={`email,nombre,apellido,empresa\nana@ejemplo.com,Ana,García,Acme Corp\ncarlos@empresa.es,Carlos,Ruiz,Innovar SL`}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  {csvContent.trim() ? `${csvContent.trim().split('\n').length - 1} líneas detectadas` : 'Vacío'}
                </span>
                <button
                  onClick={handleProcessCsv}
                  disabled={isImporting || !csvContent.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Procesar e Importar
                    </>
                  )}
                </button>
              </div>

              {/* Result Summary */}
              {importResult && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="font-semibold text-slate-800">Resumen de Importación:</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                      +{importResult.createdCount} Creados
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                      ↻ {importResult.updatedCount} Actualizados
                    </div>
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg font-medium">
                      {importResult.invalidCount || 0} Inválidos
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PERSONALIZATION GUIDE */}
          {activeTab === 'tags' && (
            <div className="space-y-6 max-w-3xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-600" />
                  Variables de Personalización Dinámica (Merge Tags)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Usa estas etiquetas en el Asunto (Subject) o en cualquier bloque de texto de tus correos.
                  Se reemplazarán automáticamente por los datos individuales de cada destinatario.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    tag: '{{first_name}}',
                    desc: 'Nombre de pila del contacto.',
                    example: 'Hola {{first_name}}, bienvenido a bordo.',
                  },
                  {
                    tag: '{{first_name|Estimado/a cliente}}',
                    desc: 'Con valor de respaldo (fallback) por si el contacto no tiene nombre registrado.',
                    example: '¡Hola {{first_name|amigo/a}}!',
                  },
                  {
                    tag: '{{last_name}}',
                    desc: 'Apellido del contacto.',
                    example: 'Señor/a {{last_name}}.',
                  },
                  {
                    tag: '{{name}}',
                    desc: 'Nombre completo (combina first_name y last_name).',
                    example: 'Emitido a {{name}}.',
                  },
                  {
                    tag: '{{email}}',
                    desc: 'Dirección de correo electrónico del destinatario.',
                    example: 'Mensaje enviado a {{email}}.',
                  },
                  {
                    tag: '{{custom.empresa}}',
                    desc: 'Cualquier campo personalizado cargado en el CSV o formulario.',
                    example: 'Noticias para el equipo de {{custom.empresa|tu empresa}}.',
                  },
                ].map((item) => (
                  <div
                    key={item.tag}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {item.tag}
                        </code>
                        <span className="text-xs text-slate-600 font-medium">{item.desc}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic">Ejemplo: {item.example}</p>
                    </div>

                    <button
                      onClick={() => copyToClipboard(item.tag)}
                      className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 rounded-lg text-xs font-medium transition-colors shrink-0 self-start sm:self-auto"
                    >
                      {copiedTag === item.tag ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Seguridad y Sanitización XSS Automática
                </span>
                <p className="text-indigo-700">
                  PrettierMails sanitiza y codifica automáticamente todos los valores HTML para prevenir cualquier
                  intento de inyección de código maligno (XSS) desde archivos CSV externos o entradas de usuario.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
