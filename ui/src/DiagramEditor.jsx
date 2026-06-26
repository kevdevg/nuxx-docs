import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

export default function DiagramEditor() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [initialData, setInitialData] = useState(null);
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
      if (res.data.content) {
        setInitialData(JSON.parse(res.data.content));
      } else {
        setInitialData({ elements: [], appState: { viewBackgroundColor: "#121212" } });
      }
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  };

  const handleChange = (elements, appState) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaving(true);
    
    // Create minimal serializable representation
    const content = JSON.stringify({
      elements,
      appState: { viewBackgroundColor: appState.viewBackgroundColor }
    });

    timerRef.current = setTimeout(() => {
      saveContent(content);
    }, 2000); // 2s debounce for Excalidraw
  };

  const saveContent = async (textToSave) => {
    if (!asset) return;
    try {
      await axios.post('/api/documents', {
        id: assetId,
        project_id: asset.project_id,
        folder_id: asset.folder_id,
        type: 'diagram',
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

  if (!asset || !initialData) return <div style={{ padding: '40px' }}>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-color)' }}>
      {/* Navbar */}
      <div style={{ padding: '16px 24px', background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to={`/project/${asset.project_id}${asset.folder_id ? `/folder/${asset.folder_id}` : ''}`} className="btn-secondary" style={{ padding: '8px', display: 'flex' }}>
            <ArrowLeft size={18} />
          </Link>
          <h2 style={{ fontSize: '18px', margin: 0 }}>{asset.title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Guardando...</>
          ) : lastSaved ? (
            <><CheckCircle size={16} color="var(--accent)" /> Guardado {lastSaved.toLocaleTimeString()}</>
          ) : null}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', height: 'calc(100vh - 65px)', width: '100%' }}>
        <Excalidraw 
          theme="dark"
          initialData={initialData}
          onChange={handleChange}
        />
      </div>
      
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
