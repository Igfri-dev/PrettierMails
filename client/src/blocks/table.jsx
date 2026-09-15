import React from 'react';
import { Table, Plus, Trash2, X } from 'lucide-react';
import { escapeHtml, renderFormattedText, formatTextContent, sanitizeColor, sanitizeCssValue } from './blockHelpers.jsx';
import { TableBlockDataSchema } from '../schemas/documentSchema.js';

export default {
  type: 'table',
  label: 'Tabla de Datos',
  category: 'layout',
  icon: Table,
  defaultData: {
    headers: ['Servicio / Recurso', 'Usuario / Identificador', 'Clave / Contraseña'],
    rows: [
      ['Red Wi-Fi Oficinas', 'NovaTech_Team', 'Segura2026*'],
      ['Correo Corporativo', 'usuario@novatech.io', 'Temporal#2026'],
      ['Portal de Empleados', 'novatech.io/portal', 'password'],
    ],
    headerBgColor: '#0f172a',
    headerTextColor: '#ffffff',
    rowBgColor: '#ffffff',
    altRowBgColor: '#f8fafc',
    textColor: '#334155',
    borderColor: '#e2e8f0',
    borderWidth: '1px',
    borderRadius: '12px',
    cellPadding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    headerFontSize: '13px',
    headerFontWeight: '700',
    paddingTop: '14px',
    paddingBottom: '14px',
    striped: true,
  },
  schema: TableBlockDataSchema,

  render({ data = {} }) {
    const headers = data.headers || ['Columna 1', 'Columna 2', 'Columna 3'];
    const rows = data.rows || [
      ['Dato 1', 'Dato 2', 'Dato 3'],
      ['Dato 4', 'Dato 5', 'Dato 6'],
    ];
    const striped = data.striped !== false;

    return (
      <div
        style={{
          paddingTop: data.paddingTop || '14px',
          paddingBottom: data.paddingBottom || '14px',
        }}
      >
        <div
          style={{
            borderRadius: data.borderRadius || '12px',
            border: `${data.borderWidth || '1px'} solid ${data.borderColor || '#e2e8f0'}`,
            overflow: 'hidden',
            backgroundColor: data.rowBgColor || '#ffffff',
          }}
          className="shadow-sm overflow-x-auto"
        >
          <table className="w-full text-left border-collapse" style={{ fontSize: data.fontSize || '13px' }}>
            <thead>
              <tr style={{ backgroundColor: data.headerBgColor || '#0f172a' }}>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: data.cellPadding || '12px 16px',
                      color: data.headerTextColor || '#ffffff',
                      fontWeight: data.headerFontWeight || '700',
                      fontSize: data.headerFontSize || '13px',
                      borderBottom: `${data.borderWidth || '1px'} solid ${data.borderColor || '#e2e8f0'}`,
                      textAlign: data.textAlign || 'left',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => {
                const bg =
                  striped && rIdx % 2 === 1
                    ? data.altRowBgColor || '#f8fafc'
                    : data.rowBgColor || '#ffffff';
                const isLast = rIdx === rows.length - 1;

                return (
                  <tr key={rIdx} style={{ backgroundColor: bg }}>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        style={{
                          padding: data.cellPadding || '12px 16px',
                          color: data.textColor || '#334155',
                          borderBottom: isLast
                            ? 'none'
                            : `${data.borderWidth || '1px'} solid ${data.borderColor || '#e2e8f0'}`,
                          textAlign: data.textAlign || 'left',
                          lineHeight: '1.5',
                        }}
                      >
                        {renderFormattedText(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  },

  compileHtml(block) {
    const {
      headers = ['Servicio / Recurso', 'Usuario / Identificador', 'Clave / Contraseña'],
      rows = [
        ['Red Wi-Fi Oficinas', 'NovaTech_Team', 'Segura2026*'],
        ['Correo Corporativo', 'usuario@novatech.io', 'Temporal#2026'],
        ['Portal de Empleados', 'novatech.io/portal', 'password'],
      ],
      headerBgColor = '#0f172a',
      headerTextColor = '#ffffff',
      rowBgColor = '#ffffff',
      altRowBgColor = '#f8fafc',
      textColor = '#334155',
      borderColor = '#e2e8f0',
      borderWidth = '1px',
      borderRadius = '12px',
      cellPadding = '12px 16px',
      textAlign = 'left',
      fontSize = '13px',
      headerFontSize = '13px',
      headerFontWeight = '700',
      paddingTop = '14px',
      paddingBottom = '14px',
      striped = true,
    } = block.data || {};

    const tableHeadersHtml = headers
      .map(
        (h) => `
        <th align="${escapeHtml(textAlign)}" style="padding: ${sanitizeCssValue(cellPadding, '12px 16px')}; color: ${sanitizeColor(headerTextColor, '#ffffff')}; font-size: ${sanitizeCssValue(headerFontSize, '13px')}; font-weight: ${sanitizeCssValue(headerFontWeight, '700')}; border-bottom: ${sanitizeCssValue(borderWidth, '1px')} solid ${sanitizeColor(borderColor, '#e2e8f0')}; font-family: inherit; text-align: ${escapeHtml(textAlign)};">
          ${escapeHtml(h)}
        </th>
      `
      )
      .join('');

    const tableRowsHtml = rows
      .map((row, rIdx) => {
        const bg =
          striped && rIdx % 2 === 1
            ? sanitizeColor(altRowBgColor, '#f8fafc')
            : sanitizeColor(rowBgColor, '#ffffff');
        const isLast = rIdx === rows.length - 1;
        const borderBottomCss = isLast
          ? ''
          : `border-bottom: ${sanitizeCssValue(borderWidth, '1px')} solid ${sanitizeColor(borderColor, '#e2e8f0')};`;

        const cellsHtml = row
          .map(
            (cell) => `
          <td align="${escapeHtml(textAlign)}" style="padding: ${sanitizeCssValue(cellPadding, '12px 16px')}; color: ${sanitizeColor(textColor, '#334155')}; ${borderBottomCss} font-family: inherit; font-size: ${sanitizeCssValue(fontSize, '13px')}; line-height: 1.5; text-align: ${escapeHtml(textAlign)};">
            ${formatTextContent(cell)}
          </td>
        `
          )
          .join('');

        return `
          <tr style="background-color: ${bg};" bgcolor="${bg}">
            ${cellsHtml}
          </tr>
        `;
      })
      .join('');

    return `
        <tr>
          <td style="padding-top: ${sanitizeCssValue(paddingTop, '14px')}; padding-bottom: ${sanitizeCssValue(paddingBottom, '14px')};">
            <!-- Styled Email Data Table -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="responsive-table" style="border-collapse: separate !important; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: ${sanitizeCssValue(borderWidth, '1px')} solid ${sanitizeColor(borderColor, '#e2e8f0')}; border-radius: ${sanitizeCssValue(borderRadius, '12px')}; -webkit-border-radius: ${sanitizeCssValue(borderRadius, '12px')}; overflow: hidden; background-color: ${sanitizeColor(rowBgColor, '#ffffff')}; font-size: ${sanitizeCssValue(fontSize, '13px')}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);">
              <thead>
                <tr style="background-color: ${sanitizeColor(headerBgColor, '#0f172a')};" bgcolor="${sanitizeColor(headerBgColor, '#0f172a')}">
                  ${tableHeadersHtml}
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </td>
        </tr>
    `;
  },

  inspector({ data = {}, update, onUpdate }) {
    const handleUpdate = (partial) => {
      if (onUpdate) onUpdate(partial);
      if (update) {
        Object.entries(partial).forEach(([k, v]) => update(k, v));
      }
    };
    const headers = data.headers || ['Columna 1', 'Columna 2', 'Columna 3'];
    const rows = data.rows || [
      ['Dato 1', 'Dato 2', 'Dato 3'],
      ['Dato 4', 'Dato 5', 'Dato 6'],
    ];

    const applyTableTheme = (themeName) => {
      if (themeName === 'modern-slate') {
        handleUpdate({
          headerBgColor: '#0f172a',
          headerTextColor: '#ffffff',
          rowBgColor: '#ffffff',
          altRowBgColor: '#f8fafc',
          textColor: '#334155',
          borderColor: '#e2e8f0',
          striped: true,
        });
      } else if (themeName === 'blue-pro') {
        handleUpdate({
          headerBgColor: '#1e40af',
          headerTextColor: '#ffffff',
          rowBgColor: '#ffffff',
          altRowBgColor: '#eff6ff',
          textColor: '#1e293b',
          borderColor: '#bfdbfe',
          striped: true,
        });
      } else if (themeName === 'emerald') {
        handleUpdate({
          headerBgColor: '#065f46',
          headerTextColor: '#ffffff',
          rowBgColor: '#ffffff',
          altRowBgColor: '#ecfdf5',
          textColor: '#064e3b',
          borderColor: '#a7f3d0',
          striped: true,
        });
      } else if (themeName === 'minimal') {
        handleUpdate({
          headerBgColor: '#f8fafc',
          headerTextColor: '#0f172a',
          rowBgColor: '#ffffff',
          altRowBgColor: '#ffffff',
          textColor: '#334155',
          borderColor: '#e2e8f0',
          striped: false,
        });
      }
    };

    const addTableColumn = () => {
      const newHeaders = [...headers, `Columna ${headers.length + 1}`];
      const newRows = rows.map((r) => [...r, '']);
      handleUpdate({ headers: newHeaders, rows: newRows });
    };

    const removeTableColumn = (colIdx) => {
      if (headers.length <= 1) return;
      const newHeaders = headers.filter((_, i) => i !== colIdx);
      const newRows = rows.map((r) => r.filter((_, i) => i !== colIdx));
      handleUpdate({ headers: newHeaders, rows: newRows });
    };

    const addTableRow = () => {
      const colCount = headers.length || 2;
      const newRow = new Array(colCount).fill('');
      handleUpdate({ rows: [...rows, newRow] });
    };

    const removeTableRow = (rowIdx) => {
      if (rows.length <= 1) return;
      const newRows = rows.filter((_, i) => i !== rowIdx);
      handleUpdate({ rows: newRows });
    };

    const updateTableHeader = (colIdx, val) => {
      const newHeaders = [...headers];
      newHeaders[colIdx] = val;
      handleUpdate({ headers: newHeaders });
    };

    const updateTableCell = (rowIdx, colIdx, val) => {
      const newRows = rows.map((row, r) => {
        if (r === rowIdx) {
          const copy = [...row];
          copy[colIdx] = val;
          return copy;
        }
        return row;
      });
      handleUpdate({ rows: newRows });
    };

    return (
      <div className="space-y-4">
        {/* Quick Theme Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            Estilos y Temas de Tabla
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'modern-slate', label: 'Moderno Slate' },
              { id: 'blue-pro', label: 'Azul Pro' },
              { id: 'emerald', label: 'Esmeralda' },
              { id: 'minimal', label: 'Minimalista' },
            ].map((thm) => (
              <button
                key={thm.id}
                type="button"
                onClick={() => applyTableTheme(thm.id)}
                className="px-2 py-1.5 rounded text-[11px] font-medium border bg-slate-950 text-slate-300 border-slate-800 hover:border-brand-500 hover:text-white transition text-left truncate"
              >
                {thm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column & Row Management Actions */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            type="button"
            onClick={addTableRow}
            className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Fila</span>
          </button>
          <button
            type="button"
            onClick={addTableColumn}
            className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Columna</span>
          </button>
        </div>

        {/* Headers Editor */}
        <div className="space-y-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <span className="text-xs font-bold text-cyan-400">Cabeceras de la Tabla</span>
          <div className="space-y-1.5">
            {headers.map((header, idx) => (
              <div key={idx} className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-500 font-mono w-4">{idx + 1}</span>
                <input
                  type="text"
                  value={header}
                  onChange={(e) => updateTableHeader(idx, e.target.value)}
                  placeholder={`Columna ${idx + 1}`}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                />
                {headers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTableColumn(idx)}
                    title="Eliminar columna"
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rows & Cells Editor */}
        <div className="space-y-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <span className="text-xs font-bold text-cyan-400">Filas y Contenido</span>
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {rows.map((row, rIdx) => (
              <div key={rIdx} className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Fila {rIdx + 1}</span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTableRow(rIdx)}
                      title="Eliminar fila"
                      className="text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {row.map((cell, cIdx) => (
                    <input
                      key={cIdx}
                      type="text"
                      value={cell}
                      onChange={(e) => updateTableCell(rIdx, cIdx, e.target.value)}
                      placeholder={headers[cIdx] || `Celda ${cIdx + 1}`}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Styling Options */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">Filas Alternadas (Cebra)</label>
            <input
              type="checkbox"
              checked={data.striped !== false}
              onChange={(e) => handleUpdate({ striped: e.target.checked })}
              className="rounded border-slate-700 text-brand-500 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Fondo Cabecera</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={data.headerBgColor || '#0f172a'}
                  onChange={(e) => handleUpdate({ headerBgColor: e.target.value })}
                  className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-[10px] text-slate-400 truncate">
                  {data.headerBgColor || '#0f172a'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Borde de Tabla</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={data.borderColor || '#e2e8f0'}
                  onChange={(e) => handleUpdate({ borderColor: e.target.value })}
                  className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-[10px] text-slate-400 truncate">
                  {data.borderColor || '#e2e8f0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
