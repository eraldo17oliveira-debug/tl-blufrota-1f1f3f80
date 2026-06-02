import { useState } from "react";
import { Search, Minus, Plus, Youtube, Loader2 } from "lucide-react";

const YT_API_KEY = "AIzaSyBNOzPdtU7i2DNFogYGibJ6p7GKJE-bGCc";

type Video = { id: string; title: string; thumb: string; channel: string };

export default function YoutubeMiniPlayer() {
  const [minimized, setMinimized] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Video | null>(null);

  const buscar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`;
      const r = await fetch(url);
      const j = await r.json();
      const vids: Video[] = (j.items || []).map((it: any) => ({
        id: it.id.videoId,
        title: it.snippet.title,
        thumb: it.snippet.thumbnails?.default?.url || "",
        channel: it.snippet.channelTitle,
      }));
      setResults(vids);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed top-14 left-2 z-50 glass-card border border-primary/40 rounded-xl shadow-[0_0_30px_hsl(var(--primary)/0.5)] overflow-hidden flex flex-col"
      style={{ width: minimized ? 200 : 340 }}
    >
      <div className="flex items-center gap-2 px-2 py-1.5 bg-gradient-to-r from-red-600/30 to-red-900/30 border-b border-primary/30 select-none">
        <Youtube className="h-4 w-4 text-red-500" />
        <span className="font-orbitron text-[0.65rem] text-primary uppercase tracking-wider flex-1">YOUTUBE</span>
        <button onClick={() => setMinimized(!minimized)} className="text-muted-foreground hover:text-primary" title={minimized ? "EXPANDIR" : "MINIMIZAR"}>
          {minimized ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </button>
      </div>

      {!minimized && (
        <>
          <form onSubmit={buscar} className="flex gap-1 p-2 border-b border-border/30">
            <div className="flex-1 relative">
              <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="BUSCAR VIDEO..."
                className="w-full pl-7 pr-2 py-1.5 text-xs font-orbitron bg-background/50 border border-primary/30 rounded focus:outline-none focus:border-primary uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-xs font-orbitron bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded uppercase disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "GO"}
            </button>
          </form>

          {current && (
            <div className="aspect-video bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${current.id}?autoplay=1`}
                title={current.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="max-h-56 overflow-y-auto">
            {results.length === 0 && !loading && (
              <div className="p-3 text-center text-[0.65rem] text-muted-foreground font-orbitron uppercase">
                {current ? "BUSQUE OUTRO VIDEO" : "DIGITE E BUSQUE UM VIDEO"}
              </div>
            )}
            {results.map((v) => (
              <button
                key={v.id}
                onClick={() => setCurrent(v)}
                className={`w-full flex gap-2 p-2 border-b border-border/20 hover:bg-primary/10 transition-colors text-left ${
                  current?.id === v.id ? "bg-primary/20" : ""
                }`}
              >
                <img src={v.thumb} alt="" className="w-16 h-12 object-cover rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[0.7rem] font-semibold line-clamp-2 text-foreground">{v.title}</div>
                  <div className="text-[0.6rem] text-muted-foreground font-orbitron uppercase truncate mt-0.5">{v.channel}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
