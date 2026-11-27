/*ENGINE:START — pure logic, no DOM. Tested in Node (see /home/claude/tests). Do not reference document/window here.*/
const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Chandigarh","Puducherry"];
const STATE_CITIES = { "Rajasthan":"jaipur|jodhpur|udaipur|kota|ajmer|bikaner|alwar|bhilwara", "Maharashtra":"mumbai|pune|nagpur|nashik|thane|aurangabad", "Delhi":"delhi|ncr", "Gujarat":"ahmedabad|surat|vadodara|rajkot|gandhinagar", "Karnataka":"bengaluru|bangalore|mysuru|mangaluru|hubballi", "Tamil Nadu":"chennai|coimbatore|madurai", "Telangana":"hyderabad|warangal", "West Bengal":"kolkata|howrah|siliguri", "Uttar Pradesh":"lucknow|kanpur|noida|varanasi|agra|prayagraj|ghaziabad", "Kerala":"kochi|thiruvananthapuram|kozhikode", "Punjab":"ludhiana|amritsar|jalandhar", "Madhya Pradesh":"bhopal|indore|jabalpur|gwalior", "Bihar":"patna|gaya", "Haryana":"gurugram|gurgaon|faridabad", "Odisha":"bhubaneswar|cuttack", "Assam":"guwahati" };

/* ---------- feeds ---------- */
// Google News searches (every story is classified on the device). tier 1 loads first.
const FEEDS = [
  { id:"f-india",   label:"India",             q:'India', def:"india", tier:1 },
  { id:"f-world",   label:"World",             q:'world OR international OR global', ed:"GB", def:"world", tier:1 },
  { id:"f-live",    label:"Live world events", q:'airstrike OR earthquake OR cyclone OR "death toll" OR ceasefire OR wildfire OR evacuation OR "plane crash" OR hostages OR explosion', ed:"GB", def:"world", tier:1 },
  { id:"f-politics",label:"Politics",          q:'politics OR election OR parliament OR "chief minister"', def:"politics", tier:1 },
  { id:"f-gov",     label:"Policy & courts",   q:'government OR cabinet OR policy OR "Supreme Court" OR "High Court"', def:"govt" },
  { id:"f-biz",     label:"Business",          q:'business OR company OR startup OR funding OR earnings', def:"business", tier:1 },
  { id:"f-mkt",     label:"Markets",           q:'Sensex OR Nifty OR "stock market" OR shares', def:"markets", tier:1 },
  { id:"f-bfsi",    label:"BFSI & regulators", q:'RBI OR SEBI OR IRDAI OR NBFC OR "housing finance" OR "bank fraud" OR "mutual fund" OR insurance', def:"business", tier:1 },
  { id:"f-tax",     label:"Tax, audit & compliance", q:'GST OR "income tax" OR CBDT OR ICAI OR NFRA OR "Companies Act" OR "Ind AS" OR audit OR "tax return"', def:"business" },
  { id:"f-eco",     label:"Economy & RBI",     q:'RBI OR economy OR inflation OR banking OR GDP', def:"economy" },
  { id:"f-tech",    label:"Tech & AI",         q:'technology OR AI OR "artificial intelligence" OR smartphone', def:"tech", tier:1 },
  { id:"f-sci",     label:"Science & space",   q:'science OR ISRO OR space OR research', def:"science", tier:1 },
  { id:"f-def",     label:"Defence & infra",   q:'defence OR army OR infrastructure OR railway OR highway', def:"defence" },
  { id:"f-auto",    label:"Auto & property",   q:'automobile OR "electric vehicle" OR "real estate" OR housing', def:"auto" },
  { id:"f-cricket", label:"Cricket",           q:'cricket', def:"cricket", tier:1 },
  { id:"f-sport",   label:"Other sports",      q:'football OR tennis OR hockey OR badminton OR Olympics OR chess', def:"othersports" },
  { id:"f-ent",     label:"Entertainment",     q:'Bollywood OR film OR OTT OR Netflix OR celebrity', def:"entertainment" },
  { id:"f-health",  label:"Health & education",q:'health OR hospital OR education OR exam OR university', def:"health" },
  { id:"f-life",    label:"Climate & life",    q:'climate OR weather OR pollution OR travel OR lifestyle', def:"environment" },
  { id:"f-nbfc",   label:"NBFC & lending",    q:'NBFC OR "housing finance" OR "digital lending" OR "master direction" OR "RBI circular" OR "credit rating" OR "gross NPA"', def:"business", tier:1 },
  { id:"f-audit",  label:"Audit & accounting",q:'NFRA OR ICAI OR "statutory auditor" OR "audit report" OR "Ind AS" OR CARO OR "forensic audit" OR "auditor resigns"', def:"business", tier:1 },
  { id:"f-reg",    label:"Regulators & tax",  q:'CBDT OR CBIC OR "GST Council" OR "SEBI circular" OR "SEBI order" OR MCA OR IBBI OR NCLT OR "tax notification"', def:"business", tier:1 },
  { id:"f-ai",     label:"AI & builders",     q:'Anthropic OR OpenAI OR Gemini OR "AI agent" OR LLM OR "AI startup" OR "open-source model"', ed:"GB", def:"tech", tier:1 },
  { id:"f-mumbai", label:"Mumbai & Maharashtra", q:'Mumbai OR BMC OR "Mumbai local" OR Maharashtra', def:"india" },
  { id:"f-fit",    label:"Fitness & wellbeing",q:'fitness OR "strength training" OR nutrition OR protein OR sleep OR longevity', ed:"GB", def:"health" },
  { id:"f-glob",   label:"Global markets",    q:'"Federal Reserve" OR "oil prices" OR "global markets" OR "US economy" OR gold OR "dollar index"', ed:"GB", def:"economy", tier:1 },
  { id:"f-startup",label:"Startups & funding",q:'"Indian startup" OR "funding round" OR SaaS OR unicorn OR IPO', def:"business" },
];
// Feeds that were added in this version. Cached days saved before it lack them, so they are marked "not loaded" and can be retried.
const NEW_FEED_IDS = ["f-live","f-bfsi","f-tax","f-nbfc","f-audit","f-reg","f-ai","f-mumbai","f-fit","f-glob","f-startup"];
// Optional direct regulator feeds (OFF by default; they need a relay that allows these hosts and the URLs below were NOT verified from the build environment).
const OFFICIAL_FEEDS = [
  { id:"o-rbi",  label:"RBI press releases", url:"https://www.rbi.org.in/pressreleases_rss.xml", source:"Reserve Bank of India", def:"bfsi", tier:2, official:true },
  { id:"o-sebi", label:"SEBI releases",      url:"https://www.sebi.gov.in/sebirss.xml",          source:"SEBI",                  def:"bfsi", tier:2, official:true },
  { id:"o-pib",  label:"PIB (Govt of India)",url:"https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3", source:"Press Information Bureau", def:"govt", tier:2, official:true },
];
const EDITIONS = { IN:"hl=en-IN&gl=IN&ceid=IN:en", GB:"hl=en-GB&gl=GB&ceid=GB:en" };

/* ---------- taxonomy ----------
   Every story-event gets EXACTLY ONE leaf (primary) topic; every leaf belongs to EXACTLY ONE group.
   Groups are the "primary topics" shown on the home page. Anything else an event also touches is a tag (never a second home). */
