import React from 'react';
import { 
  Box, 
  Heading1, 
  AlignLeft, 
  Image as ImageIcon, 
  MousePointerClick, 
  Minus, 
  MoveVertical, 
  Share2,
  Plus,
  Columns2,
  Table
} from 'lucide-react';
import YoutubeIcon from '../YoutubeIcon.jsx';

const BLOCK_TYPES = [
  {
    type: 'grid',
    name: 'Grid / 2 Columnas',
    description: 'Logo o imagen y texto en columnas responsivas lado a lado',
    icon: Columns2,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    defaultData: {
      layout: '30-70',
      verticalAlign: 'middle',
      gap: '16px',
      backgroundColor: 'transparent',
      borderRadius: '0px',
      paddingTop: '12px',
      paddingBottom: '12px',
      paddingLeft: '0px',
      paddingRight: '0px',
      leftType: 'image',
      leftImage: {
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        alt: 'Logo NovaTech',
        width: '90px',
        maxWidth: '110px',
        borderRadius: '8px',
        alignment: 'center',
        linkUrl: '',
      },
      leftText: {
        heading: '',
        content: '',
        color: '#334155',
        fontSize: '14px',
        alignment: 'left',
      },
      rightType: 'text',
      rightText: {
        heading: 'NovaTech Solutions',
        headingSize: '20px',
        headingColor: '#0f172a',
        content: 'Estimado colaborador, te damos una cordial bienvenida a nuestro equipo de trabajo.',
        textColor: '#475569',
        fontSize: '14px',
        lineHeight: '1.5',
        buttonText: '',
        buttonUrl: '',
        buttonBgColor: '#2563eb',
        buttonTextColor: '#ffffff',
        alignment: 'left',
      },
      rightImage: {
        url: '',
        alt: 'Imagen',
        width: '100%',
        maxWidth: '100%',
        borderRadius: '8px',
        alignment: 'center',
        linkUrl: '',
      },
    },
  },
  {
    type: 'table',
    name: 'Tabla Estilizada',
    description: 'Tabla de datos, credenciales o precios con estilos y celdas alternadas',
    icon: Table,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    defaultData: {
      theme: 'modern',
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
  },
  {
    type: 'youtube',
    name: 'Video de YouTube',
    description: 'Embebido con miniatura HD, badge de reproducción y botón directo',
    icon: YoutubeIcon,
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
    defaultData: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Aprende a Diseñar Mails con Video',
      caption: 'Haz clic en el reproductor para ver la guía completa en YouTube.',
      buttonText: 'Ver Video en YouTube ▶',
      cardBackground: '#0f172a',
      textColor: '#f8fafc',
      borderRadius: '12px',
      paddingTop: '16px',
      paddingBottom: '16px',
    },
  },
  {
    type: 'box',
    name: 'Caja / Contenedor',
    description: 'Contenedor estilizado con fondo, borde, radio y relleno',
    icon: Box,
    color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    defaultData: {
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      borderWidth: '1px',
      borderColor: '#e2e8f0',
      borderStyle: 'solid',
      paddingTop: '20px',
      paddingBottom: '20px',
      paddingLeft: '20px',
      paddingRight: '20px',
      children: [
        {
          id: `nested-heading-${Date.now()}`,
          type: 'heading',
          data: {
            content: 'Título dentro de la caja',
            fontSize: '18px',
            fontWeight: '700',
            color: '#0f172a',
            textAlign: 'left',
            paddingTop: '0px',
            paddingBottom: '4px',
          },
        },
        {
          id: `nested-text-${Date.now()}`,
          type: 'text',
          data: {
            content: 'Este es un texto dentro de un contenedor con fondo personalizado.',
            fontSize: '14px',
            fontWeight: '400',
            color: '#475569',
            textAlign: 'left',
            lineHeight: '1.5',
            paddingTop: '0px',
            paddingBottom: '0px',
          },
        },
      ],
    },
  },
  {
    type: 'heading',
    name: 'Encabezado / Título',
    description: 'Títulos llamativos con tipografía y color ajustable',
    icon: Heading1,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    defaultData: {
      content: 'Nuevo Encabezado Impactante',
      fontSize: '26px',
      fontWeight: '800',
      color: '#0f172a',
      textAlign: 'left',
      paddingTop: '12px',
      paddingBottom: '8px',
    },
  },
  {
    type: 'text',
    name: 'Párrafo de Texto',
    description: 'Cuerpo de texto con saltos de línea y negritas',
    icon: AlignLeft,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    defaultData: {
      content: 'Escribe aquí tu mensaje. Puedes resaltar ideas clave, añadir detalles y dar formato a tu contenido de forma clara y atractiva.',
      fontSize: '15px',
      fontWeight: '400',
      color: '#334155',
      textAlign: 'left',
      lineHeight: '1.6',
      paddingTop: '6px',
      paddingBottom: '12px',
    },
  },
  {
    type: 'image',
    name: 'Imagen',
    description: 'Banner, foto o ilustración con enlace opcional',
    icon: ImageIcon,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    defaultData: {
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80',
      alt: 'Imagen ilustrativa',
      width: '100%',
      maxWidth: '100%',
      alignment: 'center',
      borderRadius: '10px',
      linkUrl: '',
      paddingTop: '12px',
      paddingBottom: '12px',
    },
  },
  {
    type: 'button',
    name: 'Botón CTA',
    description: 'Botón de llamada a la acción con enlace directo',
    icon: MousePointerClick,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    defaultData: {
      text: 'Haz Clic Aquí',
      url: 'https://example.com',
      backgroundColor: '#536df3',
      textColor: '#ffffff',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      paddingX: '28px',
      paddingY: '12px',
      alignment: 'center',
      fullWidth: false,
    },
  },
  {
    type: 'divider',
    name: 'Línea Divisoria',
    description: 'Separador estético con color y grosor configurable',
    icon: Minus,
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    defaultData: {
      color: '#e2e8f0',
      thickness: '1px',
      style: 'solid',
      paddingTop: '16px',
      paddingBottom: '16px',
      width: '100%',
    },
  },
  {
    type: 'spacer',
    name: 'Espaciador',
    description: 'Espacio en blanco vertical para airear el contenido',
    icon: MoveVertical,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    defaultData: {
      height: '24px',
    },
  },
  {
    type: 'social',
    name: 'Redes Sociales',
    description: 'Iconos directos a YouTube, Twitter, Instagram, GitHub, etc.',
    icon: Share2,
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    defaultData: {
      alignment: 'center',
      youtube: 'https://youtube.com',
      twitter: 'https://twitter.com',
      instagram: 'https://instagram.com',
      github: 'https://github.com',
      paddingTop: '16px',
      paddingBottom: '16px',
    },
  },
];

export default function BlockPicker({ onAddBlock }) {
  return (
    <div className="p-3.5 space-y-3 select-none">
      <div>
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Modular Components
        </h3>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Add Content
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {BLOCK_TYPES.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => onAddBlock(item.type, item.defaultData)}
              className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-[#121826] hover:bg-[#182133] border border-[#1e283d] hover:border-brand-500/50 transition-all duration-150 active:scale-95 shadow-sm"
              title={item.description}
            >
              <div className={`p-2.5 rounded-xl border ${item.color} mb-2 transition-transform group-hover:scale-110 flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors text-center line-clamp-1">
                {item.name}
              </span>
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-3 h-3 text-brand-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
