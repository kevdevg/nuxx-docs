import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Folder, FileText, Image as ImageIcon, File as FileIcon, Plus, LayoutDashboard, LogOut, PenTool, Globe } from 'lucide-react';

export default function Drive() {
  const { projectId, folderId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [assets, setAssets] = useState([]);
  
  const [newProjectName, setNewProjectName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchDirectory();
    } else {
      setFolders([]);
      setAssets([]);
    }
  }, [projectId, folderId]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDirectory = async () => {
    try {
      let url = `/api/directory?project_id=${projectId}`;
      if (folderId) url += `&folder_id=${folderId}`;
      const res = await axios.get(url);
      setFolders(res.data.folders);
      setAssets(res.data.assets);
    } catch (err) {
      console.error(err);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!newProjectName) return;
    try {
      await axios.post('/api/projects', { name: newProjectName });
      setNewProjectName('');
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const createFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName || !projectId) return;
    try {
      await axios.post('/api/folders', {
        project_id: parseInt(projectId),
        parent_folder_id: folderId ? parseInt(folderId) : null,
        name: newFolderName
      });
      setNewFolderName('');
      fetchDirectory();
    } catch (err) {
      console.error(err);
    }
  };

  const createAsset = async (type) => {
    if (!projectId) return alert("Selecciona un proyecto primero");
    try {
      const title = prompt(`Nombre del nuevo ${type}:`);
      if (!title) return;
      
      const res = await axios.post('/api/documents', {
        project_id: parseInt(projectId),
        folder_id: folderId ? parseInt(folderId) : null,
        type: type,
        title: title,
        content: type === 'diagram' ? '{"type":"excalidraw","version":2,"source":"http://localhost:8080","elements":[],"appState":{"viewBackgroundColor":"#ffffff"},"files":{}}' : (type === 'html' ? '<!DOCTYPE html>\\n<html>\\n<head>\\n  <title>Mi Web</title>\\n</head>\\n<body>\\n  <h1>Hola Mundo</h1>\\n</body>\\n</html>' : '')
      });
      
      if (type === 'document') {
        navigate(`/document/${res.data.id}`);
      } else if (type === 'diagram') {
        navigate(`/diagram/${res.data.id}`);
      } else if (type === 'html') {
        navigate(`/html/${res.data.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentProject = projects.find(p => p.id === parseInt(projectId));

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '280px', borderRadius: '0', borderLeft: 'none', borderTop: 'none', borderBottom: 'none', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutDashboard size={24} color="var(--accent)" />
            Nuxx Drive
          </h2>
        </div>
        
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '1px' }}>
            Proyectos
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {projects.map(p => (
              <Link 
                key={p.id} 
                to={`/project/${p.id}`}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: p.id === parseInt(projectId) ? 'white' : 'var(--text-primary)',
                  background: p.id === parseInt(projectId) ? 'var(--accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Folder size={18} />
                {p.name}
              </Link>
            ))}
          </div>

          <form onSubmit={createProject} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="input-glass" 
              placeholder="Nuevo proyecto..." 
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} />
            </button>
          </form>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user?.email}</div>
          <button onClick={logout} className="btn-secondary" style={{ padding: '6px', border: 'none' }} title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Topbar */}
        <div style={{ padding: '24px 40px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(11, 15, 25, 0.4)', backdropFilter: 'blur(12px)' }}>
          <div>
            <h1 style={{ fontSize: '24px' }}>
              {currentProject ? currentProject.name : 'Selecciona un proyecto'}
            </h1>
          </div>
          
          {projectId && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => createAsset('document')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <FileText size={16} /> Documento
              </button>
              <button onClick={() => createAsset('diagram')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <PenTool size={16} /> Diagrama
              </button>
              <button onClick={() => createAsset('html')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <Globe size={16} /> Web HTML
              </button>
            </div>
          )}
        </div>

        {/* Workspace */}
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {!projectId ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Selecciona o crea un proyecto en el panel lateral para empezar.
            </div>
          ) : (
            <div className="animate-fade-in">
              
              {/* Folder Creation Form */}
              <form onSubmit={createFolder} style={{ display: 'flex', gap: '12px', marginBottom: '32px', maxWidth: '400px' }}>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Nueva carpeta..." 
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={18} /> Crear
                </button>
              </form>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                
                {/* Back Button if in subfolder */}
                {folderId && (
                  <Link to={`/project/${projectId}`} className="glass-panel" style={{ padding: '20px', textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <Folder size={40} color="var(--text-secondary)" />
                    <span style={{ fontWeight: 500 }}>.. (Atrás)</span>
                  </Link>
                )}

                {/* Folders */}
                {folders.map(f => (
                  <Link key={f.id} to={`/project/${projectId}/folder/${f.id}`} className="glass-panel" style={{ padding: '20px', textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', transition: 'transform 0.2s', background: 'rgba(30, 41, 59, 0.4)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <Folder size={40} color="var(--accent)" />
                    <span style={{ fontWeight: 500, textAlign: 'center' }}>{f.name}</span>
                  </Link>
                ))}

                {/* Assets */}
                {assets.map(a => {
                  let Icon = FileIcon;
                  let color = "var(--text-secondary)";
                  let link = `/document/${a.id}`;

                  if (a.type === 'document') {
                    Icon = FileText;
                    color = "#3b82f6";
                  } else if (a.type === 'diagram') {
                    Icon = PenTool;
                    color = "#f59e0b";
                    link = `/diagram/${a.id}`;
                  } else if (a.type === 'html') {
                    Icon = Globe;
                    color = "#ec4899";
                    link = `/html/${a.id}`;
                  } else if (a.type === 'image') {
                    Icon = ImageIcon;
                    color = "#10b981";
                  }

                  return (
                    <Link key={a.id} to={link} className="glass-panel" style={{ padding: '20px', textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      <Icon size={40} color={color} />
                      <span style={{ fontWeight: 500, textAlign: 'center' }}>{a.title}</span>
                    </Link>
                  )
                })}
              </div>

              {folders.length === 0 && assets.length === 0 && !folderId && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                  Carpeta vacía. Crea carpetas, documentos o diagramas usando los botones de arriba.
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