const GROUPS = ["live","bfsi","india","world","politics","business","markets","tech","science","life","sports","entertainment"];
const LEAF_GROUP = {
  live:"live", bfsi:"bfsi", india:"india", govt:"india", courts:"india", defence:"india", infra:"india", world:"world", politics:"politics",
  business:"business", corporate:"business", startups:"business", auto:"business", realestate:"business", economy:"business",
  markets:"markets", tech:"tech", ai:"tech", science:"science", space:"science",
  health:"life", education:"life", environment:"life", travel:"life", lifestyle:"life",
  sports:"sports", cricket:"sports", football:"sports", tennis:"sports", othersports:"sports",
  entertainment:"entertainment", bollywood:"entertainment", ott:"entertainment",
};
const CATS = [
  { id:"top", label:"Top stories" },
  { id:"live", label:"Live World Events" }, { id:"bfsi", label:"BFSI & CA Intelligence" },
  { id:"india", label:"India" }, { id:"world", label:"World" }, { id:"politics", label:"Politics" },
  { id:"govt", label:"Government & policy" }, { id:"courts", label:"Courts & legal" }, { id:"defence", label:"Defence" }, { id:"infra", label:"Infrastructure" },
  { id:"business", label:"Business" }, { id:"markets", label:"Markets" }, { id:"economy", label:"Economy" }, { id:"corporate", label:"Corporate" },
  { id:"startups", label:"Startups" }, { id:"auto", label:"Automobile" }, { id:"realestate", label:"Real estate" },
  { id:"tech", label:"Technology" }, { id:"ai", label:"Artificial intelligence" }, { id:"science", label:"Science" }, { id:"space", label:"Space & ISRO" },
  { id:"life", label:"Life & society" }, { id:"health", label:"Health" }, { id:"education", label:"Education" }, { id:"environment", label:"Environment & climate" },
  { id:"travel", label:"Travel" }, { id:"lifestyle", label:"Lifestyle" },
  { id:"sports", label:"Sports" }, { id:"cricket", label:"Cricket" }, { id:"football", label:"Football" }, { id:"tennis", label:"Tennis" }, { id:"othersports", label:"Other sports" },
  { id:"entertainment", label:"Entertainment" }, { id:"bollywood", label:"Bollywood" }, { id:"ott", label:"OTT & streaming" },
  { id:"state", label:"" },
];
const CAT_BY_ID = Object.fromEntries(CATS.map(c => [c.id, c]));
const CAT_ALIAS = { banking:"bfsi", misc:"top", top:"top" };          // old addresses (#c=banking) still work
const GROUP_KIDS = {}; GROUPS.forEach(g => { GROUP_KIDS[g] = Object.keys(LEAF_GROUP).filter(l => LEAF_GROUP[l]===g && l!==g); });
const catLabelOf = id => (CAT_BY_ID[id]||{label:id}).label;
const SHORT = { live:"Live events", bfsi:"BFSI & CA" };
const catShort = id => SHORT[id] || catLabelOf(id);

/* ---------- classification rules (ordered; the FIRST match is the primary topic) ---------- */
const W = (s, f) => new RegExp("\\b(?:" + s + ")\\b", f || "i");
const SPORTS_CTX = W("cricket|ipl|bcci|fifa|premier league|la liga|champions league|isl|nba|nfl|tennis|wimbledon|olympics?|hockey|badminton|kabaddi|formula 1|f1|test match|odi|t20i?|wickets?|innings|grand slam|world cup|asia cup|ranji|league|tournament|semi-?final|quarter-?final|knockout");
const ENT_CTX = W("film|films|movie|movies|trailer|teaser|box office|web series|album|bollywood|ott|netflix|prime video|hotstar|season \\d|episode|actor|actress|singer|song");
const CASUALTY = /\b(?:\d[\d,]*\s+(?:people\s+|persons\s+|civilians\s+|soldiers\s+|workers\s+|pilgrims\s+|tourists\s+)?(?:dead|killed|die[ds]?|injured|missing|lost their lives|feared dead)|(?:kills?|killing|killed)\s+(?:at least\s+|over\s+|more than\s+)?\d[\d,]*|(?:dozens|scores|hundreds)\s+(?:dead|killed|trapped|injured|missing|feared dead))\b/i;
const LIVE_STRONG = W("air ?strikes?|missile (?:strikes?|attacks?)|drone (?:strikes?|attacks?)|shelling|bombardment|cease-?fire|truce|hostages?|death toll|earthquakes?|quakes?|tsunami|cyclone|hurricane|typhoon|wildfires?|landslides?|volcan\\w+|flash floods?|evacuat\\w+|(?:cargo )?(?:plane|aircraft|helicopter|jet|air) crash(?:es|ed)?|train (?:derail\\w*|collision)|building collapse|bridge collapse|dam (?:burst|collapse)|mine collapse|stampede|terror(?:ist)? attacks?|suicide (?:bomb\\w*|attack)|mass shooting|gunmen (?:attack|open fire|kill)|coup|martial law|state of emergency|gas leak|boat capsiz\\w+|(?:explosion|blast)s? (?:kills?|killed|rocks?|rocked|at|in|near|hits?|injures?|leaves?)|(?:floods?|flooding) (?:kills?|killed|hits?|swamps?|displaces?|ravages?|wreaks?|batters?|leaves?)|(?:war|conflict|fighting|clashes) (?:in|on|between|against|erupts?)|(?:killed|dead|dies|died|trapped) (?:in|after) (?:a |an |the )?(?:blast|attack|strike|crash|fire|flood|landslide|collapse|clashes?|shooting|explosion|quake|earthquake)");
const LIVE_GEO = /\b(?:russia\w*|ukrain\w*|gaza|israel\w*|hamas|hezbollah|houthis?|iran\w*|lebanon|syria\w*|sudan\w*|yemen|myanmar|taiwan strait|red sea)\b.*\b(?:strikes?|attacks?|war|offensive|troops|invasion|killed|missiles?|drones?|bombs?|bombing|shelling|fighting|clashes)\b/i;
const LIVE_LOC = /\b(?:loc|line of control)\b.*\b(?:firing|infiltrat\w+|ceasefire violation)/i;

