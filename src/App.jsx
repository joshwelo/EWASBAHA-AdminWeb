import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import History from './components/History'; 
import Alerts from './components/Alerts';
import FloodAffectedAreas from './components/FloodAffectedAreas';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/history" element={<History />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/flood-affected-areas" element={<FloodAffectedAreas />} />
      </Routes>
    </Router>
  );
}

export default App;
