// Official/primary-source feeds -> out/official.json. Fail-safe: each source is independent; a failure is recorded, never fatal.
import fs from "node:fs";
const SRC = [
  { id:"rbi", name:"RBI press releases", kind:"reg", url:"https://www.rbi.org.in/pressreleases_rss.xml" },
  { id:"rbi-n", name:"RBI notifications", kind:"reg", url:"https://www.rbi.org.in/notifications_rss.xml" },
  { id:"sebi", name:"SEBI", kind:"reg", url:"https://www.sebi.gov.in/sebirss.xml" },
  { id:"pib", name:"PIB (Finance)", kind:"reg", url:"https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3" },
  { id:"gh", name:"GitHub changelog", kind:"tool", url:"https://github.blog/changelog/feed/" },
  { id:"oai", name:"OpenAI news", kind:"tool", url:"https://openai.com/news/rss.xml" },
  { id:"vercel", name:"Vercel changelog", kind:"tool", url:"https://vercel.com/atom" },
  { id:"claude", name:"Claude Code releases", kind:"tool", url:"https://github.com/anthropics/claude-code/releases.atom" },
  { id:"codex", name:"OpenAI Codex releases", kind:"tool", url:"https://github.com/openai/codex/releases.atom" }
];
const tag = (s, t) => { const m = new RegExp("<"+t+"[^>]*>([\\s\\S]*?)</"+t+">", "i").exec(s); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim() : ""; };
const out = { generated:new Date().toISOString(), sources:[], items:[] };
for(const s of SRC){
  const st = { id:s.id, name:s.name, kind:s.kind, ok:false, n:0 };
  try{
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(s.url, { signal:ctl.signal, headers:{ "user-agent":"Mozilla/5.0 NewsIntelligence" } }); clearTimeout(tm);
    if(!r.ok) throw new Error("HTTP "+r.status);
    const x = await r.text(), blocks = x.match(/<(item|entry)[\s>][\s\S]*?<\/(item|entry)>/gi) || [];
    for(const b of blocks.slice(0, 15)){
      const link = (/<link[^>]*href="([^"]+)"/i.exec(b) || [])[1] || tag(b, "link"), title = tag(b, "title"), d = tag(b, "pubDate") || tag(b, "updated") || tag(b, "published");
      const t = Date.parse(d); if(!title || !link) continue;
      out.items.push({ src:s.id, name:s.name, kind:s.kind, title:title.slice(0, 220), link, t:isNaN(t) ? null : t });
    }
    st.n = blocks.length; st.ok = blocks.length > 0; if(!st.ok) st.err = "no entries";
  }catch(e){ st.err = String(e.message || e).slice(0, 80); }
  out.sources.push(st);
}
out.items.sort((a, b) => (b.t || 0) - (a.t || 0));
fs.mkdirSync("out", { recursive:true });
if(out.items.length) fs.writeFileSync("out/official.json", JSON.stringify(out));
else console.log("official: nothing fetched; previous file carried over by workflow");
