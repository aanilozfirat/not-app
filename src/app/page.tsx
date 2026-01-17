"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, PenLine, Plus, Search, Pin, X, Check, LogOut, User, Lock, Sparkles, Share2, Mic, MicOff, Tag, ArrowRight } from "lucide-react";
import clsx from "clsx";

const COLORS = [
  { id: "yellow", value: "bg-[#fff7d1]", border: "border-[#e6deaf]", text: "text-yellow-900", tag: "bg-yellow-200/50 text-yellow-800" },
  { id: "green", value: "bg-[#e2f6d3]", border: "border-[#cce5b8]", text: "text-green-900", tag: "bg-green-200/50 text-green-800" },
  { id: "blue", value: "bg-[#d4ebf7]", border: "border-[#b8d4e5]", text: "text-blue-900", tag: "bg-blue-200/50 text-blue-800" },
  { id: "purple", value: "bg-[#e9dff5]", border: "border-[#d1c2e0]", text: "text-purple-900", tag: "bg-purple-200/50 text-purple-800" },
  { id: "pink", value: "bg-[#fbe4e4]", border: "border-[#e8caca]", text: "text-pink-900", tag: "bg-pink-200/50 text-pink-800" },
  { id: "white", value: "bg-white", border: "border-gray-200", text: "text-gray-800", tag: "bg-gray-100 text-gray-600" },
];

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  date: string;
  isPinned?: boolean;
  tags?: string[];
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true); // Giriş yap vs Kayıt ol modu
  const [greeting, setGreeting] = useState("");

  const [notes, setNotes] = useState<Note[]>([]);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sesli Yazma State'leri
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Oturum kontrolü
    const sessionUser = localStorage.getItem("active_session_user");
    if (sessionUser) setCurrentUser(sessionUser);

    const hour = new Date().getHours();
    if (hour < 6) setGreeting("İyi geceler");
    else if (hour < 12) setGreeting("Günaydın");
    else if (hour < 18) setGreeting("Tünaydın");
    else setGreeting("İyi akşamlar");

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (currentUser) {
      const savedNotes = localStorage.getItem(`notes_${currentUser}`);
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      else setNotes([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isLoaded && currentUser) {
      localStorage.setItem(`notes_${currentUser}`, JSON.stringify(notes));
    }
  }, [notes, isLoaded, currentUser]);

  // Sesli Yazma Entegrasyonu
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "tr-TR";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setContent(prev => prev + (prev ? " " : "") + transcript);
        };

        recognition.onend = () => setIsListening(false);
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } else {
        alert("Tarayıcınız sesli yazmayı desteklemiyor.");
      }
    }
  };

  const shareNote = async (note: Note) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: `${note.title}\n\n${note.content}`,
        });
      } catch (error) {
        console.log("Paylaşım iptal edildi");
      }
    } else {
      navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
      alert("Not panoya kopyalandı!");
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError("Lütfen tüm alanları doldurunuz.");
      return;
    }

    // Kullanıcı veritabanını çek (Local Storage simülasyonu)
    const usersDb = JSON.parse(localStorage.getItem("app_users_db") || "{}");

    if (isLoginMode) {
      // --- GİRİŞ YAPMA MANTIĞI ---
      if (usersDb[usernameInput]) {
        if (usersDb[usernameInput] === passwordInput) {
          // Başarılı giriş
          localStorage.setItem("active_session_user", usernameInput);
          setCurrentUser(usernameInput);
        } else {
          setLoginError("Şifre hatalı. Lütfen tekrar deneyin.");
        }
      } else {
        setLoginError("Böyle bir kullanıcı bulunamadı. Önce kayıt olun.");
      }
    } else {
      // --- KAYIT OLMA MANTIĞI ---
      if (usersDb[usernameInput]) {
        setLoginError("Bu kullanıcı adı zaten alınmış.");
      } else {
        // Yeni kullanıcı oluştur
        usersDb[usernameInput] = passwordInput;
        localStorage.setItem("app_users_db", JSON.stringify(usersDb));

        // Otomatik giriş yap
        localStorage.setItem("active_session_user", usernameInput);
        setCurrentUser(usernameInput);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("active_session_user");
    setCurrentUser(null);
    setNotes([]);
    setUsernameInput("");
    setPasswordInput("");
    setLoginError("");
  };

  const addNote = () => {
    if (!content.trim() && !title.trim()) return;

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

    if (editingNoteId) {
      setNotes(notes.map(n => n.id === editingNoteId ? {
        ...n,
        title,
        content,
        color: selectedColor.id,
        tags: tags.length > 0 ? tags : n.tags
      } : n));
      setEditingNoteId(null);
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title,
        content,
        color: selectedColor.id,
        date: new Date().toLocaleDateString("tr-TR"),
        isPinned: false,
        tags: tags
      };
      setNotes([newNote, ...notes]);
    }
    setTitle("");
    setContent("");
    setTagsInput("");
    setIsInputExpanded(false);
    setSelectedColor(COLORS[0]);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const togglePin = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const startEditing = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setTagsInput(note.tags?.join(', ') || "");
    setSelectedColor(COLORS.find(c => c.id === note.color) || COLORS[0]);
    setEditingNoteId(note.id);
    setIsInputExpanded(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setTitle("");
    setContent("");
    setTagsInput("");
    setEditingNoteId(null);
    setIsInputExpanded(false);
    setSelectedColor(COLORS[0]);
  };

  const filteredNotes = useMemo(() => {
    return notes
      .filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return Number(b.id) - Number(a.id);
      });
  }, [notes, searchTerm]);

  const getColorClass = (id: string) => COLORS.find(c => c.id === id) || COLORS[0];

  if (!isLoaded) return null;

  if (!currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#fdfcf8] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8 border border-white/50 relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-yellow-100 to-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3 transform hover:rotate-6 transition-transform">
              <Sparkles className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              {isLoginMode ? "Tekrar Hoş Geldin" : "Hesap Oluştur"}
            </h1>
            <p className="text-gray-500 mt-3 text-lg font-light">
              {isLoginMode ? "Kaldığın yerden devam et." : "Düşüncelerini özgürleştirmek için katıl."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 ml-1">Kullanıcı Adı</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100/50 transition-all font-medium text-gray-700"
                  placeholder="Kullanıcı adı"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 ml-1">Şifre</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100/50 transition-all font-medium text-gray-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {loginError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-red-500 text-sm text-center font-medium bg-red-50 py-3 rounded-xl border border-red-100">
                {loginError}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200 mt-4 flex items-center justify-center gap-2 group"
            >
              {isLoginMode ? "Giriş Yap" : "Kayıt Ol"}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setLoginError("");
                setUsernameInput("");
                setPasswordInput("");
              }}
              className="text-gray-500 hover:text-yellow-600 font-medium transition-colors text-sm"
            >
              {isLoginMode ? "Hesabın yok mu? Kayıt Ol" : "Zaten hesabın var mı? Giriş Yap"}
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 max-w-7xl mx-auto selection:bg-yellow-100 selection:text-yellow-900">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 rotate-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-300 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              N
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-800 flex items-center gap-2">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">{currentUser}</span>
            </h1>
            <p className="text-sm text-gray-400 font-medium">Bugün neler planlıyorsun?</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
            <input
              type="text"
              placeholder="Not veya #etiket ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100"
            title="Çıkış Yap"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex justify-center mb-16 relative z-10">
        <motion.div
          layout
          className={clsx(
            "w-full max-w-xl bg-white rounded-3xl shadow-[0_20px_40px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-100 transition-colors duration-500",
            selectedColor.id !== 'white' && getColorClass(selectedColor.id).value,
            editingNoteId && "ring-4 ring-yellow-400/20"
          )}
        >
          {isInputExpanded && (
            <div className="flex items-center px-1">
              <input
                type="text"
                placeholder="Başlık"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-6 pt-6 pb-2 bg-transparent text-xl font-bold text-gray-800 placeholder-gray-400/60 outline-none"
              />
              <div className="flex items-center mr-4 mt-4">
                 {/* Sesli Yazma Butonu */}
                <button
                  onClick={toggleListening}
                  className={clsx(
                    "p-2 rounded-full transition-colors mr-2",
                    isListening ? "bg-red-100 text-red-600 animate-pulse" : "hover:bg-black/5 text-gray-500"
                  )}
                  title="Sesle Yaz"
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                {editingNoteId && (
                  <button onClick={cancelEdit} className="p-2 hover:bg-black/5 rounded-full text-gray-500 transition-colors" title="İptal">
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          <textarea
            placeholder={editingNoteId ? "Notu düzenle..." : "Aklından geçenler..."}
            value={content}
            onClick={() => setIsInputExpanded(true)}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-6 py-5 bg-transparent text-gray-700 placeholder-gray-400/60 resize-none outline-none min-h-[60px] text-lg leading-relaxed"
            rows={isInputExpanded ? 4 : 1}
          />

          {isInputExpanded && (
            <div className="px-6 pb-2 flex items-center gap-2">
               <Tag size={16} className="text-gray-400" />
               <input
                 type="text"
                 placeholder="Etiketler (virgülle ayır: iş, fikir)"
                 value={tagsInput}
                 onChange={(e) => setTagsInput(e.target.value)}
                 className="w-full bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none"
               />
            </div>
          )}

          <AnimatePresence>
            {isInputExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 pb-5 flex items-center justify-between pt-2 mx-1 border-t border-black/5 mt-2"
              >
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
                      className={clsx(
                        "w-8 h-8 rounded-full border-2 transition-transform flex-shrink-0 relative",
                        color.value,
                        color.border,
                        selectedColor.id === color.id ? "scale-110 ring-2 ring-gray-400 ring-offset-2 border-transparent" : "hover:scale-110 border-transparent hover:border-black/10"
                      )}
                      title={color.id}
                    >
                      {selectedColor.id === color.id && <Check size={14} className="absolute inset-0 m-auto text-black/50" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={addNote}
                  className={clsx(
                    "flex items-center gap-2 font-semibold px-6 py-2.5 rounded-full transition-all text-sm shrink-0 ml-4 shadow-lg hover:shadow-xl active:scale-95",
                    editingNoteId
                      ? "bg-gray-900 text-white hover:bg-black"
                      : "bg-gray-900 text-white hover:bg-black"
                  )}
                >
                  {editingNoteId ? "Güncelle" : <><Plus size={18} /> Ekle</>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Masonry Layout */}
      <div className="masonry-grid pb-20">
        <AnimatePresence mode="popLayout">
          {filteredNotes.map((note) => {
            const colorStyle = getColorClass(note.color);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                key={note.id}
                onClick={() => startEditing(note)}
                className={clsx(
                  "break-inside-avoid mb-6 relative group rounded-3xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1",
                  colorStyle.value,
                  colorStyle.border,
                  note.isPinned && "ring-2 ring-black/5"
                )}
              >
                {/* Pin Butonu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(note.id);
                  }}
                  className={clsx(
                    "absolute top-4 right-4 p-2 rounded-full transition-all duration-200 z-10",
                    note.isPinned
                      ? "bg-black/10 text-gray-800 opacity-100"
                      : "opacity-0 group-hover:opacity-100 hover:bg-black/5 text-gray-500"
                  )}
                  title={note.isPinned ? "Sabitlemeyi kaldır" : "Sabitle"}
                >
                  <Pin size={16} className={clsx(note.isPinned && "fill-current")} />
                </button>

                {note.title && (
                  <h3 className={clsx("font-bold text-xl mb-3 leading-tight pr-8", colorStyle.text)}>{note.title}</h3>
                )}
                <p className={clsx("whitespace-pre-wrap leading-relaxed text-[15px]", colorStyle.text, "opacity-90")}>{note.content}</p>

                {/* Etiketler */}
                {note.tags && note.tags.length > 0 && (
                   <div className="flex flex-wrap gap-2 mt-4">
                     {note.tags.map((tag, i) => (
                       <span key={i} className={clsx("text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wider", colorStyle.tag)}>
                         #{tag}
                       </span>
                     ))}
                   </div>
                )}

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-black/5">
                  <span className="text-xs font-semibold opacity-60 flex items-center gap-1.5 uppercase tracking-wide">
                    {note.date}
                    {note.isPinned && <span className="bg-black/10 px-2 py-0.5 rounded-full text-[10px]">SABİT</span>}
                  </span>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button
                      onClick={(e) => {
                        e.stopPropagation();
                        shareNote(note);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-full transition-colors"
                      title="Apple Notlar'da Paylaş"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(note);
                      }}
                      className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-full transition-colors"
                      title="Düzenle"
                    >
                      <PenLine size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50/50 rounded-full transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredNotes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-gray-300 mt-12"
        >
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            {searchTerm ? (
              <Search className="w-10 h-10 opacity-20 text-gray-500" />
            ) : (
              <Sparkles className="w-10 h-10 opacity-20 text-yellow-500" />
            )}
          </div>
          <p className="text-lg font-medium text-gray-400">
            {searchTerm ? "Sonuç bulunamadı." : "Henüz hiç notun yok."}
          </p>
          {!searchTerm && <p className="text-sm text-gray-300 mt-1">Hadi, güzel bir şeyler yaz.</p>}
        </motion.div>
      )}
    </main>
  );
}
