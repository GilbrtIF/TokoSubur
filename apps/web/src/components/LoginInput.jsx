import PropTypes from 'prop-types';
import useInput from '../hooks/UseInput'; 

function LoginInput({ onLogin, submitting }) {
  const [username, onUsernameChange] = useInput('');
  const [password, onPasswordChange] = useInput('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin({ username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Input Username */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Username
        </label>
        <div className="relative">
          <input 
            type="text"
            placeholder="Masukkan username"
            value={username}
            onChange={onUsernameChange}
            required
            className="w-full bg-[#F3F4F6] text-gray-700 text-sm rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#C6F25E] transition-all placeholder:text-gray-400"
          />
          {/* Ikon User */}
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Input Password */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Password
        </label>
        <div className="relative">
          <input
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={onPasswordChange}
            required
            className="w-full bg-[#F3F4F6] text-gray-700 text-sm rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#C6F25E] transition-all placeholder:text-gray-400 tracking-widest"
          />
          {/* Ikon Mata */}
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Remember & Forgot Password */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-gray-300 text-[#C6F25E] focus:ring-[#C6F25E]" 
          />
          <span className="text-xs text-gray-500 font-medium">Remember this device</span>
        </label>
        <a href="#" className="text-xs text-gray-900 font-semibold hover:underline">
          Forgot password?
        </a>
      </div>

      {/* Tombol Sign In */}
      <button 
        type="submit" 
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-[#C6F25E] hover:bg-[#b5e04c] text-black font-semibold text-sm rounded-full px-6 py-3.5 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {submitting ? 'Loading...' : 'Sign In'}
        {!submitting && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        )}
      </button>
    </form>
  );
}
            
LoginInput.propTypes = {
  onLogin: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

export default LoginInput;