"use client";

import { useState, useEffect, useCallback } from "react";
import TinyMCEEditor, { EDITOR_CONFIGS } from "./TinyMCEEditor";
import { debounce } from "lodash";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string, wordCount: number) => void;
  fullScreen?: boolean;
  darkMode?: boolean;
  placeholder?: string;
  height?: number | string;
  editorType?: 'blog' | 'book' | 'minimal' | 'description';
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  fullScreen = false, 
  darkMode = false,
  placeholder = "Start writing...",
  height,
  editorType = 'blog'
}: RichTextEditorProps) {
  const [wordCount, setWordCount] = useState(0);

  // Count words helper
  const countWords = (text: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  // Debounced onChange to avoid too many calls
  const debouncedOnChange = useCallback(
    debounce((content: string, wordCount: number) => {
      onChange(content, wordCount);
    }, 300),
    [onChange]
  );

  // Handle content change
  const handleContentChange = (newContent: string) => {
    const words = countWords(newContent);
    setWordCount(words);
    debouncedOnChange(newContent, words);
  };

  // Update word count when content changes
  useEffect(() => {
    if (content) {
      const words = countWords(content);
      setWordCount(words);
    }
  }, [content]);

  // Configure editor based on type and full screen
  const editorConfig = {
    ...EDITOR_CONFIGS[editorType],
    height: fullScreen ? '100vh' : (height || EDITOR_CONFIGS[editorType].height),
    ...(fullScreen && {
      toolbar: EDITOR_CONFIGS.book.toolbar,
      plugins: EDITOR_CONFIGS.book.plugins,
      menubar: 'file edit view insert format tools table help'
    })
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Full screen header */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Full Screen Editor</h2>
            <p className="text-sm text-gray-300">{wordCount} words</p>
          </div>
          <button
            onClick={() => {/* This would be handled by parent component */}}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Exit Full Screen
          </button>
        </div>
        
        {/* Full screen editor */}
        <div className="flex-1">
          <TinyMCEEditor
            value={content}
            onEditorChange={handleContentChange}
            placeholder={placeholder}
            className="h-full"
            {...editorConfig}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${darkMode ? 'dark' : ''}`}>
      <TinyMCEEditor
        value={content}
        onEditorChange={handleContentChange}
        placeholder={placeholder}
        {...editorConfig}
        height={height}
        initOptions={{
          ...(darkMode && {
            skin: 'oxide-dark',
            content_css: 'dark'
          })
        }}
      />
      
      {/* Status bar */}
      <div className={`border-t px-4 py-2 text-sm flex justify-between items-center ${
        darkMode ? 'border-gray-600 bg-gray-800 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-600'
      }`}>
        <div>
          {wordCount} words
        </div>
        <div className="text-xs">
          TinyMCE Editor
        </div>
      </div>
      
      <style jsx>{`
        .rich-text-editor.dark .tox-tinymce {
          background-color: #1f2937;
        }
      `}</style>
    </div>
  );
}