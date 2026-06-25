import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Drive from './Drive';
import DocumentEditor from './DocumentEditor';
import DiagramEditor from './DiagramEditor';
import HtmlEditor from './HtmlEditor';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Drive /></ProtectedRoute>} />
          <Route path="/project/:projectId" element={<ProtectedRoute><Drive /></ProtectedRoute>} />
          <Route path="/project/:projectId/folder/:folderId" element={<ProtectedRoute><Drive /></ProtectedRoute>} />
          <Route path="/document/:assetId" element={<ProtectedRoute><DocumentEditor /></ProtectedRoute>} />
          <Route path="/diagram/:assetId" element={<ProtectedRoute><DiagramEditor /></ProtectedRoute>} />
          <Route path="/html/:assetId" element={<ProtectedRoute><HtmlEditor /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
