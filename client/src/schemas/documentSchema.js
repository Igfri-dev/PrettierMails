import { z } from 'zod';

// Color regex supporting hex, rgb/rgba, transparent, inherit, named CSS colors
const COLOR_REGEX = /^(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|transparent|inherit|[a-zA-Z]+)$/;

export const ColorSchema = z.string().trim().refine(
  (val) => !val || COLOR_REGEX.test(val),
  { message: 'Color no válido (se requiere hex, rgb/rgba, transparent o nombre CSS)' }
);

export const SafeUrlSchema = z.string().trim().refine(
  (val) => !val || /^(https?:|mailto:|tel:|\/|#)/i.test(val),
  { message: 'URL insegura o protocolo no permitido' }
);

export const AlignmentSchema = z.enum(['left', 'center', 'right', 'justify']).default('left');
export const BorderStyleSchema = z.enum(['solid', 'dashed', 'dotted', 'double', 'none']).default('solid');

// Base child block schema (for nesting inside Box)
const BaseBlockSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.record(z.any()).default({}),
}).passthrough();

// Box Block Schema with nested children support
export const BoxBlockDataSchema = z.object({
  backgroundColor: ColorSchema.default('#f8fafc'),
  borderRadius: z.string().default('14px'),
  borderWidth: z.string().default('1px'),
  borderColor: ColorSchema.default('#e2e8f0'),
  borderStyle: BorderStyleSchema.default('solid'),
  borderLeftColor: ColorSchema.optional(),
  borderLeftWidth: z.string().default('4px'),
  boxShadow: z.string().optional(),
  paddingTop: z.string().default('20px'),
  paddingBottom: z.string().default('20px'),
  paddingLeft: z.string().default('24px'),
  paddingRight: z.string().default('24px'),
  children: z.array(BaseBlockSchema).default([]),
}).passthrough();

export const HeadingBlockDataSchema = z.object({
  content: z.string().default('Encabezado'),
  fontSize: z.string().default('26px'),
  fontWeight: z.string().default('700'),
  color: ColorSchema.default('#0f172a'),
  textAlign: AlignmentSchema.default('left'),
  paddingTop: z.string().default('12px'),
  paddingBottom: z.string().default('12px'),
}).passthrough();

export const TextBlockDataSchema = z.object({
  content: z.string().default('Escribe aquí tu texto...'),
  fontSize: z.string().default('15px'),
  fontWeight: z.string().default('400'),
  color: ColorSchema.default('#334155'),
  textAlign: AlignmentSchema.default('left'),
  lineHeight: z.string().default('1.6'),
  paddingTop: z.string().default('8px'),
  paddingBottom: z.string().default('8px'),
}).passthrough();

export const ImageBlockDataSchema = z.object({
  url: SafeUrlSchema.default(''),
  alt: z.string().default('Imagen'),
  width: z.string().default('100%'),
  maxWidth: z.string().default('100%'),
  alignment: AlignmentSchema.default('center'),
  borderRadius: z.string().default('8px'),
  linkUrl: SafeUrlSchema.optional().default(''),
  paddingTop: z.string().default('12px'),
  paddingBottom: z.string().default('12px'),
}).passthrough();

export const ButtonBlockDataSchema = z.object({
  text: z.string().default('Hacer clic aquí'),
  url: SafeUrlSchema.default('https://example.com'),
  backgroundColor: ColorSchema.default('#2563eb'),
  textColor: ColorSchema.default('#ffffff'),
  borderRadius: z.string().default('12px'),
  fontSize: z.string().default('15px'),
  fontWeight: z.string().default('700'),
  paddingX: z.string().default('32px'),
  paddingY: z.string().default('14px'),
  alignment: AlignmentSchema.default('center'),
  fullWidth: z.boolean().default(false),
  boxShadow: z.string().optional(),
  letterSpacing: z.string().optional(),
}).passthrough();