const MKT_IDX = W("sensex|nifty|bank nifty|dalal street|stock market|share market|equity market|market (?:wrap|opens?|closes?|outlook|rally|crash)|top (?:gainers|losers)|fiis?|diis?|fpis?|stocks? to (?:buy|watch)|buzzing stocks|rupee (?:falls?|rises?|opens?|settles?|closes?|slips?|gains?|weakens?|strengthens?|hits?)|rupee against|gold (?:price|rate)s?|gold (?:hits?|touch\w*|rises?|falls?|jumps?|slips?|surges?|crash\w*|climbs?|drops?)|silver (?:price|rate)s?|crude (?:oil )?prices?|brent|bitcoin|crypto(?:currency)?|ipo|gmp|listing gains?|(?:shares?|stocks?) (?:jump|surge|rally|fall|slump|tumble|soar|climb|gain|drop|plunge|rise|slide|zoom|crash|hit|settle|end|open)\\w*|market cap|bull run|bear market");
const BFSI_CORE = W("rbi|reserve bank|sebi|irdai|pfrda|nhb|nabard|ibbi|nclt|nclat|icai|nfra|mca|cbdt|cbic|gstn?|gst council|income[- ]tax|itr|tds|advance tax|tax (?:audit|return|returns|filing|notice|notices|evasion|refunds?|slabs?|demand)|companies act|insolvency|ind ?as|audit(?:s|ed|ors?|ing)?|statutory|cag|lfar|caro|npas?|gnpa|nbfcs?|hfcs?|housing finance|microfinance|banks?|banking|lenders?|bad loans?|repo rate|reverse repo|crr|slr|monetary policy|mpc|insurers?|insurance|mutual funds?|amfi|kyc|aml|money laundering|fema|enforcement directorate|digital lending|upi|npci|fintech|deposit rates?|epfo|nps|credit (?:card|growth|rating|score|policy)|crisil|icra|care ratings|lic|life insurance corporation|premium income|sbi|state bank|hdfc bank|icici bank|axis bank|kotak mahindra|bank of baroda|pnb|canara bank|union bank of india|idfc first|yes bank|bajaj finance|bajaj finserv|cyber ?fraud");
const BFSI_BROAD = W("fraud|scam|ponzi|loans?|loan (?:growth|waiver)|home loans?|interest rates?|forex reserves?|mpc|pension fund|finance ministry|financial inclusion|cyber ?fraud");
const RULES = [
  { id:"cricket", re:W("cricket|ipl|odi|t20i?|test match|test series|bcci|wickets?|virat kohli|kohli|rohit sharma|ms dhoni|dhoni|jasprit bumrah|bumrah|shubman gill|india women|women'?s world cup|women in blue|ranji|asia cup|icc|innings|batter|bowler|world test championship") },
  { id:"football", re:W("football|fifa|premier league|isl|la liga|serie a|bundesliga|messi|ronaldo|uefa|champions league|striker|manchester (?:united|city)|real madrid|barcelona|liverpool|arsenal") },
  { id:"tennis", re:W("tennis|atp|wta|wimbledon|us open|french open|australian open|djokovic|alcaraz|sinner|grand slam") },
  { id:"othersports", re:W("(?:doubles|singles) (?:title|final|crown)|open (?:title|final|semi-?final)|lakshya sen|satwik|chirag shetty|srikanth|hockey|badminton|chess|olympics?|athletics|wrestling|boxing|kabaddi|f1|formula 1|golf|(?:rifle|pistol|skeet|trap) shooting|shooters?|khelo india|sports ministry|sports authority|asian games|commonwealth games|paralympics?|neeraj chopra|pv sindhu|medal|grand prix|gukesh|sprinter|marathon runner") },
  { id:"bollywood", re:W("bollywood|shah rukh khan|salman khan|aamir khan|ranbir kapoor|deepika padukone|alia bhatt|hindi film|akshay kumar|ranveer singh|katrina kaif|kareena kapoor") },
  { id:"ott", re:W("netflix|prime video|hotstar|jiocinema|zee5|sonyliv|ott|streaming|web series|disney\\+|season \\d+ (?:review|release|trailer)") },
  { id:"entertainment", re:W("shooting (?:begins|wraps|starts|resumes|schedule)|reality show|bigg boss|season finale|films?|movies?|actor|actress|celebrity|celebrities|singer|box office|trailer|album|music video|tollywood|kollywood|mollywood|grammy|oscars?|golden globe|concert|teaser|biopic|director's|hollywood") },
  { id:"defence", re:W("defence|defense|army|navy|air force|iaf|military|missile test|drdo|border|soldiers?|terror(?:ists?|ism)?|ceasefire|armed forces|fighter jets?|lac|encounter|infiltrat\\w+|naxal\\w*|maoists?|operation sindoor") },
  { id:"courts", re:W("court|judge|verdict|bail|petition|cji|tribunal|lawsuit|legal|hearing|plea|convicted|acquitted|sentenced|supreme court|high court|pil"), cs:/\b(?:SC|HC)\b/ },
  { id:"politics", re:W("elections?|polls?|bjp|congress|aap|tmc|dmk|shiv sena|ncp|jdu|rjd|samajwadi|minister|ministers|mla|mlas|mp|parliament|lok sabha|rajya sabha|opposition|chief minister|campaign|vote|voters?|ballot|senate|president|prime minister|manifesto|rally|coalition|lawmakers?|speaker") },
  { id:"govt", re:W("cabinet (?:approves?|clears?|nod|okays?)|government|govt|policy|ministry|scheme|notification|niti aayog|regulation|bill|ordinance|centre|panchayat|subsidy|census|aadhaar|pm-?kisan|budget|ration") },
  { id:"ai", re:W("ai|artificial intelligence|chatgpt|openai|gemini|llms?|machine learning|genai|generative ai|anthropic|claude|copilot|deepseek|nvidia|ai agents?"), cs:/\bAI\b/ },
  { id:"tech", re:W("technology|tech|smartphones?|iphone|android|apple|google|microsoft|meta|software|apps?|chips?|semiconductors?|5g|6g|cyber|internet|gadgets?|laptops?|samsung|whatsapp|instagram|youtube|x corp|starlink|data breach|hackers?|ransomware|windows|chrome|amazon web services|aws") },
  { id:"space", re:W("isro|nasa|space|satellites?|rockets?|moon|mars|chandrayaan|gaganyaan|orbit|astronauts?|spacex|launch window|asteroid|telescope") },
  { id:"science", re:W("science|scientists?|research|researchers|study finds|discovery|physics|chemistry|biology|genome|species|fossil|nobel|dinosaur|quantum") },
  { id:"health", re:W("flu|swine flu|chikungunya|measles|health|hospital|doctors?|disease|virus|covid|dengue|cancer|vaccines?|medical|aiims|outbreak|malaria|diabetes|surgery|pharma|drug|medicines?|patients?"), cs:/\bWHO\b/ },
  { id:"education", re:W("education|school|schools|college|university|exams?|neet|jee|cbse|ugc|students?|admissions?|nta|results declared|board exams?|cuet|teachers?") },
  { id:"environment", re:W("climate|environment|pollution|aqi|air quality|heatwave|monsoon|rains?|wildlife|forest|emissions|cop\\d+|global warming|tiger|elephant|glacier|drought|cold wave|fog") },
  { id:"travel", re:W("travel|tourism|tourists?|flights?|airlines?|visa|indigo|air india|passport|hotel|railway ticket|irctc|holiday destination") },
  { id:"lifestyle", re:W("lifestyle|fashion|food|recipes?|beauty|wellness|festival|diwali|navratri|horoscope|fitness|yoga|wedding|skincare|diet|astrology") },
  { id:"auto", re:W("cars?|suv|ev|evs|electric vehicles?|automobile|auto|two-wheeler|bikes?|maruti|hyundai|tata motors|mahindra|vehicle sales|scooters?|bajaj auto|hero motocorp|toyota|honda|kia|royal enfield|tesla") },
  { id:"realestate", re:W("real estate|housing|property|realty|rera|apartments?|builders?|flats?|housing sales|office space|dlf|godrej properties") },
  { id:"startups", re:W("startups?|start-ups?|funding round|raises \\$?[\\d.]+|series [a-e]|unicorn|venture|seed round|founders?|zepto|swiggy|zomato|paytm|ola electric|byju'?s") },
  { id:"economy", re:W("economy|economic|gdp|inflation|cpi|wpi|fiscal|trade deficit|exports?|imports?|tariffs?|trade deal|iip|pmi|unemployment|jobs data|poverty|growth forecast|imf|world bank|oecd") },
  { id:"corporate", re:W("ceo|chairman|board|resigns?|appoints?|stake|merger|acquisition|acquires?|results|dividend|q[1-4]|net profit|quarterly|tata|reliance|adani|infosys|wipro|mahindra|hcl|tcs|layoffs?|earnings|revenue|profit|buyout|demerger") },
  { id:"business", re:W("business|company|firm|jio|airtel|vodafone idea|telecom|deal|industry|sales|retail|manufacturing|supply chain|plant|factory|exports|brand|consumer|e-commerce|amazon|flipkart|walmart") },
  { id:"infra", re:W("infrastructure|highway|expressway|metro|railways?|rail|port|bridge|nhai|construction|flyover|tunnel|smart city|bullet train|airports?|vande bharat") },
  { id:"india", re:W("india|indian|indians|modi|delhi|mumbai|bengaluru|kolkata|chennai|hyderabad|ahmedabad|pune|jaipur|lucknow|bharat|new delhi|uttar pradesh|maharashtra|bihar|karnataka|kerala|gujarat|rajasthan|tamil nadu|punjab|assam") },
  { id:"world", re:W("china|chinese|russia|russian|ukraine|israel|gaza|iran|pakistan|britain|british|europe|european|nato|japan|trump|putin|biden|xi jinping|global|bangladesh|nepal|sri lanka|world|canada|australia|france|germany|south korea|north korea|saudi|uae|dubai|brazil|mexico|turkey|egypt|africa|zelensky|netanyahu|macron|starmer|white house|kremlin|united nations|brics"), cs:/\b(?:US|UK|UN|EU|USA)\b/ },
];
const RULE_BY_ID = Object.fromEntries(RULES.map(r => [r.id, r]));
const INDIA_TERMS = RULE_BY_ID.india.re;
const FOREIGN = W("federal reserve|fed chair|powell|ecb|european central bank|bank of england|bank of japan|china|chinese|russia|russian|ukraine|israel|gaza|iran|pakistan|pakistani|britain|british|american|europe|european|nato|japan|japanese|trump|putin|biden|xi jinping|bangladesh|nepal|sri lanka|canada|australia|france|french|german|germany|south korea|north korea|saudi|uae|brazil|mexico|turkey|egypt|africa|zelensky|netanyahu|macron|starmer|white house|kremlin|united nations|brics|taiwan|singapore|indonesia|malaysia|vietnam|thailand|afghanistan|midterms?|congress(?:man|woman) \\w+ of|senate|house republicans|democrats|republicans");
const FOREIGN_CS = /\b(?:US|UK|EU|UN|USA)\b/;
const FOREIGN_SENSITIVE = ["defence","courts","politics","govt","economy","infra","corporate","business"];
const NONKINETIC_WAR = /\b(?:price|trade|tariff|tech|chip|currency|turf|bidding|streaming|subsidy|ratings|cold|culture|cola|word|talent)\s+wars?\b/ig;
const hit = (rule, t) => { const m = rule.re.exec(t); if(m) return m; return rule.cs ? rule.cs.exec(t) : null; };

