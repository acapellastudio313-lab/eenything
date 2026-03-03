import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">E-Voting App</h1>
        <p className="text-slate-500 font-medium">Aplikasi Pemilihan</p>
      </div>

      <div className="w-full max-w-[450px] bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
        <h2 className="text-xl font-bold text-center text-slate-800 mb-8">Login ke Akun Anda</h2>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="Masukkan email"
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="Masukkan password"
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <LogIn size={20} />
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-medium">Atau</span></div>
        </div>

        <button 
          className="w-full bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <UserPlus size={20} />
          Daftar Baru
        </button>
      </div>

      <p className="mt-8 text-slate-400 text-sm font-medium italic">Agen Perubahan PA Prabumulih</p>
    </div>
  );
}