export const YoutubeBlockDataSchema = z.object({
  url: SafeUrlSchema.default('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  title: z.string().default(''),
  caption: z.string().default(''),
  buttonText: z.string().default('Ver en YouTube ▶'),
  cardBackground: ColorSchema.default('#0f172a'),
  textColor: ColorSchema.default('#f8fafc'),
  borderRadius: z.string().default('12px'),
  paddingTop: z.string().default('16px'),
  paddingBottom: z.string().default('16px'),
}).passthrough();

export const DividerBlockDataSchema = z.object({
  color: ColorSchema.default('#e2e8f0'),
  thickness: z.string().default('1px'),
  style: BorderStyleSchema.default('solid'),
  paddingTop: z.string().default('16px'),
  paddingBottom: z.string().default('16px'),
  width: z.string().default('100%'),
}).passthrough();

export const SpacerBlockDataSchema = z.object({
  height: z.string().default('24px'),
}).passthrough();

export const SocialBlockDataSchema = z.object({
  alignment: AlignmentSchema.default('center'),
  facebook: SafeUrlSchema.optional().default(''),
  twitter: SafeUrlSchema.optional().default(''),
  instagram: SafeUrlSchema.optional().default(''),
  linkedin: SafeUrlSchema.optional().default(''),
  youtube: SafeUrlSchema.optional().default(''),
  github: SafeUrlSchema.optional().default(''),
  paddingTop: z.string().default('16px'),
  paddingBottom: z.string().default('16px'),
}).passthrough();

export const GridBlockDataSchema = z.object({
  layout: z.string().default('30-70'),
  verticalAlign: z.enum(['top', 'middle', 'bottom']).default('middle'),
  gap: z.string().default('16px'),
  backgroundColor: ColorSchema.default('transparent'),
  borderRadius: z.string().default('0px'),
  borderWidth: z.string().default('0px'),
  borderColor: ColorSchema.default('transparent'),
  borderStyle: BorderStyleSchema.default('solid'),
  paddingTop: z.string().default('12px'),
  paddingBottom: z.string().default('12px'),
  paddingLeft: z.string().default('0px'),
  paddingRight: z.string().default('0px'),
  leftType: z.enum(['image', 'text']).default('image'),
  leftImage: z.record(z.any()).optional().default({}),
  leftText: z.record(z.any()).optional().default({}),
  rightType: z.enum(['image', 'text']).default('text'),
  rightText: z.record(z.any()).optional().default({}),
  rightImage: z.record(z.any()).optional().default({}),
}).passthrough();

export const TableBlockDataSchema = z.object({
  headers: z.array(z.string()).default([]),
  rows: z.array(z.array(z.string())).default([]),
  headerBgColor: ColorSchema.default('#0f172a'),
  headerTextColor: ColorSchema.default('#ffffff'),
  rowBgColor: ColorSchema.default('#ffffff'),
  altRowBgColor: ColorSchema.default('#f8fafc'),
  textColor: ColorSchema.default('#334155'),
  borderColor: ColorSchema.default('#e2e8f0'),
  borderWidth: z.string().default('1px'),
  borderRadius: z.string().default('12px'),
  cellPadding: z.string().default('12px 16px'),
  textAlign: AlignmentSchema.default('left'),
  fontSize: z.string().default('13px'),
  headerFontSize: z.string().default('13px'),
  headerFontWeight: z.string().default('700'),
  paddingTop: z.string().default('14px'),
  paddingBottom: z.string().default('14px'),
  striped: z.boolean().default(true),
}).passthrough();

export const BlockSchema = z.object({
  id: z.string().min(1, 'El identificador del bloque es obligatorio'),
  type: z.enum([
    'heading',
    'text',
    'box',
    'image',
    'button',
    'youtube',
    'divider',
    'spacer',
    'social',
    'grid',
    'table',
  ]),
  data: z.record(z.any()).default({}),
}).passthrough();

export const GlobalSettingsSchema = z.object({
  backgroundColor: ColorSchema.default('#f1f5f9'),
  contentBackgroundColor: ColorSchema.default('#ffffff'),
  contentWidth: z.string().default('600px'),
  borderRadius: z.string().default('16px'),
  fontFamily: z.string().default("'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"),
  textColor: ColorSchema.default('#1e293b'),
  padding: z.string().default('32px'),
}).passthrough();

export const PrettierMailsDocumentSchema = z.object({
  subject: z.string().default(''),
  previewText: z.string().optional().default(''),
  globalSettings: GlobalSettingsSchema.default(() => GlobalSettingsSchema.parse({})),
  blocks: z.array(BlockSchema).default([]),
  prettierMailsVersion: z.string().optional().default('1.0'),
  exportedAt: z.string().optional(),
}).passthrough();

/**
 * Validates and safely coerces an email document object.
 */
export function validateEmailDocument(doc) {
  return PrettierMailsDocumentSchema.safeParse(doc);
}