// classify(): returns the ONE primary topic, its group, extra tags, and why. Pure and deterministic.
function classify(item, stateName){
  const t = item.title, why = { primary:null, term:"" };
  let primary = null, term = "";
  const sportsy = SPORTS_CTX.test(t), enty = ENT_CTX.test(t);
  const cas = CASUALTY.exec(t);
  let live = null;
  const tl = t.replace(NONKINETIC_WAR, " ");
  if(cas) live = cas;
  else if(!sportsy && !enty) live = LIVE_STRONG.exec(tl) || LIVE_GEO.exec(tl) || LIVE_LOC.exec(tl);
  else if(sportsy && /\bstampede|earthquake|terror|attack on|killed|dead|death toll\b/i.test(t) && /\b(?:killed|dead|death toll|stampede|terror)\b/i.test(t) && !/\b(?:kills?|killed) (?:it|the|his|her|their|time|opponents?)\b/i.test(t)) live = LIVE_STRONG.exec(t);
  const mi = MKT_IDX.exec(t), bc = BFSI_CORE.exec(t);
  if(live){ primary = "live"; term = live[0]; }
  else if(mi && bc){ primary = mi.index <= bc.index ? "markets" : "bfsi"; term = (primary==="markets" ? mi : bc)[0]; }   // whichever the headline leads with
  else if(bc && !SPORTS_CTX.test(t.replace(bc[0],"")) && !/\b(?:film|movie|trailer|box office|web series)\b/i.test(t)){ primary = "bfsi"; term = bc[0]; }
  else if(mi){ primary = "markets"; term = mi[0]; }
  else {
    for(const r of RULES){ const m = hit(r, t); if(m){ primary = r.id; term = m[0]; break; } }
    if(primary && FOREIGN_SENSITIVE.includes(primary) && (FOREIGN.test(t) || FOREIGN_CS.test(t)) && !INDIA_TERMS.test(t)){ const f = FOREIGN.exec(t) || FOREIGN_CS.exec(t); primary = "world"; term = f[0]; }
    if(primary && !["cricket","football","tennis","othersports","bollywood","ott","entertainment"].includes(primary)){
      const bb = BFSI_BROAD.exec(t); if(bb && ["india","world","business","corporate","govt","startups","economy","tech"].includes(primary)){ primary = "bfsi"; term = bb[0]; }
    }
  }
  let conf = "high";
  if(!primary){
    const feed = FEEDS.concat(OFFICIAL_FEEDS).find(f => f.id===item.feed);
    primary = feed && LEAF_GROUP[feed.def] ? feed.def : "india"; conf = "low"; term = "feed:"+(item.feed||"?");
  }
  const tags = new Set();
  if(primary!=="live" && (LIVE_STRONG.test(t) || CASUALTY.test(t)) && !sportsy && !enty) tags.add("live");
  if(primary!=="markets" && MKT_IDX.test(t)) tags.add("markets");
  if(primary!=="bfsi" && BFSI_CORE.test(t) && !sportsy) tags.add("bfsi");
  for(const r of RULES){ if(r.id!==primary && hit(r, t)) tags.add(r.id); }
  // leaves that share a group with the primary add no information as tags
  tags.delete(primary);
  if(stateName){
    const re = new RegExp("\\b(" + stateName.toLowerCase() + (STATE_CITIES[stateName] ? "|"+STATE_CITIES[stateName] : "") + ")\\b", "i");
    if(item.feed==="f-state" || re.test(t)) tags.add("state");
  }
  return { primary, group:LEAF_GROUP[primary], tags:[...tags], conf, term };
}

/* ---------- sub-topics, severity, source reliability ---------- */
const BFSI_SUBS = [
  ["tax", "Tax, GST & compliance", W("gst|gstn|income[- ]tax|itr|tds|advance tax|tax (?:audit|return|returns|filing|notice|notices|evasion|refunds?|slabs?)|cbdt|cbic|customs duty|compliance|deadline|due date")],
  ["audit", "Audit, accounting & law", W("audit(?:s|ed|ors?|ing)?|icai|nfra|ind ?as|accounting|auditors?|companies act|nclt|nclat|insolvency|ibc|cag|lfar|caro|statutory|ifrs|chartered accountants?")],
  ["insurance", "Insurance & pensions", W("insurers?|insurance|irdai|lic|pension|epfo|nps|pfrda|mutual funds?|amfi")],
  ["regulators", "Regulators & circulars", W("rbi|reserve bank|sebi|irdai|pfrda|nhb|nabard|ibbi|mca|nfra|cbdt|cbic|circular|master direction|notification")],
  ["enforcement", "Fraud & enforcement", W("fraud|scam|ponzi|money laundering|enforcement directorate|ed raids?|cbi|arrested|penalty|fined?|probe|raid|laundering|fema|cyber ?fraud")],
  ["banking", "Banking & NBFC", W("banks?|banking|nbfcs?|hfcs?|housing finance|lenders?|loans?|npas?|gnpa|credit|deposit|repo|microfinance|upi|npci|fintech|digital lending")],
];
function bfsiSub(text){ for(const [id,label,re] of BFSI_SUBS) if(re.test(text)) return id; return "banking"; }
const BFSI_SUB_LABEL = Object.fromEntries(BFSI_SUBS.map(s => [s[0], s[1]]));
const LIVE_KINDS = [
  ["conflict", "Conflict & security", W("war|air ?strikes?|missiles?|drone|shelling|ceasefire|cease-?fire|hostages?|troops|invasion|terror\\w*|attack\\w*|military|coup|bomb\\w*|truce")],
  ["disaster", "Natural disasters", W("earthquakes?|tsunami|cyclone|hurricane|typhoon|wildfires?|landslides?|volcan\\w+|floods?|flooding|quake|drought|heatwave")],
  ["accident", "Accidents & industrial", W("crash|derail\\w*|collapse[sd]?|stampede|explosion|blast|gas leak|fire|capsiz\\w+|trapped")],
];
function liveKind(text){ for(const [id,,re] of LIVE_KINDS) if(re.test(text)) return id; return "other"; }
const LIVE_KIND_LABEL = Object.assign(Object.fromEntries(LIVE_KINDS.map(k => [k[0], k[1]])), { other:"Other developing events" });

