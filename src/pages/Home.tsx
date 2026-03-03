import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { User, Post } from '../types';
import { Image as ImageIcon, X, Mic, Square, Trash2, Clock } from 'lucide-react';
import PostItem from '../components/PostItem';
import Stories from '../components/Stories';
// Import koneksi supabase kamu
import { supabase } from '../lib/supabase'; 

export default function Home({ user }: { user: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [electionEndDate, setElectionEndDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [electionStatus, setElectionStatus] = useState<string>('not_started');

  // --- REPLACED: Fetching data langsung dari Supabase ---
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(*),
        likes(*),
        comments(*)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data: statusData } = await supabase.from('settings').select('*').eq('key', 'election_status').single();
    const { data: dateData } = await supabase.from('settings').select('*').eq('key', 'election_end_date').single();

    if (statusData) setElectionStatus(statusData.value);
    if (dateData) setElectionEndDate(new Date(dateData.value));
  };

  useEffect(() => {
    fetchPosts();
    fetchSettings();

    // --- REPLACED: Realtime menggunakan Supabase Realtime (Bukan WebSocket manual) ---
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', table: 'posts' }, () => {
        fetchPosts(); // Refresh data otomatis jika ada perubahan
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Timer logic (Tetap sama)
  useEffect(() => {
    if (!electionEndDate || electionStatus !== 'in_progress') {
      setTimeLeft(null);
      return;
    }
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = electionEndDate.getTime() - now.getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
        setElectionStatus('closed');
      }
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [electionEndDate, electionStatus]);

  // Audio Recording logic (Tetap sama)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorder.start();
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } catch (err) {
      alert('Gagal akses mikrofon');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // --- REPLACED: Handle Post langsung ke Supabase ---
  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !imageUrl && !audioUrl) return;

    let finalAudioUrl = audioUrl;

    // Tips: Untuk ASMR Global, idealnya upload blob ke Supabase Storage.
    // Namun untuk sekarang kita pakai Base64 atau URL dummy agar cepat.
    const { error } = await supabase.from('posts').insert([{
      author_id: user.id,
      content: newPost,
      image_url: imageUrl || (showImageInput ? `https://picsum.photos/seed/${Math.random()}/800/600` : null),
      audio_url: finalAudioUrl,
      is_pinned: false
    }]);

    if (!error) {
      setNewPost('');
      setImageUrl('');
      setShowImageInput(false);
      setAudioBlob(null);
      setAudioUrl(null);
      fetchPosts();
    }
  };

  // --- REPLACED: Like & Pin menggunakan Supabase ---
  const handleLike = async (postId: number) => {
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id);
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: user.id }]);
    }
    fetchPosts();
  };

  const handlePin = async (postId: number, isPinned: boolean) => {
    await supabase.from('posts').update({ is_pinned: !isPinned }).eq('id', postId);
    fetchPosts();
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat linimasa...</div>;

  return (
    <div className="w-full">
      {/* Banner Status Pemilihan */}
      <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <h2 className="font-bold text-lg">Status Pemilihan</h2>
          </div>
          {electionEndDate && (
            <span className="text-xs bg-white/20 px-3 py-1.5 rounded-full font-medium">
              Selesai: {electionEndDate.toLocaleString('id-ID')}
            </span>
          )}
        </div>

        {electionStatus === 'in_progress' && timeLeft ? (
          <div className="grid grid-cols-4 gap-3 text-center">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="bg-white/20 rounded-xl p-2 border border-white/10">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-[10px] uppercase opacity-80">{unit}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 bg-white/10 rounded-xl">
            {electionStatus === 'closed' ? 'Pemilihan Berakhir' : 'Menunggu Dimulai'}
          </div>
        )}
      </div>

      <div className="lg:hidden bg-white border-b border-slate-200 py-2">
        <Stories user={user} />
      </div>

      {/* Input Postingan */}
      <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex gap-4">
          <img src={user.avatar} className="w-12 h-12 rounded-full hidden sm:block object-cover" />
          <form onSubmit={handlePost} className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Berikan aspirasi atau konten ASMR Anda..."
              className="w-full bg-transparent resize-none outline-none text-lg placeholder:text-slate-400 min-h-[80px]"
            />
            
            {showImageInput && (
              <div className="mb-3 relative inline-block">
                <img src={imageUrl || 'https://picsum.photos/800/600'} className="max-h-48 rounded-xl" />
                <button onClick={() => {setShowImageInput(false); setImageUrl('');}} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><X size={16}/></button>
              </div>
            )}

            {audioUrl && (
              <div className="mb-3 flex items-center gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <Mic className="text-emerald-600" size={20} />
                <audio src={audioUrl} controls className="h-8 flex-1" />
                <button onClick={() => setAudioUrl(null)} className="text-slate-400"><Trash2 size={18}/></button>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowImageInput(true)} className="p-2 text-slate-500 hover:text-emerald-600"><ImageIcon /></button>
                <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500'}`}><Mic /></button>
              </div>
              <button
                type="submit"
                disabled={!newPost && !audioUrl}
                className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold disabled:opacity-50"
              >
                Posting
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* List Postingan */}
      <div className="divide-y divide-slate-100 bg-slate-50">
        {posts.map((post) => (
          <PostItem 
            key={post.id} 
            post={post} 
            user={user} 
            onLike={() => handleLike(post.id)} 
            onPin={() => handlePin(post.id, post.is_pinned)}
            onCommentAdded={fetchPosts}
            onPostUpdated={fetchPosts}
            onPostDeleted={fetchPosts}
          />
        ))}
      </div>
    </div>
  );
}