import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuthError = (error) => {
    let errorMsg = 'An error occurred. Please try again.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMsg = 'Invalid email or password.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMsg = 'Too many failed attempts. Please try again later.';
    }
    setError(errorMsg);
    toast.error(errorMsg, { icon: '❌', className: 'login-error-toast' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email.trim() || !formData.password.trim()) {
      const errorMsg = 'Email and password are required.';
      setError(errorMsg);
      toast.warning(errorMsg, { icon: "⚠️" });
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.isAdmin || userData.isAdmin !== true) {
          const errorMsg = "Access denied. This portal is for administrators only.";
          setError(errorMsg);
          toast.error(errorMsg, { 
            icon: "🚫",
            className: "admin-error-toast"
          });
          await auth.signOut();
          setLoading(false);
          return;
        }
        // Successful login
        toast.success("Login successful! Redirecting to dashboard...", { icon: "✅" });
        navigate('/dashboard');
      } else {
        const errorMsg = "This account is not registered in our system. Please contact support.";
        setError(errorMsg);
        toast.error(errorMsg, { 
          icon: "❓",
          className: "not-registered-toast"
        });
        await auth.signOut();
        setLoading(false);
      }
    } catch (error) {
      handleAuthError(error);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex w-screen h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full w-full grow flex-col">
        <div className="flex flex-1 justify-center items-center w-full">
          <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 flex-1">
            <h2 className="text-[#111518] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">Welcome back</h2>
            <form onSubmit={handleSubmit}>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111518] text-base font-medium leading-normal pb-2">Username</p>
                  <input
                    type="email"
                    placeholder="Enter your username"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111518] focus:outline-0 focus:ring-0 border border-[#dbe1e6] bg-white focus:border-[#dbe1e6] h-14 placeholder:text-[#60768a] p-[15px] text-base font-normal leading-normal"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </label>
              </div>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111518] text-base font-medium leading-normal pb-2">Password</p>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111518] focus:outline-0 focus:ring-0 border border-[#dbe1e6] bg-white focus:border-[#dbe1e6] h-14 placeholder:text-[#60768a] p-[15px] text-base font-normal leading-normal"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </label>
              </div>
              <p className="text-[#60768a] text-sm font-normal leading-normal pb-3 pt-1 px-4 underline cursor-pointer">Forgot Password?</p>
              <div className="flex px-4 py-3">
                <button
                  type="submit"
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 flex-1 bg-[#0b80ee] text-white text-sm font-bold leading-normal tracking-[0.015em]"
                  disabled={loading}
                >
                  <span className="truncate">{loading ? 'Logging in...' : 'Login'}</span>
                </button>
              </div>
            </form>
            {error && (
              <p className="text-red-500 text-sm font-medium leading-normal px-4 pb-2 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 