const SEV_CRIT = W("death toll|killed|dead|dies|died|massacre|terror attack|suicide bomb\\w*|air ?strikes?|missile|bombing|explosion|earthquake|tsunami|plane crash|train derail\\w*|stampede|(?:building|bridge|roof|mine|dam) collapse|hostages?|invasion|coup|nuclear|assassinat\\w+|state of emergency|mass shooting|evacuat\\w+|outbreak|pandemic|bank run|lockdown|curfew|trapped");
const SEV_HIGH = W("attack|war|crash(?:es|ed)?|plunge[sd]?|surge[sd]?|slump\\w*|severe|crisis|bans?|banned|arrest\\w*|raids?|resigns?|sacked|verdict|convicted|sentenced|scam|fraud|recall|outage|breach|hack\\w*|cyberattack|strike|protests?|clash\\w*|riots?|rate (?:cut|hike)|repo rate|record high|record low|all-time|penalty|fined?|probe|cancel\\w*|suspend\\w*|shutdown|sanctions?|tariffs?|warning|alert|red alert|heatwave|floods?|cyclone|emergency|default|collapse\\w*|ceasefire|talks collapse");
const SEV_MED = W("announces?|launch\\w*|approves?|hike|cuts?|extends?|extended|deadline|new rules?|notif\\w+|circular|merger|acquires?|acquisition|results|profit|loss|funding|deal|talks|summit|policy|budget|scheme|order|directs?");
function severityOf(title, group){
  const t = title.replace(NONKINETIC_WAR, " ");                      // "price war", "trade war" are not conflicts
  const casN = (CASUALTY.exec(t)||[])[0];
  if(casN){ const n = parseInt(casN.replace(/,/g,""), 10); if(n>=5) return 1; }
  const idiom = group==="sports" || group==="entertainment";         // "killed it", "blast 150", "dead rubber"
  if(SEV_CRIT.test(t)) return idiom ? 0.4 : 1;
  if(SEV_HIGH.test(t)) return idiom ? 0.3 : 0.7;
  if(SEV_MED.test(t)) return 0.4;
  return 0.15;
}
// Source reliability is a curated heuristic (not an external rating). Tier 1 official, 2 wire/major, 3 established, 4 unrated.
const SRC_OFFICIAL = /reserve bank of india|\brbi\b|\bsebi\b|press information bureau|\bpib\b|\bicai\b|ministry of|government of india|irdai|\bnhb\b|supreme court of india|election commission|income tax department|gst council|mca\b/i;
const SRC_MAJOR = /reuters|associated press|\bap news|\bpti\b|press trust|\bani\b|bloomberg|bbc|the hindu|indian express|hindustan times|times of india|economic times|business standard|livemint|\bmint\b|moneycontrol|ndtv|financial express|the wire|scroll|the print|theprint|al jazeera|financial times|wall street journal|new york times|guardian|cnbc|cnn|the economist|nikkei|deccan herald|telegraph india|firstpost|india today|news18|the tribune|forbes|techcrunch|the verge|espncricinfo|cricbuzz|business today|taxscan|taxguru|ca club|caclubindia|bar and bench|livelaw|barandbench|medianama|inc42|yourstory|the news minute/i;
const SRC_LOW = /\bmsn\b|yahoo|newsbreak|dailyhunt|opindia|reddit|quora|facebook|youtube|medium|blogspot|wordpress|telegram|substack/i;
function sourceTier(name){
  if(!name || /unknown/i.test(name)) return 4;
  if(SRC_OFFICIAL.test(name)) return 1;
  if(SRC_MAJOR.test(name)) return 2;
  if(SRC_LOW.test(name)) return 4;
  return 3;
}
const TIER_LABEL = { 1:"Official", 2:"Major outlet", 3:"Established", 4:"Unrated" };
const TIER_Q = { 1:1, 2:0.8, 3:0.6, 4:0.35 };

/* ---------- clustering ---------- */
const STOP = new Set("a an the of to in on for and or with at by from as is are was were be been after over amid into its it this that says said new live latest news update updates vs than more his her their will can may how why what who".split(" "));
const NUMWORD = {one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10"};
const SYN = { house:"home", houses:"home", residence:"home", residential:"home", blast:"explosion", blasts:"explosion", explosions:"explosion", explodes:"explosion", exploded:"explosion", injuries:"injured", hurt:"injured", injured:"injured", quake:"earthquake", blaze:"fire", fires:"fire", collapses:"collapse", collapsed:"collapse", cops:"police", killed:"dead", dies:"dead", died:"dead", deaths:"dead", kills:"dead", dead:"dead" };
const GENERIC_ENT = new Set(["india","delhi","mumbai","china","russia","america","london","gaza","israel","ukraine","police","government","minister","supreme","court","reuters","breaking"]);
function features(title){
  const norm = title.toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9ऀ-ॿ%.₹$ ]+/g," ");
  const words = norm.split(/\s+/).map(w => NUMWORD[w] || w).filter(Boolean);
  const tk = new Set(words.filter(w => w.length>2 && !STOP.has(w)));
  const nums = new Set(words.filter(w => /\d/.test(w)).map(w => w.replace(/[^\d.]/g,"")).filter(Boolean));
  const ents = new Set((title.match(/\b[A-Z][a-zA-Z&.]+(?:\s+[A-Z][a-zA-Z&.]+)*/g) || []).map(e => e.toLowerCase()).filter(e => e.length>2 && !STOP.has(e)));
  const sk = new Set([...tk].map(w => SYN[w] || w));   // synonym-normalised tokens: used only to recognise the same incident, never for ids
  return { tk, sk, nums, ents, key: words.join(" ") };
}
function overlap(a, b){ let n = 0; a.forEach(x => { if(b.has(x)) n++; }); return n; }
function sameEvent(A, B){
  const inter = overlap(A.tk, B.tk), small = Math.min(A.tk.size, B.tk.size);
  if(!small) return false;
  // same incident: a shared distinctive place/name plus at least three shared words once synonyms (house/home, blast/explosion, hurt/injured) are normalised; a changed casualty figure is a development of the same story, not a different one
  if(A.sk && B.sk){
    const anchor = [...A.ents].some(e => !e.includes(" ") && e.length>=5 && !GENERIC_ENT.has(e) && B.ents.has(e));
    if(anchor && overlap(A.sk, B.sk) >= 3) return true;
  }
  const containment = inter/small, jaccard = inter/(A.tk.size+B.tk.size-inter);
  if(containment < 0.6 && jaccard < 0.45) return false;
  if(A.nums.size && B.nums.size && !overlap(A.nums, B.nums) && containment < 0.85) return false;
  if(A.ents.size && B.ents.size && !overlap(A.ents, B.ents) && containment < 0.8) return false;
  return true;
}
function fnv(str){ let h = 0x811c9dc5; for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); }
// Stable event id: derived from the date + the earliest report's content words (not from array position),
// and inherited from the previous clustering whenever the same report links are still present.
function eventId(dateKey, lead){ return "e" + fnv(dateKey + "|" + [...features(lead.title).tk].sort().join(" ")); }

