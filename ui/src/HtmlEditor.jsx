import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, Loader2, Globe, Lock, ExternalLink } from 'lucide-react';

export default function HtmlEditor() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const timerRef = useRef(null);

  useEffect(() => {
    fetchAsset();
  }, [assetId]);

  const fetchAsset = async () => {
    try {
      const res = await axios.get(`/api/documents?id=${assetId}`);
      setAsset(res.data);
      setContent(res.data.content || '');
      setIsPublic(res.data.is_public || false);
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    scheduleSave(val, isPublic);
  };

  const togglePublic = () => {
    const newVal = !isPublic;
    setIsPublic(newVal);
    scheduleSave(content, newVal);
  };

  const scheduleSave = (textToSave, publicState) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setSaving(true);
    timerRef.current = setTimeout(() => {
      saveContent(textToSave, publicState);
    }, 1500);
  };

  const saveContent = async (textToSave, publicState) => {
    if (!asset) return;
    try {
      await axios.post('/api/documents', {
        id: assetId,
        project_id: asset.project_id,
        folder_id: asset.folder_id,
        type: 'html',
        title: asset.title,
        content: textToSave,
        is_public: publicState
      });
      setSaving(false);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving', err);
      setSaving(false);
    }
  };

  if (!asset) return <div style={{ padding: '40px', color: 'var(--text-primary)' }}>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-color)' }}>
      
      {/* Navbar */}
      <div style={{ padding: '16px 24px', background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to={`/project/${asset.project_id}${asset.folder_id ? `/folder/${asset.folder_id}` : ''}`} className="btn-secondary" style={{ padding: '8px', display: 'flex' }}>
            <ArrowLeft size={18} />
          </Link>
          <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {asset.title}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Public Toggle */}
          <button 
            onClick={togglePublic}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: isPublic ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              background: isPublic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: isPublic ? '#10b981' : '#ef4444',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            {isPublic ? <Globe size={14} /> : <Lock size={14} />}
            {isPublic ? 'Público' : 'Privado'}
          </button>

          {isPublic && (
            <a 
              href={`/public/html?id=${asset.id}`} 
              target="_blank" 
              rel="noreferrer"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', textDecoration: 'none' }}
            >
              <ExternalLink size={14} /> Ver
            </a>
          )}

          {/* Save status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px', minWidth: '130px' }}>
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Guardando...</>
            ) : lastSaved ? (
              <><CheckCircle size={16} color="var(--accent)" /> Guardado {lastSaved.toLocaleTimeString()}</>
            ) : null}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
        <div className="glass-panel" style={{ 
          width: '100%', maxWidth: '1000px', 
          background: '#1e1e1e', color: '#d4d4d4', 
          padding: '0', overflow: 'hidden',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '8px 16px', background: '#252526', fontSize: '12px', borderBottom: '1px solid #3c3c3c', color: '#9cdcfe', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ce9178' }}>&lt;&gt;</span> index.html
          </div>
          <textarea
            value={content}
            onChange={handleContentChange}
            spellCheck="false"
            style={{
              flex: 1,
              width: '100%',
              height: 'calc(100vh - 220px)',
              background: 'transparent',
              color: 'inherit',
              border: 'none',
              padding: '20px',
              fontFamily: '"Fira Code", "Consolas", monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              outline: 'none',
              resize: 'none'
            }}
            placeholder="Escribe tu código HTML aquí..."
          />
        </div>
      </div>
      
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
