"use client";

import { useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface TinyMCEEditorProps {
  value?: string;
  onEditorChange?: (content: string) => void;
  height?: number | string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  toolbar?: string;
  menubar?: boolean | string;
  plugins?: string[];
  initOptions?: Record<string, any>;
}

export default function TinyMCEEditor({
  value = '',
  onEditorChange,
  height = 400,
  placeholder = 'Start writing...',
  disabled = false,
  className = '',
  toolbar,
  menubar = false,
  plugins,
  initOptions = {}
}: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null);


  // Comprehensive TinyMCE configuration
  const editorInit = {
    height: height,
    menubar: menubar,
    plugins: plugins || defaultPlugins,
    toolbar: toolbar || defaultToolbar,
    toolbar_mode: 'sliding' as const,
    
    // Content styling
    content_style: `
      body { 
        font-family: Georgia, 'Times New Roman', serif; 
        font-size: 16px; 
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      h1, h2, h3, h4, h5, h6 { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1f2937;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }
      p { 
        margin-bottom: 1em; 
        text-align: justify;
      }
      blockquote {
        border-left: 4px solid #e5e7eb;
        margin: 1.5em 0;
        padding: 0 1em;
        font-style: italic;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      .pagebreak {
        page-break-before: always;
        border-top: 2px dashed #ccc;
        margin: 2em 0;
        padding-top: 1em;
        position: relative;
      }
      .pagebreak:before {
        content: "Page Break";
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 0 10px;
        font-size: 12px;
        color: #666;
      }
    `,
    
    // Placeholder
    placeholder: placeholder,
    
    // Auto-resize
    resize: true,
    autoresize_min_height: typeof height === 'number' ? height : 300,
    autoresize_max_height: 800,
    
    // Paste options
    paste_data_images: true,
    paste_as_text: false,
    smart_paste: true,
    
    // Image handling
    images_upload_handler: (blobInfo: any, progress: any): Promise<string> => {
      return new Promise((resolve, reject) => {
        // For now, convert to base64 - you can replace with actual upload
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject('Failed to convert image');
        };
        reader.readAsDataURL(blobInfo.blob());
      });
    },
    
    // Link handling
    link_default_target: '_blank',
    link_context_toolbar: true,
    
    // Table options
    table_default_attributes: {
      border: '1'
    },
    table_default_styles: {
      'border-collapse': 'collapse',
      'width': '100%'
    },
    
    // Advanced options
    entity_encoding: 'raw' as const,
    remove_script_host: false,
    convert_urls: false,
    
    // Custom formats for book editing
    formats: {
      alignleft: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'align-left' },
      aligncenter: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'align-center' },
      alignright: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'align-right' },
      alignjustify: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table', classes: 'align-justify' }
    },
    
    // Style formats for book content
    style_formats: [
      { title: 'Headings', items: [
        { title: 'Chapter Title', format: 'h1' },
        { title: 'Section', format: 'h2' },
        { title: 'Subsection', format: 'h3' },
        { title: 'Heading 4', format: 'h4' }
      ]},
      { title: 'Inline', items: [
        { title: 'Bold', format: 'bold' },
        { title: 'Italic', format: 'italic' },
        { title: 'Underline', format: 'underline' },
        { title: 'Strikethrough', format: 'strikethrough' },
        { title: 'Code', format: 'code' }
      ]},
      { title: 'Blocks', items: [
        { title: 'Paragraph', format: 'p' },
        { title: 'Blockquote', format: 'blockquote' },
        { title: 'Div', format: 'div' },
        { title: 'Pre', format: 'pre' }
      ]},
      { title: 'Alignment', items: [
        { title: 'Left', format: 'alignleft' },
        { title: 'Center', format: 'aligncenter' },
        { title: 'Right', format: 'alignright' },
        { title: 'Justify', format: 'alignjustify' }
      ]}
    ],
    
    // Merge any additional options
    ...initOptions
  };

  return (
    <div className={`tinymce-editor-wrapper ${className}`}>
      <Editor
        ref={editorRef}
        value={value}
        onEditorChange={onEditorChange}
        disabled={disabled}
        init={editorInit}
      />
      
      {/* Custom styles for the editor wrapper */}
      <style jsx global>{`
        .tinymce-editor-wrapper .tox-tinymce {
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .tinymce-editor-wrapper .tox-toolbar {
          background: #f8f9fa;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .tinymce-editor-wrapper .tox-edit-area {
          background: white;
        }
        
        .tinymce-editor-wrapper .tox-statusbar {
          background: #f8f9fa;
          border-top: 1px solid #e5e7eb;
        }
        
        /* Custom alignment classes */
        .align-left { text-align: left !important; }
        .align-center { text-align: center !important; }
        .align-right { text-align: right !important; }
        .align-justify { text-align: justify !important; }
        
        /* Print styles */
        @media print {
          .pagebreak {
            page-break-before: always !important;
            border: none !important;
          }
          .pagebreak:before {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Default plugins and toolbar for reuse
const defaultPlugins = [
  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
  'paste', 'autoresize', 'pagebreak', 'save', 'directionality'
];

const defaultToolbar = 
  'undo redo | blocks | bold italic underline strikethrough | ' +
  'alignleft aligncenter alignright alignjustify | ' +
  'bullist numlist outdent indent | ' +
  'forecolor backcolor removeformat | ' +
  'link image media table | ' +
  'searchreplace | visualblocks code fullscreen | ' +
  'insertdatetime pagebreak | help';

// Preset configurations for different use cases
export const EDITOR_CONFIGS = {
  // Minimal editor for comments/short content
  minimal: {
    toolbar: 'bold italic underline | link | undo redo',
    plugins: ['link', 'paste'],
    menubar: false,
    height: 200,
  },
  
  // Standard editor for blog posts
  blog: {
    toolbar: 'undo redo | blocks | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image | code',
    plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'code', 'paste', 'autoresize'],
    menubar: false,
    height: 400,
  },
  
  // Full editor for books/long content
  book: {
    toolbar: defaultToolbar,
    plugins: defaultPlugins,
    menubar: 'file edit view insert format tools table help',
    height: 600,
  },
  
  // Simple editor for descriptions
  description: {
    toolbar: 'bold italic underline | undo redo',
    plugins: ['paste'],
    menubar: false,
    height: 150,
  }
};