/* ---------- v12: feed hygiene — items that are not news reports are quarantined (with a reason) before clustering ---------- */
const CREDIT_WORDS = /\b(getty images?|ap photo|afp via getty|photo by|photograph by|image credit|photo credit|credit:|courtesy of|file photo|stock photo|\(?©\)?|shutterstock|reuters\/|\/getty|via getty)\b/i;
const CREDIT_TAIL = /^[A-Z][^.!?]{2,44}\.\s+[A-Z][a-z]+(?:\s+[A-Z]\.)?\s+[A-Z][a-z]+(?:[…]|\.\.\.|\s*(?:\/|\|)\s*\S.*)?$/;
const PLACEHOLDER = /^(untitled|no title|null|undefined|n\/a|\[removed\]|removed|lorem ipsum.*|test|title|headline|loading\.*|image|photo|video|\.+|-+)$/i;
const NEWSY_VERB = /\b(is|are|was|were|has|have|had|says?|said|will|to|as|after|over|amid|vs|on|in|for|with|from|kills?|dies|wins?|loses?|hits?|rises?|falls?|cuts?|hikes?|bans?)\b/i;
function quarantineReason(it, now){
  const t = String(it.title||"").trim(), src = String(it.source||"").trim();
  if(!t) return "empty headline";
  if(PLACEHOLDER.test(t)) return "placeholder text";
  if(t.split(/\s+/).length < 3) return "too short to be a headline";
  if(CREDIT_WORDS.test(t) && t.split(/\s+/).length <= 14) return "photo credit or caption";
  if(CREDIT_TAIL.test(t) && !NEWSY_VERB.test(t.split(/\.\s/)[1] || "")) return "photo credit or caption";
  if(src.length > 70 || /https?:\/\/|www\./i.test(src)) return "malformed outlet name";
  if(it.ts != null){ const n = now || Date.now(); if(it.ts > n + 36*3600e3) return "implausible date (future)"; if(it.ts < n - 800*86400e3) return "implausible date (too old)"; }
  if(/^(photo|image|video|watch|gallery|in pictures|pics)\s*[:\-]/i.test(t)) return "media caption";
  return null;
}
function hygiene(items, now){ const ok = [], bad = []; items.forEach(it => { const r = quarantineReason(it, now); if(r) bad.push({ title:it.title, source:it.source, reason:r }); else ok.push(it); }); return { ok, bad }; }
function cluster(items, stateName, opts){
  opts = opts || {}; const dateKey = opts.date || "";
  { const h = hygiene(items, opts.now); items = h.ok; cluster.quarantined = h.bad; }
  const sorted = items.slice().sort((x,y) => x.ts - y.ts || (x.link < y.link ? -1 : 1)), clusters = [];
  const index = new Map();                       // token -> cluster indexes (founder tokens): avoids comparing every pair
  for(const it of sorted){
    const f = features(it.title); let home = null;
    const votes = new Map();
    f.tk.forEach(tk => { const l = index.get(tk); if(l) l.forEach(i => votes.set(i, (votes.get(i)||0)+1)); });
    const need = Math.min(2, f.tk.size);
    const cand = [...votes.entries()].filter(([,n]) => n>=need).map(([i]) => i).sort((a,b) => a-b);
    for(const i of cand){ if(sameEvent(f, clusters[i].f)){ home = clusters[i]; break; } }
    if(!home){ home = { f, lead:it, reports:[], items:[] }; clusters.push(home); const ci = clusters.length-1; f.tk.forEach(tk => { if(!index.has(tk)) index.set(tk, []); index.get(tk).push(ci); }); }
    home.items.push(it);
    if(!home.reports.some(r => r.source===it.source || r.link===it.link)) home.reports.push(Object.assign({ key:f.key }, it));
  }
  const used = new Set();
  return clusters.map(c => {
    // classify each distinct report; the event takes the majority primary (lead counts double), so one odd headline can't flip it
    const per = c.reports.map((r,i) => ({ r, k:classify(r, stateName) }));
    const tally = new Map(); per.forEach(({r,k}, i) => tally.set(k.primary, (tally.get(k.primary)||0) + (r===c.reports[0] ? 2 : 1)));
    const prio = id => RULES.findIndex(x => x.id===id);
    const primary = [...tally.entries()].sort((a,b) => b[1]-a[1] || (prio(a[0])<0 ? 99 : prio(a[0])) - (prio(b[0])<0 ? 99 : prio(b[0])) || (a[0]<b[0] ? -1 : 1))[0][0];
    const lk = per.find(p => p.k.primary===primary).k;
    const tags = new Set(); per.forEach(p => p.k.tags.forEach(t => tags.add(t))); tags.delete(primary);
    const keys = {}; c.reports.forEach(r => keys[r.key] = (keys[r.key]||0)+1);
    const identical = Object.values(keys).filter(n => n>1).reduce((a,n) => a+n, 0);
    let id = null;
    if(opts.prev){ const v = new Map(); c.items.forEach(x => { const p = opts.prev.get(x.link); if(p && !used.has(p)) v.set(p, (v.get(p)||0)+1); }); if(v.size) id = [...v.entries()].sort((a,b) => b[1]-a[1])[0][0]; }
    if(!id){ id = eventId(dateKey, c.lead); let n = 1; const base = id; while(used.has(id)) id = base + "-" + (++n); }
    used.add(id);
    const group = LEAF_GROUP[primary], text = c.reports.map(r => r.title).join(" | ");
    const ev = { id, lead:c.lead, reports:c.reports, outlets:c.reports.length, indep:Object.keys(keys).length, identical,
      primary, group, tags:[...tags], conf:lk.conf, term:lk.term, ents:c.f.ents, tk:c.f.tk, key:c.f.key,
      first:c.lead.ts, last:Math.max(...c.reports.map(r => r.ts)) };
    ev.sev = severityOf(c.lead.title, group);
    ev.tier = Math.min(...c.reports.map(r => sourceTier(r.source)));
    if(group==="bfsi" || ev.tags.includes("bfsi")) ev.sub = bfsiSub(text);
    if(group==="live") ev.kind = liveKind(text);
    return ev;
  });
}
function idMap(events){ const m = new Map(); events.forEach(e => e.reports.forEach(r => m.set(r.link, e.id))); return m; }

/* ---------- ranking ---------- */
const WEIGHTS = { severity:20, impact:25, relevance:15, freshness:10, popularity:10, source:10, action:5, personal:5 };
const IMPACT_BASE = { live:.6, bfsi:.55, markets:.5, politics:.5, india:.5, world:.5, business:.45, tech:.4, science:.4, life:.35, sports:.3, entertainment:.2 };
const REL_BASE = { bfsi:.8, markets:.75, india:.8, business:.65, politics:.6, world:.45, tech:.5, science:.4, life:.4, live:.55, sports:.3, entertainment:.2 };
const IMPACT_BOOST = W("nationwide|national|countrywide|global|worldwide|across (?:india|the world)|millions?|billions?|lakh crore|rbi|sebi|supreme court|cabinet|parliament|g20|imf|world bank|union budget|un security council");
const ACTION_RE = W("deadline|due date|last date|extended|extends|circular|notification|notified|mandatory|effective from|comes? into effect|compliance|penalty|filing|file (?:your )?returns?|new rules?|guidelines|norms|advisory|apply (?:now|by)|registration opens?|master direction");
const INDIA_RE = INDIA_TERMS;
const PROFILES = {
  ca: { label:"CA / BFSI professional", boost:{ bfsi:1, markets:.7, business:.6, india:.5, politics:.3, live:.3 },
        terms:W("rbi|sebi|gst|audit|icai|nbfc|ind ?as|tax|companies act|mca|nfra|cbdt|ibc|insolvency|npa|fraud|compliance|circular|banks?|insurance|irdai") },
  general: { label:"General reader", boost:{}, terms:null },
};

