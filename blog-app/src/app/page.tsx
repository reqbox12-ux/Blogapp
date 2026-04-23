"use client";

import { useState, useEffect } from "react";
import { 
  Search, PenTool, Clipboard, Check, Loader2, Sparkles, 
  Plus, Trash2, History, LayoutDashboard, Settings, 
  ChevronRight, ArrowRight, FileText, Tags, Code, Eye
} from "lucide-react";

interface PostResult {
  id?: string;
  title: string;
  tags: string;
  html: string;
  metaDesc?: string;
  status: "idle" | "loading" | "done" | "error";
  generatedAt?: string;
}

export default function EnhancedDashboard() {
  const [activeView, setActiveView] = useState<"generator" | "library">("generator");
  const [topic, setTopic] = useState("");
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [queue, setQueue] = useState<PostResult[]>([]);
  const [activeQueueIdx, setActiveQueueIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<PostResult[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<PostResult | null>(null);

  // 로드 시 히스토리 가져오기
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      const formatted = data.history.map((h: any) => ({
        id: h.id,
        title: h.title,
        tags: h.keywords.join(", "),
        html: "", // 상세 보기 시 로드
        metaDesc: h.metaDesc,
        generatedAt: h.generatedAt,
        status: "done" as const
      }));
      setHistory(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistoryDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`);
      const data = await res.json();
      setSelectedHistory({
        id: data.id,
        title: data.title,
        tags: data.keywords.join(", "),
        html: data.fullHtml,
        metaDesc: data.metaDesc,
        generatedAt: data.generatedAt,
        status: "done"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuggestTitles = async () => {
    if (!topic.trim()) return;
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/titles", {
        method: "POST",
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      setSuggestedTitles(data.titles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const addToQueue = (title: string) => {
    setQueue([...queue, { title, tags: "", html: "", status: "idle" }]);
    setSuggestedTitles(suggestedTitles.filter(t => t !== title));
    setActiveQueueIdx(queue.length);
  };

  const generatePost = async (index: number) => {
    const item = queue[index];
    const newQueue = [...queue];
    newQueue[index].status = "loading";
    setQueue(newQueue);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ title: item.title }),
      });
      const data = await res.json();
      
      const updatedQueue = [...queue];
      updatedQueue[index] = {
        ...updatedQueue[index],
        tags: data.tags,
        html: data.html,
        metaDesc: data.metaDesc,
        status: "done",
      };
      setQueue(updatedQueue);
      fetchHistory(); // 히스토리 갱신
    } catch (err) {
      const updatedQueue = [...queue];
      updatedQueue[index].status = "error";
      setQueue(updatedQueue);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200">
      {/* Sidebar Navigation */}
      <nav className="w-20 lg:w-64 border-r border-slate-800/50 flex flex-col p-4 bg-[#020617] z-20">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl hidden lg:block tracking-tighter">ANTIGRAVITY</span>
        </div>

        <div className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveView("generator")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === "generator" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-500 hover:bg-slate-800/50"}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium hidden lg:block">Generator</span>
          </button>
          <button 
            onClick={() => setActiveView("library")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === "library" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-500 hover:bg-slate-800/50"}`}
          >
            <History className="w-5 h-5" />
            <span className="font-medium hidden lg:block">Library</span>
          </button>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800/50 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-slate-800/50 transition-all">
            <Settings className="w-5 h-5" />
            <span className="font-medium hidden lg:block">Settings</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-pink-500/5 blur-[100px] rounded-full pointer-events-none" />

        {activeView === "generator" ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Topic & Suggestion Panel */}
            <div className="w-full lg:w-96 border-r border-slate-800/50 p-6 overflow-y-auto space-y-8 z-10 scrollbar-hide">
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Concept</h2>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Enter main keyword..."
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all group-hover:border-slate-600"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSuggestTitles()}
                  />
                  <button 
                    onClick={handleSuggestTitles}
                    disabled={isSuggesting}
                    className="absolute right-3 top-3 p-2 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50"
                  >
                    {isSuggesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {suggestedTitles.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Curated Titles</h2>
                  <div className="space-y-3">
                    {suggestedTitles.map((title, i) => (
                      <div 
                        key={i}
                        onClick={() => addToQueue(title)}
                        className="group flex items-start gap-4 p-4 rounded-2xl glass border border-transparent hover:border-indigo-500/30 cursor-pointer transition-all hover:translate-x-1"
                      >
                        <span className="flex-1 text-sm font-medium leading-relaxed group-hover:text-white transition-colors">{title}</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <Plus className="w-4 h-4 text-indigo-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stage Canvas */}
            <div className="flex-1 p-8 overflow-y-auto z-10 scrollbar-hide">
              <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">Generation Canvas</h1>
                    <p className="text-slate-400">Transform ideas into high-converting SEO assets.</p>
                  </div>
                  <div className="flex -space-x-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold ${activeQueueIdx !== null && queue[activeQueueIdx]?.status === 'loading' ? 'animate-pulse bg-indigo-600' : ''}`}>
                        {i}
                      </div>
                    ))}
                  </div>
                </header>

                {queue.length === 0 ? (
                  <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-800/50 rounded-3xl bg-slate-900/20">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-2">
                      <PenTool className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400">Empty Canvas</h3>
                    <p className="text-slate-500 max-w-xs">Select a title from the left to start your automated content engine.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Queue Selection */}
                    <div className="flex gap-2 p-1 bg-slate-900/50 rounded-2xl border border-slate-800/50 overflow-x-auto scrollbar-hide">
                      {queue.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveQueueIdx(i)}
                          className={`flex items-center gap-3 px-5 py-2 rounded-xl transition-all whitespace-nowrap ${activeQueueIdx === i ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-800 text-slate-400"}`}
                        >
                          {item.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                          {item.status === 'done' && <Check className="w-4 h-4" />}
                          <span className="text-sm font-semibold max-w-[120px] truncate">{item.title}</span>
                        </button>
                      ))}
                    </div>

                    {activeQueueIdx !== null && (
                      <div className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="glass p-8 rounded-3xl space-y-10">
                          <div className="flex items-start justify-between gap-6">
                            <h2 className="text-2xl font-bold text-white leading-tight">{queue[activeQueueIdx].title}</h2>
                            <div className="flex gap-2">
                              {queue[activeQueueIdx].status === 'idle' && (
                                <button 
                                  onClick={() => generatePost(activeQueueIdx)}
                                  className="flex items-center gap-2 px-8 py-3 premium-gradient rounded-xl font-bold text-white shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all"
                                >
                                  Generate <ArrowRight className="w-5 h-5" />
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setQueue(queue.filter((_, i) => i !== activeQueueIdx));
                                  setActiveQueueIdx(null);
                                }}
                                className="p-3 text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-6 h-6" />
                              </button>
                            </div>
                          </div>

                          {queue[activeQueueIdx].status === 'loading' ? (
                            <div className="py-20 flex flex-col items-center gap-8 text-center">
                              <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400" />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-xl font-bold text-indigo-400">AI Orchesration in Progress</h3>
                                <p className="text-slate-500">Six specialized agents are collaborating to create your masterpiece...</p>
                              </div>
                              {/* Fake Step Progress */}
                              <div className="w-full max-w-md grid grid-cols-6 gap-2">
                                {[1,2,3,4,5,6].map(s => (
                                  <div key={s} className="h-1.5 bg-indigo-500/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 animate-pulse w-full" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : queue[activeQueueIdx].status === 'done' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-500">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Tags className="w-4 h-4" /> SEO Keywords
                                  </h4>
                                  <button onClick={() => copyToClipboard(queue[activeQueueIdx].tags)} className="text-xs text-indigo-400 hover:underline">Copy</button>
                                </div>
                                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-sm leading-relaxed text-indigo-200">
                                  {queue[activeQueueIdx].tags}
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Code className="w-4 h-4" /> HTML Body
                                  </h4>
                                  <button onClick={() => copyToClipboard(queue[activeQueueIdx].html)} className="text-xs text-indigo-400 hover:underline">Copy All</button>
                                </div>
                                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 font-mono text-[10px] h-[150px] overflow-y-auto scrollbar-hide text-slate-400">
                                  {queue[activeQueueIdx].html}
                                </div>
                              </div>
                              <div className="md:col-span-2 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Preview
                                  </h4>
                                </div>
                                <div className="p-8 rounded-3xl glass-dark border border-slate-800/50 max-h-[400px] overflow-y-auto scrollbar-hide">
                                  <div className="prose prose-invert prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: queue[activeQueueIdx].html }} />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-20 text-center space-y-6">
                              <div className="animate-float inline-block">
                                <Sparkles className="w-12 h-12 text-indigo-500/50" />
                              </div>
                              <p className="text-slate-500">The stage is set. Press generate to begin the magic.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Library View */
          <div className="flex-1 p-8 overflow-y-auto z-10 scrollbar-hide">
            <div className="max-w-6xl mx-auto space-y-10">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-black tracking-tight text-white mb-2">Content Library</h1>
                  <p className="text-slate-400">Access and manage all your generated assets in one place.</p>
                </div>
                <button onClick={fetchHistory} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
                  <Loader2 className={`w-5 h-5 ${isSuggesting ? 'animate-spin' : ''}`} />
                </button>
              </header>

              {selectedHistory ? (
                <div className="animate-in fade-in zoom-in-95 duration-300 space-y-8">
                  <button onClick={() => setSelectedHistory(null)} className="flex items-center gap-2 text-indigo-400 font-bold hover:translate-x-[-4px] transition-all">
                    <ChevronRight className="w-5 h-5 rotate-180" /> Back to List
                  </button>
                  <div className="glass p-10 rounded-[40px] space-y-10">
                    <div className="flex items-start justify-between gap-8">
                      <h2 className="text-4xl font-black text-white leading-tight">{selectedHistory.title}</h2>
                      <div className="flex gap-3">
                        <button onClick={() => copyToClipboard(selectedHistory.html)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-2xl font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
                          <Clipboard className="w-5 h-5" /> Copy HTML
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-2">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Metadata</h4>
                          <p className="text-sm text-slate-400">Created: {selectedHistory.generatedAt}</p>
                          <p className="text-sm text-slate-400">ID: {selectedHistory.id}</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-2">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tags</h4>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {selectedHistory.tags.split(", ").map((t, i) => (
                              <span key={i} className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">#{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="lg:col-span-2 h-[600px] overflow-y-auto rounded-3xl bg-white p-10 text-[#222]">
                        <div className="prose prose-slate max-w-none prose-img:rounded-2xl" dangerouslySetInnerHTML={{ __html: selectedHistory.html }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-500">
                  {history.length === 0 ? (
                    <div className="col-span-full py-40 text-center text-slate-500 border-2 border-dashed border-slate-800/50 rounded-[40px]">
                      No history found. Start generating to build your library.
                    </div>
                  ) : (
                    history.map((post, i) => (
                      <div 
                        key={i}
                        onClick={() => post.id && fetchHistoryDetail(post.id)}
                        className="group relative p-8 rounded-[32px] glass border border-slate-800/50 hover:border-indigo-500/40 cursor-pointer transition-all hover:translate-y-[-8px] hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col h-[320px]"
                      >
                        <div className="mb-4">
                           <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest">{post.generatedAt?.split(' ')[0]}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 line-clamp-3 leading-tight group-hover:text-indigo-300 transition-colors">{post.title}</h3>
                        <p className="text-sm text-slate-400 line-clamp-3 mb-6 flex-1 italic">{post.metaDesc}</p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/50">
                          <div className="flex -space-x-1">
                            {[1,2,3].map(j => <div key={j} className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[8px]">A</div>)}
                          </div>
                          <div className="flex items-center gap-1 text-indigo-400 text-xs font-bold group-hover:gap-2 transition-all">
                            View Post <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
