import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import History from './components/History'; 
import Alerts from './components/Alerts';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </Router>
  );
}

export default App;