// Scope of public consequence, from words and sources only: "global", "national", "regional" or "local".
const LOCAL_INCIDENT = /\b(explosion|blast|fire|crash(?:es|ed)?|collision|accident|shooting|stabbing|gas leak|house|home|residence|apartment|neighbou?rhood|highway|road)\b/i;
function scopeOf(c, sev, best){
  const text = c.reports.map(r => r.title).join(" "), cas = (CASUALTY.exec(text)||[])[0], n = cas ? parseInt(cas.replace(/,/g,""), 10) : 0;
  if(n >= 25) return c.indep>=3 || n>=100 ? "global" : "national";
  if(best===1 || IMPACT_BOOST.test(text)) return c.group==="world" || /global|worldwide|un security council|imf|world bank/i.test(text) ? "global" : "national";
  if(["india","politics","markets","bfsi","business"].includes(c.group)) return "national";
  if((c.group==="live" || LOCAL_INCIDENT.test(c.lead.title)) && n < 3 && !/\b(attack|war|missile|ceasefire|earthquake|tsunami|cyclone|hurricane|coup|invasion|nuclear|terror\w*)\b/i.test(text)) return "local";
  if(c.group==="world" && c.indep>=3) return "global";
  return "regional";
}
function scoreEvent(c, ctx){
  ctx = ctx || {}; const now = ctx.now || Date.now(), title = c.lead.title, g = c.group;
  const sev = c.sev != null ? c.sev : severityOf(title, g);
  let imp = (IMPACT_BASE[g]||.3) + (IMPACT_BOOST.test(c.reports.map(r => r.title).join(" ")) ? .25 : 0) + Math.min(.2, .05*c.tags.length);
  imp = Math.min(1, imp);
  const rel = Math.min(1, (REL_BASE[g]||.3) + (INDIA_RE.test(title) ? .2 : 0));
  let fresh = .5;                                         // past days: neutral (time of day carries no news value)
  if(ctx.today){ const h = Math.max(0, (now - c.last)/3600e3); fresh = h<1 ? 1 : h<3 ? .85 : h<6 ? .6 : h<12 ? .35 : h<24 ? .15 : 0; }
  const nrm = n => Math.min(1, Math.log2(1+n)/Math.log2(13));
  const pop = .7*nrm(c.indep) + .3*nrm(c.outlets);
  const best = Math.min(...c.reports.map(r => sourceTier(r.source)));
  const avg = c.reports.reduce((a,r) => a + TIER_Q[sourceTier(r.source)], 0)/c.reports.length;
  const sq = .7*TIER_Q[best] + .3*avg;
  const act = ACTION_RE.test(title) ? (["bfsi","india"].includes(g) ? 1 : .5) : 0;
  const prof = PROFILES[ctx.profile || "general"] || PROFILES.general;
  const wl = (ctx.watch||[]).some(t => t && title.toLowerCase().includes(String(t).toLowerCase()));
  const pers = Math.min(1, wl ? 1 : (prof.boost[g]||0)*.6 + (prof.terms && prof.terms.test(title) ? .4 : 0));
  const parts = { severity:sev, impact:imp, relevance:rel, freshness:fresh, popularity:pop, source:sq, action:act, personal:pers };
  let score = 0; for(const k in WEIGHTS) score += WEIGHTS[k]*parts[k];
  // Controlled severity override: a critical event is lifted to a floor, higher when independently confirmed, lower when single-source. Never to the very top for a lone unconfirmed report.
  const confirmed = c.indep>=2 || best===1; let override = false;
  const scope = scopeOf(c, sev, best);
  // Editorial policy: a severity word is one signal. The floor applies only to consequential, evidenced events; a local incident is capped.
  if(sev>=1 && scope!=="local"){ const floor = confirmed ? (scope==="global"||scope==="national" ? 85 : 70) : 55; if(score<floor){ score = floor; override = true; } }
  if(scope==="local") score = Math.min(score, 52);
  return { score:Math.round(score*10)/10, parts, override, confirmed, scope };
}
function rankEvents(events, ctx){
  events.forEach(e => { e.rank = scoreEvent(e, ctx); });
  return events.slice().sort((a,b) => b.rank.score-a.rank.score || b.outlets-a.outlets || b.last-a.last || (a.id<b.id ? -1 : 1));
}
function related(c, all){
  if(!c.ents.size) return [];
  return all.filter(o => o!==c && overlap(o.ents, c.ents)>=1 && overlap(o.tk, c.tk)>=2 && (o.group===c.group || o.tags.includes(c.primary) || c.tags.includes(o.primary)))
            .sort((a,b) => b.outlets-a.outlets).slice(0,4);
}

/* ---------- views over events (one place so the UI and the audit agree) ---------- */
function eventsFor(events, id){
  if(id==="top") return events;
  if(id==="state") return events.filter(e => e.tags.includes("state"));
  if(GROUPS.includes(id)) return events.filter(e => e.group===id);
  return events.filter(e => e.primary===id);
}
function groupCounts(events){ const n = {}; events.forEach(e => n[e.group] = (n[e.group]||0)+1); return n; }
function leafCounts(events){ const n = {}; events.forEach(e => n[e.primary] = (n[e.primary]||0)+1); return n; }

