import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import History from './components/History'; 
import Alerts from './components/Alerts';
import FloodAffectedAreas from './components/FloodAffectedAreas';
import ProtectedRoute from './components/ProtectedRoute';
import EvacuationCenter from './components/EvacuationCenter';
import SosPage from './components/SosPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="/flood-affected-areas" element={<ProtectedRoute><FloodAffectedAreas /></ProtectedRoute>} />
        <Route path="/evacuation-center" element={<ProtectedRoute><EvacuationCenter /></ProtectedRoute>} />
        <Route path="/sos" element={<ProtectedRoute><SosPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
