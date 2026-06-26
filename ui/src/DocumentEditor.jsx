import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ArrowLeft, CheckCircle, Loader2, Eye, Pencil } from 'lucide-react';

export default function DocumentEditor() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [mode, setMode] = useState('edit'); // 'edit' | 'view'
  
  const timerRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    fetchAsset();
  }, [assetId]);

  // Set up paste handler for images once quill is ready
  useEffect(() => {
    if (mode !== 'edit') return;
    
    // Small delay to let Quill mount
    const timeout = setTimeout(() => {
      const editor = quillRef.current?.getEditor?.();
      if (!editor) return;

      const handlePaste = (e) => {
        const clipboardData = e.clipboardData;
        if (!clipboardData || !clipboardData.items) return;

        for (const item of clipboardData.items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            e.stopPropagation();

            const file = item.getAsFile();
            if (!file) continue;

            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result;
              const range = editor.getSelection(true);
              editor.insertEmbed(range.index, 'image', base64);
              editor.setSelection(range.index + 1);
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      };

      editor.root.addEventListener('paste', handlePaste);
      return () => {
        editor.root.removeEventListener('paste', handlePaste);
      };
    }, 300);

    return () => clearTimeout(timeout);
  }, [mode, asset]);

  const fetchAsset = async () => {
    try {
      const res = await axios.get(`/api/documents?id=${assetId}`);
      setAsset(res.data);
      setContent(res.data.content || '');
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  };

  const handleContentChange = (val) => {
    setContent(val);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setSaving(true);
    timerRef.current = setTimeout(() => {
      saveContent(val);
    }, 1500);
  };

  const saveContent = async (textToSave) => {
    if (!asset) return;
    try {
      await axios.post('/api/documents', {
        id: assetId,
        project_id: asset.project_id,
        folder_id: asset.folder_id,
        type: 'document',
        title: asset.title,
        content: textToSave
      });
      setSaving(false);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving', err);
      setSaving(false);
    }
  };

  // Image toolbar button handler
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const editor = quillRef.current?.getEditor?.();
        if (!editor) return;
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'image', reader.result);
        editor.setSelection(range.index + 1);
      };
      reader.readAsDataURL(file);
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), []);

  if (!asset) return <div style={{ padding: '40px', color: 'var(--text-primary)' }}>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-color)' }}>
      
      {/* Navbar */}
      <div style={{ padding: '16px 24px', background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to={`/project/${asset.project_id}${asset.folder_id ? `/folder/${asset.folder_id}` : ''}`} className="btn-secondary" style={{ padding: '8px', display: 'flex' }}>
            <ArrowLeft size={18} />
          </Link>
          <h2 style={{ fontSize: '18px', margin: 0 }}>{asset.title}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Mode toggle */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--input-bg)', 
            borderRadius: '8px', 
            border: '1px solid var(--glass-border)',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setMode('edit')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                background: mode === 'edit' ? 'var(--accent)' : 'transparent',
                color: mode === 'edit' ? '#fff' : 'var(--text-secondary)',
                boxShadow: mode === 'edit' ? '0 2px 8px var(--accent-glow)' : 'none',
              }}
            >
              <Pencil size={14} /> Editar
            </button>
            <button
              onClick={() => setMode('view')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                background: mode === 'view' ? 'var(--accent)' : 'transparent',
                color: mode === 'view' ? '#fff' : 'var(--text-secondary)',
                boxShadow: mode === 'view' ? '0 2px 8px var(--accent-glow)' : 'none',
              }}
            >
              <Eye size={14} /> Vista
            </button>
          </div>

          {/* Save status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Guardando...</>
            ) : lastSaved ? (
              <><CheckCircle size={16} color="var(--accent)" /> Guardado {lastSaved.toLocaleTimeString()}</>
            ) : null}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
        <div className="glass-panel" style={{ 
          width: '100%', maxWidth: '900px', 
          background: '#fff', color: '#000', 
          padding: '0', overflow: 'hidden',
          borderRadius: '12px',
        }}>
          {mode === 'edit' ? (
            <ReactQuill 
              ref={quillRef}
              theme="snow" 
              value={content} 
              onChange={handleContentChange} 
              modules={modules}
              style={{ height: 'calc(100vh - 200px)', border: 'none' }}
            />
          ) : (
            <div 
              className="ql-editor"
              style={{ 
                padding: '24px 32px', 
                minHeight: 'calc(100vh - 200px)',
                fontSize: '16px',
                fontFamily: "'Inter', sans-serif",
                lineHeight: '1.8',
                color: '#1e293b',
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </div>
      
      <style>{`
        .ql-toolbar { border: none !important; border-bottom: 1px solid #e5e7eb !important; background: #f8fafc; }
        .ql-container { border: none !important; font-size: 16px; font-family: 'Inter', sans-serif; }
        .ql-editor img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; cursor: pointer; }
        .ql-editor img:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