/* ---------- search ---------- */
function parseQuery(q){
  const out = { terms:[], source:[], inGroup:null, critical:false };
  (String(q).match(/"[^"]+"|\S+/g) || []).forEach(tok => {
    let m;
    if((m = /^in:(\w+)$/i.exec(tok))) out.inGroup = CAT_ALIAS[m[1].toLowerCase()] || m[1].toLowerCase();
    else if((m = /^source:(.+)$/i.exec(tok))) out.source.push(m[1].replace(/"/g,"").toLowerCase());
    else if(/^is:(critical|high)$/i.test(tok)) out.critical = true;
    else out.terms.push(tok.replace(/"/g,"").toLowerCase());
  });
  return out;
}
function searchEvents(events, q){
  const p = parseQuery(q); if(!p.terms.length && !p.source.length && !p.inGroup && !p.critical) return [];
  const res = [];
  for(const e of events){
    if(p.inGroup && !(e.group===p.inGroup || e.primary===p.inGroup || e.tags.includes(p.inGroup))) continue;
    if(p.critical && e.sev<0.7) continue;
    const titles = e.reports.map(r => r.title.toLowerCase()).join(" | "), srcs = e.reports.map(r => r.source.toLowerCase()).join(" | ");
    if(p.source.length && !p.source.every(s => srcs.includes(s))) continue;
    const labels = (catLabelOf(e.group)+" "+catLabelOf(e.primary)+" "+e.tags.map(catLabelOf).join(" ")+" "+[...e.ents].join(" ")).toLowerCase();
    let score = 0, ok = true;
    for(const t of p.terms){
      if(e.lead.title.toLowerCase().includes(t)) score += 4; else if(titles.includes(t)) score += 3; else if(srcs.includes(t)) score += 2; else if(labels.includes(t)) score += 1; else { ok = false; break; }
    }
    if(ok){ const mn = p.terms.length ? score/(4*p.terms.length) : 0; res.push([e, (e.rank ? e.rank.score : 0) + mn*0.01]); }   // significance first; every result already matches; match quality only breaks exact ties
  }
  return res.sort((a,b) => b[1]-a[1]).map(x => x[0]);
}

/* ---------- homepage: de-duplication coordinator + "Today in 60 seconds" ---------- */
const READ_WPM = 160;                                       // comfortable headline-reading speed
const wordCount = s => (String(s).trim().match(/\S+/g) || []).length;
function makeSeen(){ const s = new Set(); return { has:id => s.has(id), add:id => { s.add(id); return id; }, size:() => s.size, ids:() => [...s] }; }
// One-line grounded caption for an event: topic, outlet, number of outlets, first-report time. All of it is data, nothing is written by the app.
function heroMeta(e, fmtTime){
  return catShort(e.group) + " · " + e.lead.source + " · " + e.outlets + (e.outlets===1 ? " outlet" : " outlets") + (fmtTime ? " · " + fmtTime(e.first) + " IST" : "");
}
// Picks 6–8 events (or fewer if the day has fewer) from the ranked list; max 2 per group; whole headlines only; targets ~120–160 visible words.
function buildHero(ranked, seen, opts){
  opts = opts || {}; const MAX = 8, MIN = 6, LO = 120, HI = 160, fmt = opts.fmtTime || (() => "9:00 am");
  const perGroup = {}, picks = []; let words = 0;
  const line = e => wordCount(e.lead.title) + wordCount(heroMeta(e, fmt));
  const pool = ranked.filter(e => !seen.has(e.id) && wordCount(e.lead.title) <= 26);
  for(const lim of [1, 2]){                                                              // first pass: one per group (breadth), then fill to 2
    for(const e of pool){
      if(picks.length>=MAX) break; if(picks.includes(e)) continue;
      if((perGroup[e.group]||0) >= lim) continue;
      const w = line(e);
      if(picks.length>=MIN && words + w > HI) continue;
      if(words + w > HI + 25) continue;
      picks.push(e); perGroup[e.group] = (perGroup[e.group]||0)+1; words += w;
      if(picks.length>=MIN && words>=LO) break;
    }
    if(picks.length>=MIN && words>=LO) break;
  }
  picks.sort((a,b) => b.rank.score - a.rank.score || (a.id<b.id ? -1 : 1));
  picks.forEach(e => seen.add(e.id));
  return { events:picks, words, seconds:Math.max(5, Math.round(words/READ_WPM*60)) };
}

/* ---------- automated audit (the numbers shown in Diagnostics and checked by tests) ---------- */
function auditEvents(events){
  const out = { events:events.length, duplicateIds:0, multiPrimary:0, unclassified:0, duplicateLinksWithin:0, linksInMultipleEvents:0, duplicateSourceWithin:0, nearDuplicateLeads:0, lowConfidence:0, notInAnyGroup:0, inMultipleGroupPages:0 };
  const idc = new Map(); events.forEach(e => idc.set(e.id, (idc.get(e.id)||0)+1)); idc.forEach(n => { if(n>1) out.duplicateIds += n-1; });
  const linkEv = new Map();
  events.forEach(e => {
    if(typeof e.primary!=="string" || !e.group) out.unclassified++;
    if(Array.isArray(e.primary) || Array.isArray(e.group) || LEAF_GROUP[e.primary]!==e.group) out.multiPrimary++;
    if(e.conf==="low") out.lowConfidence++;
    const ls = new Set(), ss = new Set();
    e.reports.forEach(r => { if(ls.has(r.link)) out.duplicateLinksWithin++; ls.add(r.link); if(ss.has(r.source)) out.duplicateSourceWithin++; ss.add(r.source);
      if(!linkEv.has(r.link)) linkEv.set(r.link, new Set()); linkEv.get(r.link).add(e.id); });
  });
  linkEv.forEach(s => { if(s.size>1) out.linksInMultipleEvents++; });
  // exact normalised-headline twins across events (should be impossible after clustering)
  const keys = new Map(); events.forEach(e => { const k = e.key; keys.set(k, (keys.get(k)||0)+1); }); keys.forEach(n => { if(n>1) out.nearDuplicateLeads += n-1; });
  // every event appears on exactly one primary-topic page
  const pageCount = new Map(); GROUPS.forEach(g => eventsFor(events, g).forEach(e => pageCount.set(e.id, (pageCount.get(e.id)||0)+1)));
  events.forEach(e => { const n = pageCount.get(e.id)||0; if(n===0) out.notInAnyGroup++; else if(n>1) out.inMultipleGroupPages++; });
  return out;
}

/* ---------- v3: reading modes (real word budgets), away windows, regulatory status ---------- */
const MODES = {
  "60":  { label:"60 seconds", lo:120, hi:160, min:4, max:9,  cap:2 },
  "180": { label:"3 minutes",  lo:400, hi:550, min:10, max:34, cap:4 },
  "300": { label:"5 minutes",  lo:700, hi:900, min:16, max:60, cap:6 },
  "600": { label:"10 minutes", lo:1400, hi:1800, min:24, max:90, cap:8 }
};
// Finite brief for one mode: unique events, best-ranked first, per-topic cap, stops at the word budget, never pads.
// Events below a quality floor are skipped (unless severe), so a quiet day gives a SHORTER brief, not filler.
function buildBrief(ranked, seen, mode, opts){
  opts = opts || {}; const M = MODES[mode] || MODES["60"], fmt = opts.fmtTime || (() => "9:00 am"), floor = opts.floor==null ? 30 : opts.floor;
  const per = {}, picks = []; let words = 0;
  const line = opts.line || (e => wordCount(e.lead.title) + wordCount(heroMeta(e, fmt)));
  const opening = new Set(); // first pass: at most one story per category until five are chosen (subject diversity), then fill under the caps
  for(const pass of [1, 2]) for(const e of ranked){
    if(picks.length>=M.max) break;
    if(pass===1 && (opening.size>=5 || opening.has(e.group))) continue;
    if(picks.includes(e)) continue;
    if(seen.has(e.id) || wordCount(e.lead.title)>26) continue;
    if(e.rank.score < floor && !(e.sev>=1)) continue;
    if((per[e.group]||0) >= M.cap) continue;
    const w = line(e);
    if(words + w > M.hi && picks.length>=M.min) continue;
    if(words + w > M.hi + 30) continue;
    picks.push(e); if(pass===1) opening.add(e.group); per[e.group] = (per[e.group]||0)+1; words += w;
  }
  const byScore = (a,b) => b.rank.score - a.rank.score || (a.id<b.id ? -1 : 1), nOpen = opening.size;
  picks.splice(0, picks.length, ...picks.slice(0, nOpen).sort(byScore), ...picks.slice(nOpen).sort(byScore));
  picks.forEach(e => seen.add(e.id));
  return { mode, events:picks, words, seconds:Math.max(5, Math.round(words/READ_WPM*60)), short: words < M.lo };
}
// Away windows. cutoffs are computed from real clocks; "visit" uses the stored previous-visit time.
function awayCutoff(win, now, prevVisit, dayStartIST){
  if(win==="visit") return prevVisit || null;
  if(win==="morning") return dayStartIST + 6*3600e3;
  if(win==="yesterday") return dayStartIST - 24*3600e3;
  if(win==="week") return now - 7*24*3600e3;
  return null;
}
// New = first reported after the cutoff. Updated = existed before and now has >=3 more outlets than in the stored snapshot (a real, measured change; headline wording is ignored).
function awayDelta(events, cutoff, snap){
  if(!cutoff) return { fresh:[], updated:[] };
  const fresh = events.filter(e => e.first > cutoff), updated = [];
  if(snap) events.forEach(e => { if(e.first<=cutoff && snap[e.id]!=null && e.outlets - snap[e.id] >= 3) updated.push({ e, from:snap[e.id] }); });
  return { fresh, updated };
}
// Regulatory document status from the headline only. Never infers more than the wording says.
const REG_STATUS = [
  ["Withdrawn", /\b(withdraw(n|s|al)|rescind(ed|s)?|revoked?)\b/i], ["Stayed", /\b(stay(ed|s)?|stayed by|interim stay)\b/i],
  ["Draft / consultation", /\b(draft|consultation paper|discussion paper|seeks? (public )?(comments|views|feedback)|invites? (comments|suggestions)|exposure draft)\b/i],
  ["Proposed", /\b(propos(es|ed|al)|plans? to|mulls?|considering)\b/i],
  ["Clarification", /\b(clarif(y|ies|ied|ication)|faqs?)\b/i],
  ["Final notification", /\b(notif(y|ies|ied|ication)|issues? (master )?(direction|circular|norms)|amend(s|ed|ment)|revised? (norms|guidelines|framework)|announces?|mandates?|directs?)\b/i]
];
function regStatus(title){ for(const [n, re] of REG_STATUS) if(re.test(title)) return n; return "Status not stated"; }
const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
function regDate(title){
  const m = String(title).match(new RegExp("\\b(?:effective|w\\.?e\\.?f\\.?|from|by|till|until|deadline)\\s+(?:on\\s+)?((?:\\d{1,2}(?:st|nd|rd|th)?\\s+)?(?:" + MONTHS + ")[a-z]*\\.?(?:\\s+\\d{1,2}(?:st|nd|rd|th)?)?(?:,?\\s+\\d{4})?)", "i"));
  return m ? m[1] : null;
}
/*ENGINE:END*/
