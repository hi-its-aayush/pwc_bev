// ── CONFIG ────────────────────────────────────────────────────
var SBU='https://sqdliwlqmcgheyxrjalp.supabase.co';
var SBK='sb_publishable_eTyNtaImydanSt8kom9kNw_SqMwdxU9';
var PWD='UHdDU3lkbmV5MjAyNiE='; // PwCSydney2026!

// ── AUTH ──────────────────────────────────────────────────────
document.getElementById('lbtn').addEventListener('click', login);
document.getElementById('lpw').addEventListener('keydown', function(e){ if(e.key==='Enter') login(); });

function login(){
  var v=document.getElementById('lpw').value.trim();
  var e=document.getElementById('lerr');
  var b=document.getElementById('lbtn');
  e.style.display='none';
  if(!v){ e.textContent='Please enter the password.'; e.style.display='block'; return; }
  b.disabled=true; b.textContent='Checking…';
  setTimeout(function(){
    if(btoa(v)===PWD){
      localStorage.setItem('pbev',PWD);
      document.getElementById('ls').classList.add('hide');
      document.getElementById('sb').style.display='';
      document.getElementById('mn').style.display='';
      if(window.innerWidth<=800) document.getElementById('hbg').style.display='flex';
      startApp();
    } else {
      e.textContent='Incorrect password.'; e.style.display='block';
      b.disabled=false; b.textContent='Sign In';
      document.getElementById('lpw').value='';
      document.getElementById('lpw').focus();
    }
  },300);
}

document.getElementById('outbtn').addEventListener('click', function(){
  if(!confirm('Sign out?')) return;
  localStorage.removeItem('pbev');
  location.reload();
});

// Check if already logged in
if(localStorage.getItem('pbev')===PWD){
  document.getElementById('ls').classList.add('hide');
  document.getElementById('sb').style.display='';
  document.getElementById('mn').style.display='';
  if(window.innerWidth<=800) document.getElementById('hbg').style.display='flex';
  startApp();
}

// ── HAMBURGER ─────────────────────────────────────────────────
document.getElementById('hbg').addEventListener('click', function(){
  document.getElementById('sb').classList.toggle('open');
  document.getElementById('ov').classList.toggle('open');
});
document.getElementById('ov').addEventListener('click', function(){
  document.getElementById('sb').classList.remove('open');
  document.getElementById('ov').classList.remove('open');
});

// ── SUPABASE ──────────────────────────────────────────────────
var sb = supabase.createClient(SBU, SBK);
var items=[], settings={members:[]}, pending=null, activeSup=null, activeCCat=null, chart=null, conCounts={};

function G(id){ return document.getElementById(id); }
function fmt(n){ return isNaN(n)?'$0.00':'$'+Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
function fmtN(n){ return Math.max(0,Math.round(Number(n)||0)).toString(); }
function td(){ return new Date().toISOString().split('T')[0]; }
function soh(i){ return (parseFloat(i.opening_soh)||0)+(parseFloat(i.orders_in)||0)-(parseFloat(i.consumed)||0); }

// Popularity ordering: most-used items pinned to the top
var POPULAR=[
  'Veuve Cliquot Brut NV','Croser Brut NV','Stonier Reserve Chardonnay 2022',
  'Brokenwood Pinot Gris 2024','Stonier Reserve Pinot Noir 2022','Brokenwood Pinot Noir 2024',
  'James Squire Shackles 330ml','Young Henry Newtowner 330ml','Coopers Light 355ml','Heaps Normal Quiet XPA'
];
function popRank(i){var idx=POPULAR.indexOf(i.name);return idx<0?9999:idx;}
function sortByPopularity(arr){
  return arr.slice().sort(function(a,b){
    var ra=popRank(a),rb=popRank(b);
    if(ra!==rb)return ra-rb;
    return(a.id||0)-(b.id||0);
  });
}
function sbadge(i){ var s=soh(i); return s<=0?'<span class="badge bout">Out</span>':s<=3?'<span class="badge blow">Low</span>':'<span class="badge bok">OK</span>'; }
function toast(m,e){ var t=G('toast');t.textContent=m;t.className=e?'err':'';t.style.display='block';setTimeout(function(){t.style.display='none';},3500); }
function closeMo(id){ G(id).classList.remove('on'); }
function openMo(id){ G(id).classList.add('on'); }

// ── NAV ──────────────────────────────────────────────────────
var TITLES={dashboard:'Dashboard',inventory:'Inventory',orders:'New Order',consumption:'Consumption',history:'History',reports:'Reports',settings:'Settings'};

document.querySelectorAll('#nav a').forEach(function(a){
  a.addEventListener('click', function(e){
    e.preventDefault();
    var p=a.dataset.p;
    document.querySelectorAll('#nav a').forEach(function(x){x.classList.remove('active');});
    document.querySelectorAll('.pg').forEach(function(x){x.classList.remove('on');});
    a.classList.add('active');
    G('p-'+p).classList.add('on');
    G('ptitle').textContent=TITLES[p]||p;
    document.getElementById('sb').classList.remove('open');
    document.getElementById('ov').classList.remove('open');
    if(p==='dashboard') loadDash();
    if(p==='inventory') renderInv();
    if(p==='orders') loadOrders();
    if(p==='consumption') loadCon();
    if(p==='history') loadHist();
    if(p==='reports') loadReports();
    if(p==='settings') loadSettings();
  });
});

document.querySelectorAll('.tb').forEach(function(b){
  b.addEventListener('click', function(){
    document.querySelectorAll('.tb').forEach(function(x){x.classList.remove('on');});
    b.classList.add('on');
    document.querySelectorAll('#p-history > div[id]').forEach(function(d){d.style.display='none';});
    G(b.dataset.t).style.display='block';
  });
});

document.querySelectorAll('.mo').forEach(function(m){
  m.addEventListener('click', function(e){ if(e.target===m) m.classList.remove('on'); });
});

// ── START ─────────────────────────────────────────────────────
async function startApp(){
  loadSettings();
  await seedItems();
  loadDash();
  autoReport();
}

// ── SEED ─────────────────────────────────────────────────────
var SEED=[
  ["Pol Roger Vintage 2015","Champagne","Luxe $65+","2015",144.00,false],["Perrier-Jouet Blanc de Blanc NV","Champagne","Luxe $65+","NV",104.55,false],["Ruinart R de Ruinart NV","Champagne","Luxe $65+","NV",100.00,false],["Levantine Hill Blanc de Blanc 2013","Champagne","Luxe $65+","2013",0,false],["Arras Grand Vintage 2008","Sparkling","Luxe $65+","2008",76.76,false],["Leeuwin Estate Art Series Riesling 2023","White","Luxe $65+","2023",0,false],["Fraser Gallop Palladian Chardonnay 2020","White","Luxe $65+","2020",104.54,false],["Hardys Eileen Chardonnay 2021","White","Luxe $65+","2021",109.00,false],["Tyrells Vat 47 Chardonnay 2021","White","Luxe $65+","2021",70.00,false],["Cullen Legacy Series Sav Blanc 2019","White","Luxe $65+","2019",81.82,false],["St Hallet Old Block Shiraz 2017","Red","Luxe $65+","2017",120.83,false],["Oakridge 864 Pinot Noir 2019","Red","Luxe $65+","2019",89.99,false],["Levantine Hill Pinot Noir 2019","Red","Luxe $65+","2019",79.99,false],["Hickinbotham The Peake Cab Shiraz 2020","Red","Luxe $65+","2020",142.00,false],["Hickinbotham The Peake Cab Shiraz 2019","Red","Luxe $65+","2019",142.00,false],["Charles Melton Nine Popes GSM 2019","Red","Luxe $65+","2019",85.00,false],["Giant Steps Sexton Pinot Noir 2023","Red","Luxe $65+","2023",65.00,false],["Ten Minutes Coolart Rd Pinot Noir 2022","Red","Luxe $65+","2022",82.00,false],["Tolpuddle Pinot Noir 2020","Red","Luxe $65+","2020",93.00,false],
  ["Veuve Cliquot Brut NV","Champagne","Client $30-65","NV",74.99,false],["House of Arras Brut Elite NV","Sparkling","Client $30-65","NV",40.00,false],["Jim Barry Assyrtiko 2022","White","Client $30-65","2022",23.65,false],["Stonier Reserve Chardonnay 2022","White","Client $30-65","2022",41.66,false],["Jim Barry The Florita Riesling 2024","White","Client $30-65","2024",38.70,false],["Grosset Springvale Riesling 2021","White","Client $30-65","2021",57.99,false],["Ten Minutes by Tractor Chardonnay","White","Client $30-65","",35.00,false],["Ravensworth Riesling","White","Client $30-65","",40.00,false],["Tyrells VAT 1 Semillon 2016","White","Client $30-65","2016",57.27,false],["Cullen Wines Sauv Blanc Legacy 2022","White","Client $30-65","2022",32.00,false],["Domaine Christian Salmon Sancerre 2020","White","Client $30-65","2020",48.99,false],["Orlando Steingarten Riesling 2015","White","Client $30-65","2015",49.99,false],["Maison Saint AIX Rose 2021","Rose","Client $30-65","2021",42.00,false],["Chateau Minuty 2021","Rose","Client $30-65","2021",25.00,false],["St Hallet Blackwell Shiraz 2019","Red","Client $30-65","2019",50.10,false],["Yangarra Estate GSM 2021","Red","Client $30-65","2021",38.99,false],["Grant Burge Abednego GSM 2016","Red","Client $30-65","2016",64.37,false],["Stonier Reserve Pinot Noir 2022","Red","Client $30-65","2022",53.75,false],["Katnook Cabernet Sauvignon 2021","Red","Client $30-65","2021",30.10,false],["Katnook Cabernet Sauvignon 2022","Red","Client $30-65","2022",30.10,false],["Jim Barry McRae Wood Shiraz 2021","Red","Client $30-65","2021",38.84,false],["Geoff Merrill Reserve Cab Sauv 2014","Red","Client $30-65","2014",51.99,false],["Sang de Pigeon Pinot Noir 2018","Red","Client $30-65","2018",30.00,false],["Paringa Estate Shiraz 2019","Red","Client $30-65","2019",47.99,false],["Broke Fordwich Margan Shiraz Mourvedre 2019","Red","Client $30-65","2019",60.00,false],["Rolf Binder Hanisch Shiraz 2017","Red","Client $30-65","2017",68.18,false],["Pooley Pinot Noir 2018","Red","Client $30-65","2018",65.00,false],["Anaperenna by Glaetzer 2019","Red","Client $30-65","2019",49.99,false],
  ["Croser Brut NV","Sparkling","Staff <$30","NV",24.47,false],["Ark Hill Regional Blanc De Blanc NV","Sparkling","Staff <$30","NV",29.00,false],["Brokenwood Pinot Gris 2024","White","Staff <$30","2024",23.44,false],["Yabby Lake Pinot Gris 2023","White","Staff <$30","2023",26.00,false],["Yabby Lake Pinot Gris 2024","White","Staff <$30","2024",26.00,false],["Robert Stein Mudgee Dry Riesling 2022","White","Staff <$30","2022",25.18,false],["Minimum Chardonnay 2018","White","Staff <$30","2018",28.00,false],["Nick Spencer Hilltop Rose 2023","Rose","Staff <$30","2023",16.19,false],["Oakridge Willowlake Pinot Noir 2019","Red","Staff <$30","2019",24.99,false],["Brokenwood Pinot Noir 2024","Red","Staff <$30","2024",23.44,false],["First Ridge Sangiovese 2021","Red","Staff <$30","2021",27.00,false],["Michael Hall Sang de Pigeon Pinot Noir 2018","Red","Staff <$30","2018",30.00,false],["Viticoltori Senesi Aretini Chianti 2023","Red","Staff <$30","2023",0,false],["Tim Adam Botrytis Riesling 2011","Dessert Wine","Staff <$30","2011",25.99,false],
  ["Vinada Chardonnay Sparkling Non Alc NV","Non-Alc Wine","Non-Alc","NV",22.50,false],["Senorio De La Tautila White Non Alc NV","Non-Alc Wine","Non-Alc","NV",20.00,false],["Senorio De La Tautila Red Non Alc NV","Non-Alc Wine","Non-Alc","NV",20.00,false],["Plus and Minus Pinot Noir Non Alc 2022","Non-Alc Wine","Non-Alc","2022",21.90,false],["Naked GandT","Non-Alc Cocktail","Non-Alc","",2.55,false],["Naked Mojito","Non-Alc Cocktail","Non-Alc","",2.55,false],["Naked Margarita","Non-Alc Cocktail","Non-Alc","",2.55,false],["Naked Italian Spritz","Non-Alc Cocktail","Non-Alc","",2.55,false],
  ["Young Henry Newtowner 330ml","Beer","Beer/Spirits","",2.77,false],["Peroni 330ml","Beer","Beer/Spirits","",0,false],["James Squire Shackles 330ml","Beer","Beer/Spirits","",2.46,false],["James Boags Lager 375ml","Beer","Beer/Spirits","",0,false],["Kosciuszko Beer","Beer","Beer/Spirits","",0,false],["Carlton Draught 375ml","Beer","Beer/Spirits","",0,false],["Carlton Dry 375ml","Beer","Beer/Spirits","",0,false],["Coopers Light 355ml","Beer","Beer/Spirits","",2.00,false],["Heaps Normal Quiet XPA","Beer","Beer/Spirits","",1.59,false],
  ["Coke No Sugar 330ml","Soft Drink","Complimentary","",2.08,true],["Fanta 330ml","Soft Drink","Complimentary","",2.08,true],["Sprite 330ml","Soft Drink","Complimentary","",2.08,true],["Coca Cola 330ml","Soft Drink","Complimentary","",2.08,true],["Coke No Sugar 1.25L","Soft Drink","Complimentary","",2.85,true],["Fanta 1.25L","Soft Drink","Complimentary","",2.85,true],["Sprite 1.25L","Soft Drink","Complimentary","",2.85,true],["Coca Cola Classic 1.25L","Soft Drink","Complimentary","",2.85,true],["Yaru Sparkling Water 500ml","Water","Complimentary","",2.60,true],["Yaru Still Mineral Water 300ml","Water","Complimentary","",2.60,true],["Yaru Sparkling Water 300ml","Water","Complimentary","",2.60,true],["Fevertree Mediterranean Tonic 500ml","Soft Drink","Complimentary","",2.21,true],["Fevertree Elderflower Tonic 500ml","Soft Drink","Complimentary","",2.21,true],["San Pellegrino 750ml","Water","Complimentary","",2.21,true],["Ozharvest Strawberry Lemonade","Soft Drink","Complimentary","",3.50,true],["Ozharvest Lemonade Original Cans","Soft Drink","Complimentary","",3.50,true],["Kakadu Conscious Drink Sparkling Rose NA","Soft Drink","Complimentary","",25.00,true],["Red Bull Energy Drinks","Soft Drink","Complimentary","",0,true],
  ["Noah Orange Juice","Juice","Complimentary","",2.85,true],["Noah Apple Juice","Juice","Complimentary","",2.85,true],["Noah Carrot Apple Ginger Veggie","Juice","Complimentary","",2.85,true],["Noah Green Juice","Juice","Complimentary","",2.85,true],
  ["Aperol 700ml","Spirit","Beer/Spirits","",78.37,false],["Campari 700ml","Spirit","Beer/Spirits","",49.00,false],["Four Pillars Gin 700ml","Spirit","Beer/Spirits","",82.00,false],["Four Pillars Yuzu Gin 700ml","Spirit","Beer/Spirits","",67.00,false],["Artisan Settlers Yuzu Gin 700ml","Spirit","Beer/Spirits","",85.00,false],["Weis Zwetschgen Plum Brandy","Spirit","Beer/Spirits","",66.99,false],["Brookies Byron Bay Dry Gin 700ml","Spirit","Beer/Spirits","",81.00,false],["Ink Gin 700ml","Spirit","Beer/Spirits","",84.00,false],["Tanqueray Gin 700ml","Spirit","Beer/Spirits","",59.00,false],["23rd St Gin","Spirit","Beer/Spirits","",66.00,false],["Monin Green Apple Syrup 700ml","Mixer","Beer/Spirits","",22.38,false],["Bickfords Raspberry Cordial 750ml","Mixer","Beer/Spirits","",4.83,false],["Rubia Strawberry Liqueur 700ml","Mixer","Beer/Spirits","",45.00,false],["Crawseys Grenadine 750ml","Mixer","Beer/Spirits","",16.99,false],["Angostura Bitters 200ml","Mixer","Beer/Spirits","",32.00,false],["Cruz Madere 2L","Spirit","Beer/Spirits","",0,false]
];

function supFor(n){ var l=(n||'').toLowerCase(); if(l.includes('noah'))return'Noah Juices'; if(l.includes('young henry'))return"Young Henry's"; return'Sydney Wines'; }
function ctn(i){ var n=(i.name||'').toLowerCase(),c=i.category; if(c==='Beer')return{q:24,l:'24 cans/carton'}; if(c==='Soft Drink')return n.includes('1.25')?{q:12,l:'12x1.25L/carton'}:{q:24,l:'24x330ml/carton'}; if(c==='Water')return(n.includes('750')||n.includes('500'))?{q:12,l:'12 bottles/carton'}:{q:24,l:'24x300ml/carton'}; if(c==='Juice')return{q:12,l:'12 bottles/carton'}; if(c==='Non-Alc Cocktail')return{q:24,l:'24 cans/carton'}; if(c==='Spirit'||c==='Mixer')return{q:1,l:'per bottle'}; return{q:12,l:'12 bottles/carton'}; }

async function seedItems(){
  try{
    var r=await sb.from('items').select('*',{count:'exact',head:true});
    if(r.error){toast('DB error: '+r.error.message,true);return;}
    if(r.count>0){await fetchItems();return;}
    var rows=SEED.map(function(s){return{name:s[0],category:s[1],price_tier:s[2],vintage:s[3],supplier:supFor(s[0]),luc:s[4],is_complimentary:s[5],opening_soh:0,orders_in:0,consumed:0};});
    for(var i=0;i<rows.length;i+=50){var e=await sb.from('items').insert(rows.slice(i,i+50));if(e.error){toast('Seed error: '+e.error.message,true);return;}}
    await fetchItems();
    toast('✅ '+items.length+' items loaded!');
  }catch(ex){toast('Error: '+ex.message,true);}
}

async function fetchItems(){
  var r=await sb.from('items').select('*').order('category').order('name');
  if(r.error){toast('Fetch error: '+r.error.message,true);return;}
  items=(r.data||[]).map(function(i){return Object.assign({},i,{_sup:supFor(i.name)});});
}

// ── DASHBOARD ─────────────────────────────────────────────────
async function loadDash(){
  await fetchItems();
  var tv=items.reduce(function(s,i){return s+Math.max(0,soh(i))*i.luc;},0);
  var ins=items.filter(function(i){return soh(i)>0;}).length;
  var lo=items.filter(function(i){return soh(i)>0&&soh(i)<=3;}).length;
  var ou=items.filter(function(i){return soh(i)<=0;}).length;
  G('mv').textContent=items.length+' items'; G('mis').textContent=ins; G('mlo').textContent=lo; G('mout').textContent=ou;
  var al=items.filter(function(i){return soh(i)<=3;}).sort(function(a,b){return soh(a)-soh(b);});
  G('dalerts').innerHTML=al.length?al.map(function(i){return'<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--bdr)"><div><div style="font-size:12px;font-weight:600;color:var(--wht)">'+i.name+'</div><div style="font-size:11px;color:var(--mut)">'+i.category+' · '+i._sup+'</div></div>'+sbadge(i)+'</div>';}).join(''):'<div class="empty">✅ All items sufficiently stocked</div>';
  var cats={};
  items.forEach(function(i){cats[i.category]=(cats[i.category]||0)+Math.max(0,soh(i))*i.luc;});
  var lb=Object.keys(cats).filter(function(k){return cats[k]>0;});
  var vl=lb.map(function(k){return cats[k];});
  var co=['#e94560','#f39c12','#27ae60','#2980b9','#8e44ad','#e67e22','#1abc9c','#34495e','#c0392b','#16a085','#d35400'];
  if(chart) chart.destroy();
  chart=new Chart(G('chcat').getContext('2d'),{type:'doughnut',data:{labels:lb,datasets:[{data:vl,backgroundColor:co.slice(0,lb.length),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'#8892a4',font:{size:11},boxWidth:12}}}}});
  var ra=await sb.from('orders').select('*').order('created_at',{ascending:false}).limit(5);
  var rb=await sb.from('events').select('*').order('created_at',{ascending:false}).limit(5);
  var com=[].concat((ra.data||[]).map(function(o){return{type:'order',date:o.order_date,by:o.ordered_by,lbl:'Order submitted',cr:o.created_at};}),(rb.data||[]).map(function(e){return{type:'event',date:e.event_date,by:e.recorded_by,lbl:e.event_name,cr:e.created_at};})).sort(function(a,b){return new Date(b.cr)-new Date(a.cr);}).slice(0,8);
  G('dact').innerHTML=com.length?com.map(function(a){return'<div class="hi"><div class="hd '+a.type+'"></div><div><div style="font-size:13px;font-weight:500">'+a.lbl+'</div><div class="hm">'+(a.type==='order'?'🛒 Order':'📋 Consumption')+' · '+a.date+' · '+(a.by||'—')+'</div></div></div>';}).join(''):'<div class="empty">No activity yet.</div>';
}

// ── INVENTORY ─────────────────────────────────────────────────
var ILAYOUT=[
  {s:'LUXE',c:'#9a7a1f',t:'Luxe $65+',g:[{l:'Champagne & Sparkling',c:['Champagne','Sparkling']},{l:'White Wine',c:['White']},{l:'Red Wine',c:['Red']}]},
  {s:'CLIENT',c:'#1a5276',t:'Client $30-65',g:[{l:'Champagne & Sparkling',c:['Champagne','Sparkling']},{l:'White Wine',c:['White']},{l:'Rosé',c:['Rose']},{l:'Red Wine',c:['Red']}]},
  {s:'STAFF',c:'#1e6b40',t:'Staff <$30',g:[{l:'Sparkling',c:['Sparkling']},{l:'White Wine',c:['White']},{l:'Rosé',c:['Rose']},{l:'Red Wine',c:['Red']},{l:'Dessert Wine',c:['Dessert Wine']}]},
  {s:'NON-ALCOHOLIC',c:'#6c3483',t:'Non-Alc',g:[{l:'Non-Alc Wine',c:['Non-Alc Wine']},{l:'Non-Alc Cocktails',c:['Non-Alc Cocktail']}]},
  {s:'BEER',c:'#935116',t:null,g:[{l:null,c:['Beer']}]},
  {s:'SOFT DRINKS',c:'#154360',t:null,g:[{l:'1.25L Bottles',c:['Soft Drink'],f:function(i){return i.name.toLowerCase().includes('1.25');}},{l:'330ml Cans',c:['Soft Drink'],f:function(i){return !i.name.toLowerCase().includes('1.25');}},{l:'Water',c:['Water']}]},
  {s:'JUICES',c:'#1d6a35',t:null,g:[{l:null,c:['Juice']}]},
  {s:'SPIRITS & MIXERS',c:'#7b241c',t:null,g:[{l:'Spirits',c:['Spirit']},{l:'Mixers',c:['Mixer']}]}
];

function renderInv(){
  var el=G('ibody');
  var sr=(G('isrch')||{value:''}).value.toLowerCase();
  var sf=(G('istat')||{value:''}).value;
  function pass(i){var s=soh(i);if(sr&&!i.name.toLowerCase().includes(sr))return false;if(sf==='ok'&&s<=3)return false;if(sf==='low'&&!(s>0&&s<=3))return false;if(sf==='out'&&s>0)return false;return true;}
  function makeRow(i){
    var s=soh(i),sc=s<=0?'var(--acc)':s<=3?'#f39c12':'var(--wht)';
    var vt=i.vintage?'<span style="font-size:11px;color:var(--mut);margin-left:6px">'+i.vintage+'</span>':'';
    return '<tr style="border-bottom:1px solid var(--bdr);cursor:pointer" onclick="openEdit('+i.id+')" title="Click to edit SOH">'
      +'<td style="padding:10px 16px;font-weight:500;color:var(--acc)">'+i.name+vt+'</td>'
      +'<td style="padding:10px 16px;text-align:center;font-weight:700;font-size:15px;color:'+sc+'">'+Math.max(0,Math.round(s))+'</td>'
      +'<td style="padding:10px 16px;text-align:center">'+sbadge(i)+'</td>'
      +'</tr>';
  }
  var thead='<thead><tr style="background:var(--sur2)">'
    +'<th style="padding:9px 16px;text-align:left;font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase">Item</th>'
    +'<th style="padding:9px 16px;text-align:center;font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase;width:80px">SOH</th>'
    +'<th style="padding:9px 16px;text-align:center;font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase;width:100px">Status</th>'
    +'</tr></thead>';
  var html=''; var any=false;
  ILAYOUT.forEach(function(sec){
    var tbody='';
    sec.g.forEach(function(grp){
      var gi=items.filter(function(i){
        if(sec.t&&i.price_tier!==sec.t)return false;
        if(!grp.c.includes(i.category))return false;
        if(grp.f&&!grp.f(i))return false;
        return pass(i);
      });
      gi=sortByPopularity(gi);
      if(!gi.length)return;
      any=true;
      if(grp.l){
        tbody+='<tr style="background:rgba(255,255,255,.015)">'
          +'<td colspan="3" style="padding:7px 16px;font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:1px;border-top:1px solid var(--bdr)">— '+grp.l+' —</td>'
          +'</tr>';
      }
      tbody+=gi.map(makeRow).join('');
    });
    if(!tbody)return;
    html+='<div style="margin-bottom:22px;border-radius:10px;overflow:hidden;border:1px solid var(--bdr)">'
      +'<div style="background:'+sec.c+';padding:12px 20px;display:flex;align-items:center;gap:12px">'
      +'<span style="font-weight:800;font-size:14px;color:#fff;letter-spacing:1.5px">'+sec.s+'</span>'
      +(sec.t?'<span style="font-size:11px;color:rgba(255,255,255,.65)">'+sec.t+'</span>':'')
      +'</div>'
      +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">'
      +thead+'<tbody>'+tbody+'</tbody></table></div>'
      +'</div>';
  });
  el.innerHTML=any?html:'<div class="empty">No items match your search.</div>';
}


function openEdit(id){
  var i=items.find(function(x){return x.id===id;}); if(!i)return;
  G('eitn').textContent=i.name; G('eid').value=id;
  G('eop').value=Math.round(i.opening_soh||0); G('ecur').value=Math.round(soh(i));
  G('esupf').value=i.supplier||''; G('eluc').value=i.luc;
  openMo('medit');
}

G('saveedit').addEventListener('click', async function(){
  var id=parseInt(G('eid').value),i=items.find(function(x){return x.id===id;});
  var op=parseFloat(G('eop').value)||0,cu=parseFloat(G('ecur').value)||0;
  var con=Math.max(0,(op+(i.orders_in||0))-cu);
  var r=await sb.from('items').update({opening_soh:op,consumed:con,supplier:G('esupf').value,luc:parseFloat(G('eluc').value)||0}).eq('id',id);
  if(r.error){toast('Error: '+r.error.message,true);return;}
  await fetchItems(); renderInv(); closeMo('medit'); toast('✅ Item updated');
});

// ── ORDERS ───────────────────────────────────────────────────
var SUPS=[
  {k:'Sydney Wines',ct:'Antony',em:'antony@sydneywine.com.au',ic:'🍷',col:'#1a5276',ds:'Wines · Beer · Soft Drinks · Spirits'},
  {k:'Noah Juices',ct:'Mark',em:'orders@baco.com.au',ic:'🥤',col:'#1e6b40',ds:'Orange · Apple · Carrot Ginger · Green'},
  {k:"Young Henry's",ct:'Ben Stockton',em:'stocko@younghenrys.com',ic:'🍺',col:'#7d5a00',ds:'Young Henry Newtowner 330ml'}
];

function loadOrders(){ G('odate').value=td(); G('oby').value=G('usel').value||''; showOS1(); }
function showOS1(){ G('os1').style.display='block'; G('os2').style.display='none'; activeSup=null; renderSCards(); }

function renderSCards(){
  G('scards').innerHTML=SUPS.map(function(s,idx){
    var si=items.filter(function(i){return i._sup===s.k;});
    var ins=si.filter(function(i){return soh(i)>0;}).length;
    var out=si.filter(function(i){return soh(i)<=0;}).length;
    return'<div onclick="pickSup('+idx+')" style="background:var(--sur);border:1px solid var(--bdr);border-radius:12px;overflow:hidden;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor=\''+s.col+'\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.borderColor=\'var(--bdr)\';this.style.transform=\'none\'"><div style="background:'+s.col+';padding:16px 20px;display:flex;align-items:center;gap:12px"><span style="font-size:28px">'+s.ic+'</span><div><div style="font-weight:800;font-size:15px;color:#fff">'+s.k+'</div><div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:2px">'+s.ct+' · '+s.em+'</div></div></div><div style="padding:14px 20px"><div style="font-size:12px;color:var(--mut);margin-bottom:10px">'+s.ds+'</div><div style="display:flex;gap:10px"><span style="font-size:11px;background:rgba(39,174,96,.12);color:#27ae60;padding:3px 10px;border-radius:20px;font-weight:600">'+ins+' in stock</span>'+(out>0?'<span style="font-size:11px;background:rgba(233,69,96,.12);color:#e94560;padding:3px 10px;border-radius:20px;font-weight:600">'+out+' out</span>':'')+'</div></div><div style="padding:10px 20px 14px"><div style="background:'+s.col+';color:#fff;text-align:center;border-radius:7px;padding:9px;font-size:13px;font-weight:700">Place Order →</div></div></div>';
  }).join('');
}

function pickSup(idx){
  var s=SUPS[idx]; activeSup=s.k;
  G('os1').style.display='none'; G('os2').style.display='block';
  G('osupn').textContent=s.k; G('osupm').textContent=s.ct+' · '+s.em;
  renderOItems(); updateOTotal();
}

function renderOItems(){
  var si=typeof sortByPopularity==='function'
    ? sortByPopularity(items.filter(function(i){return i._sup===activeSup;}))
    : items.filter(function(i){return i._sup===activeSup;});
  var grps={};
  si.forEach(function(i){
    var g=i.category;
    if(g==='Soft Drink') g=i.name.toLowerCase().includes('1.25')?'Soft Drink 1.25L':'Soft Drink 330ml';
    if(!grps[g]) grps[g]=[];
    grps[g].push(i);
  });
  var ord=['Champagne','Sparkling','White','Rose','Red','Dessert Wine','Non-Alc Wine','Non-Alc Cocktail','Beer','Soft Drink 1.25L','Soft Drink 330ml','Water','Juice','Spirit','Mixer'];
  var srt=Object.keys(grps).sort(function(a,b){return(ord.indexOf(a)<0?99:ord.indexOf(a))-(ord.indexOf(b)<0?99:ord.indexOf(b));});
  var html=srt.map(function(g){
    var gi=grps[g];
    var rows=gi.map(function(i){
      var s=soh(i),cs=ctn(i),sc=s<=0?'var(--acc)':s<=3?'#f39c12':'var(--wht)';
      var vt=i.vintage?' <span style="color:var(--mut);font-size:11px">'+i.vintage+'</span>':'';
      var td_name='<td style="padding:10px 14px;font-weight:500">'+i.name+vt+'</td>';
      var td_soh='<td style="padding:10px 14px;text-align:center;font-weight:700;color:'+sc+'">'+Math.max(0,Math.round(s))+'</td>';
      var td_ctn='<td style="padding:10px 14px;font-size:11px;color:var(--mut);text-align:center">'+cs.l+'</td>';
      var td_qty='<td style="padding:8px 14px;text-align:center;background:rgba(243,156,18,.04)">'
        +'<div style="display:flex;align-items:center;gap:5px;justify-content:center">'
        +'<button type="button" onclick="adjOQ('+i.id+',-1)" style="background:var(--sur2);border:1px solid var(--bdr);border-radius:6px;width:28px;height:28px;color:var(--wht);font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1">&#8722;</button>'
        +'<input type="number" id="qo'+i.id+'" min="0" step="1" placeholder="0"'
        +' style="width:54px;background:var(--sur);border:1.5px solid var(--bdr);color:var(--wht);border-radius:6px;padding:5px 6px;font-size:14px;font-weight:700;text-align:center;font-family:inherit"'
        +' oninput="updateOTotal()" onchange="updateOTotal()">'
        +'<button type="button" onclick="adjOQ('+i.id+',1)" style="background:var(--sur2);border:1px solid var(--bdr);border-radius:6px;width:28px;height:28px;color:var(--wht);font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1">+</button>'
        +'</div></td>';
      return '<tr style="border-bottom:1px solid var(--bdr)">'+td_name+td_soh+td_ctn+td_qty+'</tr>';
    }).join('');
    return '<div style="margin-bottom:16px;border-radius:10px;overflow:hidden;border:1px solid var(--bdr)">'
      +'<div style="background:var(--sur2);padding:9px 16px;font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:1.2px;display:flex;align-items:center;justify-content:space-between">'
      +'<span>'+g+'</span><span style="font-weight:400">'+gi.length+' item'+(gi.length!==1?'s':'')+'</span></div>'
      +'<table style="width:100%;border-collapse:collapse;font-size:13px">'
      +'<thead><tr style="background:rgba(255,255,255,.02)">'
      +'<th style="padding:7px 14px;text-align:left;font-size:10px;color:var(--mut)">Item</th>'
      +'<th style="padding:7px 14px;text-align:center;font-size:10px;color:var(--mut)">SOH</th>'
      +'<th style="padding:7px 14px;text-align:center;font-size:10px;color:var(--mut)">Carton</th>'
      +'<th style="padding:7px 14px;text-align:center;font-size:10px;color:#f39c12;background:rgba(243,156,18,.06)">QTY</th>'
      +'</tr></thead><tbody>'+rows+'</tbody></table></div>';
  }).join('');
  G('ogrps').innerHTML=html;
}

function adjOQ(id,d){var el=document.getElementById('qo'+id);if(!el)return;el.value=Math.max(0,(parseFloat(el.value)||0)+d);updateOTotal();}

function updateOTotal(){
  var tot=0;
  items.forEach(function(i){
    var el=document.getElementById('qo'+i.id); if(!el)return;
    var c=parseFloat(el.value)||0,line=c*ctn(i).q*i.luc; tot+=line;
    
    if(c>0) el.style.borderColor='#f39c12';
  });
  // totals removed
}

G('subord').addEventListener('click', function(){
  var date=G('odate').value,by=G('oby').value.trim(),notes='';
  if(!date||!by){toast('Please enter order date and your name',true);return;}
  if(!activeSup){toast('No supplier selected',true);return;}
  var lines=[];
  items.forEach(function(i){var el=document.getElementById('qo'+i.id);if(!el)return;var c=parseFloat(el.value)||0;if(c>0)lines.push({item:i,cartons:c,units:c*ctn(i).q});});
  if(!lines.length){toast('No quantities entered',true);return;}
  pending={date:date,by:by,notes:notes,lines:lines,sup:activeSup};
  showEmailPreview();
  openMo('memail');
});

function showEmailPreview(){
  var sup=SUPS.find(function(s){return s.k===pending.sup;})||{ct:pending.sup,em:''};
  var grouped={};
  pending.lines.forEach(function(l){var c=l.item.category;if(!grouped[c])grouped[c]=[];grouped[c].push(l);});
  var body='Hi '+sup.ct+',\n\nCan we please have the following delivered to us next week:\n';

  body+='\n';
  Object.keys(grouped).forEach(function(cat){
    body+=cat+':\n';
    grouped[cat].forEach(function(l){body+='  '+l.cartons+' x carton'+(l.cartons!==1?'s':'')+' — '+l.item.name+' ('+l.units+' units)\n';});
    body+='\n';
  });
  var sub=pending.lines.reduce(function(s,l){return s+l.units*l.item.luc;},0);
  body+='Many thanks,\n'+pending.by+'\nPwC Sydney';
  G('metitle').textContent='📧 Order Email — '+pending.sup;
  G('mebody').innerHTML='<p style="color:var(--mut);font-size:12px;margin-bottom:14px">Copy this email and paste into Outlook. Then click <strong>Confirm & Update Inventory</strong>.</p><div style="background:var(--bg);border:1px solid var(--bdr);border-radius:8px;padding:16px 20px;font-size:13px;line-height:1.9;white-space:pre-wrap;color:var(--txt);max-height:360px;overflow-y:auto" id="eprev">'+body+'</div>';
  G('mefooter').innerHTML='<button class="btn bo" onclick="copyEmail()">📋 Copy Email</button><button class="btn bo" onclick="closeMo(\'memail\')">Cancel</button><button class="btn bs" onclick="confirmOrder()">✅ Confirm &amp; Update Inventory</button>';
}

function copyEmail(){
  var text=G('eprev')?G('eprev').textContent:'';
  var plain=text.replace(/\n/g,'\r\n');
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(plain).then(function(){toast('📋 Copied! Paste into Outlook.');}).catch(function(){fallbackCopy(plain);});
  } else { fallbackCopy(plain); }
}
function fallbackCopy(text){var t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);toast('📋 Copied!');}

async function confirmOrder(){
  if(!pending)return;
  var btn=G('mefooter').querySelector('.bs');
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    var r1=await sb.from('orders').insert({order_date:pending.date,ordered_by:pending.by,status:'submitted'}).select().single();
    if(r1.error) throw new Error(r1.error.message);
    var r2=await sb.from('order_lines').insert(pending.lines.map(function(l){return{order_id:r1.data.id,item_id:l.item.id,quantity:l.units,unit_cost:l.item.luc};}));
    if(r2.error) throw new Error(r2.error.message);
    for(var j=0;j<pending.lines.length;j++){var l=pending.lines[j];await sb.from('items').update({orders_in:(parseFloat(l.item.orders_in)||0)+l.units}).eq('id',l.item.id);}
    await fetchItems(); loadOrders();
    var oid=r1.data.id; pending=null;
    G('metitle').textContent='✅ Order Saved!';
    G('mebody').innerHTML='<div style="text-align:center;padding:24px 0"><div style="font-size:40px;margin-bottom:12px">✅</div><div style="font-size:15px;font-weight:700;color:var(--wht);margin-bottom:6px">Order confirmed &amp; inventory updated</div><button class="btn bo" onclick="printOrd('+oid+')" style="margin-top:8px">🖨️ Print this Order</button></div>';
    G('mefooter').innerHTML='<button class="btn bs" onclick="closeMo(\'memail\')">Done</button>';
  }catch(ex){toast(ex.message,true);if(btn){btn.disabled=false;btn.textContent='✅ Confirm & Update Inventory';}}
}

// ── CONSUMPTION ───────────────────────────────────────────────
var CCATS=[
  ['🍾 Champagne & Sparkling',['Champagne','Sparkling']],['🥂 White Wine',['White']],['🌹 Rosé',['Rose']],
  ['🍷 Red Wine',['Red']],['🍸 Non-Alc',['Non-Alc Wine','Non-Alc Cocktail','Dessert Wine']],
  ['🍺 Beer',['Beer']],['🥤 Soft Drinks',['Soft Drink','Water']],['🧃 Juices',['Juice']],['🥃 Spirits & Mixers',['Spirit','Mixer']]
];

function loadCon(){ G('edate').value=td(); conCounts={}; showCS1(); }
function showCS1(){ G('cs1').style.display='block'; G('cs2').style.display='none'; renderShorts(); }

function renderShorts(){
  G('cshorts').innerHTML=CCATS.map(function(c,i){return'<button onclick="jumpCat('+i+')" style="background:var(--sur);border:1px solid var(--bdr);border-radius:20px;padding:6px 14px;color:var(--txt);font-size:12px;cursor:pointer;font-family:inherit;transition:all .15s" onmouseover="this.style.borderColor=\'var(--acc)\'" onmouseout="this.style.borderColor=\'var(--bdr)\'">'+c[0]+'</button>';}).join('');
}

function valEvt(){
  if(!G('ename').value.trim()||!G('edate').value){toast('Please fill in Function Name and Date',true);return false;}return true;
}

G('cnext').addEventListener('click',function(){if(!valEvt())return;goCS2(CCATS[0][0]);});
function jumpCat(idx){if(!valEvt())return;goCS2(CCATS[idx][0]);}

function goCS2(){
  G('cs1').style.display='none'; G('cs2').style.display='block';
  G('cbadget').textContent=G('ename').value;
  var pts=[G('edate').value,G('etime').value,G('eroom').value,G('epax').value?G('epax').value+' pax':'',G('etype').value,G('esup').value];
  G('cbadgem').textContent=pts.filter(Boolean).join(' · ');
  renderAllCats();
}

// Render ALL categories at once in one scrollable page — no tabs, no state loss
function renderAllCats(){
  var jumpHtml='';
  var bodyHtml='';

  CCATS.forEach(function(cat,idx){
    var cats=cat[1];
    var ci=sortByPopularity(items.filter(function(i){return cats.includes(i.category);}));
    if(!ci.length) return;

    // Sub-group within category (e.g. Soft Drink 1.25L vs 330ml)
    var subs={};
    ci.forEach(function(i){
      var s=i.category;
      if(s==='Soft Drink') s=i.name.toLowerCase().includes('1.25')?'Soft Drink 1.25L':'Soft Drink 330ml';
      if(!subs[s]) subs[s]=[];
      subs[s].push(i);
    });

    var anchorId='ccat_'+idx;
    jumpHtml+='<button onclick="document.getElementById(\''+anchorId+'\').scrollIntoView({behavior:\'smooth\',block:\'start\'})" '
      +'style="background:var(--sur);border:1px solid var(--bdr);border-radius:20px;padding:6px 14px;color:var(--txt);font-size:12px;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap" '
      +'id="jmp_'+idx+'">'
      +cat[0]+'</button>';

    var subHtml=Object.keys(subs).map(function(sub){
      var si=subs[sub];
      var multiSub=Object.keys(subs).length>1;
      var rows=si.map(function(i){
        var s=soh(i),sc=s<=0?'var(--acc)':s<=3?'#f39c12':'var(--wht)',ic=i.is_complimentary;
        var vt=i.vintage?' <span style="color:var(--mut);font-size:11px">'+i.vintage+'</span>':'';
        var curVal=conCounts[i.id]||0;
        return '<tr style="border-bottom:1px solid var(--bdr);'+(ic?'background:rgba(41,128,185,.04)':'')+'">'+
          '<td style="padding:10px 14px">'+
            '<div style="font-weight:500">'+i.name+vt+'</div>'+
            (ic?'<div style="font-size:10px;color:#5dade2;margin-top:2px">✓ Complimentary</div>':'')+
          '</td>'+
          '<td style="padding:10px 14px;text-align:center;font-weight:700;color:'+sc+'">'+Math.max(0,Math.round(s))+'</td>'+
          '<td style="padding:10px 14px;text-align:center;background:rgba(41,128,185,.06)">'+
            '<div style="display:flex;align-items:center;justify-content:center;gap:8px">'+
              '<button type="button" onclick="adjOp('+i.id+',-1)" style="background:var(--sur2);border:1px solid var(--bdr);border-radius:6px;width:32px;height:32px;color:var(--wht);font-size:18px;cursor:pointer;font-weight:700;line-height:1;font-family:inherit;flex-shrink:0">−</button>'+
              '<input type="number" id="qop_'+i.id+'" min="0" step="1" placeholder="0"'+
              (curVal>0?' value="'+curVal+'"':'')+
              ' style="width:60px;background:var(--sur);border:1.5px solid '+(curVal>0?'var(--grn)':(ic?'rgba(41,128,185,.5)':'var(--bdr)'))+';color:'+(curVal>0?'var(--wht)':'var(--txt)')+';border-radius:6px;padding:5px 6px;font-size:15px;font-weight:700;text-align:center;font-family:inherit"'+
              ' oninput="onOpInput('+i.id+')">'+
              '<button type="button" onclick="adjOp('+i.id+',1)" style="background:var(--sur2);border:1px solid var(--bdr);border-radius:6px;width:32px;height:32px;color:var(--wht);font-size:18px;cursor:pointer;font-weight:700;line-height:1;font-family:inherit;flex-shrink:0">+</button>'+
            '</div>'+
          '</td>'+
        '</tr>';
      }).join('');
      return (multiSub?'<tr style="background:var(--sur2)"><td colspan="3" style="padding:6px 14px;font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:1px">'+sub+'</td></tr>':'')+rows;
    }).join('');

    bodyHtml+='<div id="'+anchorId+'" style="margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid var(--bdr);scroll-margin-top:60px">'+
      '<div style="background:var(--sur2);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--bdr)">'+
        '<span style="font-weight:700;font-size:13px;color:var(--wht)">'+cat[0]+'</span>'+
        '<span id="cbadge_'+idx+'" style="font-size:11px;color:var(--mut)"></span>'+
      '</div>'+
      '<table style="width:100%;border-collapse:collapse;font-size:13px">'+
      '<thead><tr style="background:rgba(255,255,255,.02)">'+
        '<th style="padding:7px 14px;text-align:left;font-size:10px;color:var(--mut)">Item</th>'+
        '<th style="padding:7px 14px;text-align:center;font-size:10px;color:var(--mut);width:60px">SOH</th>'+
        '<th style="padding:7px 14px;text-align:center;font-size:10px;color:#5dade2;background:rgba(41,128,185,.06)">Opening Count</th>'+
      '</tr></thead>'+
      '<tbody>'+subHtml+'</tbody></table></div>';
  });

  G('ctabs').innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;padding-bottom:4px">'+jumpHtml+'</div>';
  G('cgrp').innerHTML=bodyHtml;
  updateCSummary();
}

function adjOp(id,d){
  var el=document.getElementById('qop_'+id);if(!el)return;
  el.value=Math.max(0,(parseFloat(el.value)||0)+d);
  onOpInput(id);
}

function onOpInput(id){
  var el=document.getElementById('qop_'+id);
  var val=el?Math.max(0,parseFloat(el.value)||0):0;
  conCounts[id]=val;
  // Update input border colour live to show it's been entered
  if(el) el.style.borderColor=val>0?'var(--grn)':'var(--bdr)';
  updateCSummary();
}

function updateCSummary(){
  // Read entirely from conCounts — never touches DOM for data
  var entered=items.filter(function(i){return (conCounts[i.id]||0)>0;});
  G('csum').style.display=entered.length?'block':'none';
  if(entered.length){
    G('csumlist').innerHTML=entered.map(function(i){
      var q=conCounts[i.id]||0;
      return'<div style="background:var(--sur2);border:1px solid var(--grn);border-radius:20px;padding:4px 10px;font-size:12px;display:flex;align-items:center;gap:6px">'+
        '<span style="font-weight:700;color:var(--grn)">'+q+'×</span>'+
        '<span>'+(i.name.length>30?i.name.substring(0,28)+'…':i.name)+'</span>'+
      '</div>';
    }).join('');
  }
  // Update per-category badge counts in jump bar
  CCATS.forEach(function(cat,idx){
    var n=items.filter(function(i){return cat[1].includes(i.category)&&(conCounts[i.id]||0)>0;}).length;
    var badge=document.getElementById('cbadge_'+idx);
    if(badge) badge.textContent=n>0?n+' entered':'';
    var jmp=document.getElementById('jmp_'+idx);
    if(jmp) jmp.style.borderColor=n>0?'var(--grn)':'var(--bdr)';
    if(jmp) jmp.style.color=n>0?'var(--grn)':'var(--txt)';
  });
}

// Stubs for backward compat
function calcConsumed(id){onOpInput(id);}
function adjC(id,d){adjOp(id,d);}
function adjOpen(id,d){adjOp(id,d);}
function adjClose(id,d){}
function onOC(id){onOpInput(id);}
function swCat(){}
function renderCTabs(){}
function renderCGrp(){}

G('subcon').addEventListener('click', async function(){
  var name=G('ename').value.trim(),date=G('edate').value,type=G('etype').value;
  if(!name||!date){toast('Please fill in Function Name and Date',true);return;}
  // Collect from conCounts (persists across tab switches) rather than DOM inputs
  var lines=[];
  items.forEach(function(i){
    var q=parseFloat(conCounts[i.id])||0;
    if(q>0) lines.push({item:i,qty:q});
  });
  if(!lines.length){toast('No quantities entered',true);return;}
  var btn=G('subcon'); btn.disabled=true; btn.textContent='Saving…';
  try{
    var bid=(G('ebid')||{value:''}).value.trim(),room=(G('eroom')||{value:''}).value.trim(),pax=parseInt((G('epax')||{value:''}).value)||null,sup=(G('esup')||{value:''}).value.trim(),etime=(G('etime')||{value:''}).value,by=sup||G('usel').value||'Team';
    var r1=await sb.from('events').insert({event_name:name,event_date:date,event_time:etime,event_type:type,recorded_by:by,booking_id:bid,room:room,pax:pax,supervisor:sup,status:'open'}).select().single();
    if(r1.error) throw new Error(r1.error.message);
    var r2=await sb.from('event_lines').insert(lines.map(function(l){return{event_id:r1.data.id,item_id:l.item.id,quantity:l.qty,opening_qty:l.qty};}));
    if(r2.error) throw new Error(r2.error.message);
    for(var k=0;k<lines.length;k++){
      var ln=lines[k];
      await sb.from('items').update({consumed:(parseFloat(ln.item.consumed)||0)+ln.qty}).eq('id',ln.item.id);
    }
    await fetchItems(); G('ename').value=''; conCounts={}; loadCon();
    toast('✅ Opening count saved — event is now Active. Close it after drinks are returned.');
    document.querySelector('#nav a[data-p="history"]').click();
    setTimeout(function(){
      var actTab=document.querySelector('.tb[data-t="hact"]');
      if(actTab) actTab.click();
    },200);
  }catch(ex){toast('Error: '+ex.message,true);}
  finally{btn.textContent='✅ Submit Opening Count';btn.disabled=false;}
});

// ── HISTORY ───────────────────────────────────────────────────
async function loadHist(){
  // Orders
  var ro=await sb.from('orders').select('*,order_lines(*,items(name))').order('created_at',{ascending:false});
  var ob=G('ohb');
  ob.innerHTML=!(ro.data&&ro.data.length)?'<tr><td colspan="6"><div class="empty">No orders yet</div></td></tr>':
    ro.data.map(function(o){
      var cnt=o.order_lines?o.order_lines.length:0;
      var tot=(o.order_lines||[]).reduce(function(s,l){return s+(l.quantity||0)*(l.unit_cost||0);},0);
      return '<tr>'
        +'<td>'+o.order_date+'</td>'
        +'<td style="font-weight:500">'+(o.ordered_by||'—')+'</td>'
        +'<td>'+cnt+' item'+(cnt!==1?'s':'')+'</td>'
        +'<td>'+fmt(tot)+'</td>'
        +'<td style="color:var(--mut);font-size:12px">'+(o.notes||'—')+'</td>'
        +'<td style="display:flex;gap:6px;justify-content:flex-end">'
          +'<button class="btn bo bsm" onclick="viewOrd('+o.id+')">View</button>'
          +'<button class="btn bo bsm" onclick="editOrd('+o.id+')">✏️ Edit</button>'
          +'<button class="btn bo bsm" onclick="printOrd('+o.id+')">🖨️</button>'
        +'</td>'
        +'</tr>';
    }).join('');

  // Active Events (status = 'open')
  var ra=await sb.from('events').select('*,event_lines(*,items(name))').eq('status','open').order('created_at',{ascending:false});
  var ab=G('hactb');
  ab.innerHTML=!(ra.data&&ra.data.length)?'<tr><td colspan="6"><div class="empty" style="padding:32px">✅ No active events — all events have been closed.</div></td></tr>':
    ra.data.map(function(e){
      var cnt=e.event_lines?e.event_lines.length:0;
      var totalOut=(e.event_lines||[]).reduce(function(s,l){return s+(l.opening_qty||l.quantity||0);},0);
      return '<tr>'
        +'<td>'+e.event_date+(e.event_time?' <span style="color:var(--mut);font-size:11px">'+e.event_time+'</span>':'')+'</td>'
        +'<td style="font-weight:600;color:var(--wht)">'+e.event_name+'</td>'
        +'<td><span class="badge bcat">'+(e.event_type||'—')+'</span></td>'
        +'<td>'+(e.supervisor||e.recorded_by||'—')+'</td>'
        +'<td>'+cnt+' item'+(cnt!==1?'s':'')+' <span style="color:var(--mut);font-size:11px">('+Math.round(totalOut)+' units out)</span></td>'
        +'<td style="display:flex;gap:6px;justify-content:flex-end">'
          +'<button class="btn bo bsm" onclick="viewEvt('+e.id+')">View</button>'
          +'<button class="btn bs bsm" onclick="openCloseEvt('+e.id+')">📦 Close Event</button>'
        +'</td>'
        +'</tr>';
    }).join('');

  // Update tab badge
  var actCount=ra.data?ra.data.length:0;
  var actTab=document.querySelector('.tb[data-t="hact"]');
  if(actTab) actTab.textContent='🟢 Active Events'+(actCount>0?' ('+actCount+')':'');

  // Past Events (status = 'closed')
  var re=await sb.from('events').select('*,event_lines(*,items(name))').eq('status','closed').order('created_at',{ascending:false});
  var eb=G('chb');
  eb.innerHTML=!(re.data&&re.data.length)?'<tr><td colspan="6"><div class="empty">No past events yet</div></td></tr>':
    re.data.map(function(e){
      var cnt=e.event_lines?e.event_lines.length:0;
      return '<tr>'
        +'<td>'+e.event_date+'</td>'
        +'<td style="font-weight:500">'+e.event_name+'</td>'
        +'<td><span class="badge bcat">'+(e.event_type||'—')+'</span></td>'
        +'<td>'+(e.recorded_by||'—')+'</td>'
        +'<td>'+cnt+' item'+(cnt!==1?'s':'')+'</td>'
        +'<td style="display:flex;gap:6px;justify-content:flex-end">'
          +'<button class="btn bo bsm" onclick="viewEvt('+e.id+')">View</button>'
          +'<button class="btn bo bsm" onclick="printCon('+e.id+')">🖨️ Print</button>'
        +'</td>'
        +'</tr>';
    }).join('');
}

async function viewOrd(id){
  var r=await sb.from('orders').select('*,order_lines(*,items(name,category))').eq('id',id).single();
  var d=r.data,tot=(d.order_lines||[]).reduce(function(s,l){return s+(l.quantity||0)*(l.unit_cost||0);},0);
  G('mordb').innerHTML='<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--bdr)"><b>'+d.order_date+'</b> · '+(d.ordered_by||'—')+(d.notes?'<br><small style="color:var(--mut)">'+d.notes+'</small>':'')+'</div><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:var(--sur2)"><th style="padding:8px">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Unit Cost</th><th style="padding:8px;text-align:right">Total</th></tr></thead><tbody>'+(d.order_lines||[]).map(function(l){return'<tr style="border-bottom:1px solid var(--bdr)"><td style="padding:8px">'+(l.items?l.items.name:'—')+'</td><td style="padding:8px;text-align:center">'+l.quantity+'</td><td style="padding:8px;text-align:right">'+fmt(l.unit_cost)+'</td><td style="padding:8px;text-align:right;font-weight:600">'+fmt((l.quantity||0)*(l.unit_cost||0))+'</td></tr>';}).join('')+'</tbody><tfoot><tr style="background:var(--sur2)"><td colspan="3" style="padding:10px;font-weight:700;text-align:right">TOTAL</td><td style="padding:10px;font-weight:700;text-align:right;color:var(--grn)">'+fmt(tot)+'</td></tr></tfoot></table>';
  openMo('mordm');
}

async function viewEvt(id){
  var r=await sb.from('events').select('*,event_lines(*,items(name,category,is_complimentary))').eq('id',id).single();
  var d=r.data, isClosed=d.status==='closed';
  var header='<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--bdr)">'
    +'<b style="font-size:15px;color:var(--wht)">'+d.event_name+'</b><br>'
    +'<span style="font-size:12px;color:var(--mut)">'
    +(d.event_date||'')+( d.event_time?' · '+d.event_time:'')
    +(d.event_type?' · '+d.event_type:'')
    +(d.supervisor?' · Supervisor: '+d.supervisor:'')
    +(d.room?' · '+d.room:'')+(d.pax?' · '+d.pax+' pax':'')
    +'</span>'
    +(isClosed
      ?'<span style="margin-left:10px;background:rgba(39,174,96,.15);color:#27ae60;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">✅ Closed</span>'
      :'<span style="margin-left:10px;background:rgba(243,156,18,.15);color:#f39c12;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">🟢 Active</span>')
    +'</div>';
  var cols=isClosed
    ?'<th style="padding:8px;text-align:center">Opening</th><th style="padding:8px;text-align:center">Closing</th><th style="padding:8px;text-align:center;color:var(--acc)">Consumed</th>'
    :'<th style="padding:8px;text-align:center;color:#5dade2">Opening Count</th>';
  var rows=(d.event_lines||[]).map(function(l){
    var op=Math.round(parseFloat(l.opening_qty||l.quantity||0));
    var cl=l.closing_qty!=null?Math.round(parseFloat(l.closing_qty)):'—';
    var con=l.consumed_qty!=null?Math.round(parseFloat(l.consumed_qty)):op;
    var ic=l.items&&l.items.is_complimentary;
    if(isClosed){
      return'<tr style="border-bottom:1px solid var(--bdr)'+(ic?';color:#5dade2':'')+'"><td style="padding:8px">'+(l.items?l.items.name:'—')+(ic?' <em style="font-size:10px">(Comp)</em>':'')+'</td>'
        +'<td style="padding:8px;text-align:center;font-weight:700;color:#5dade2">'+op+'</td>'
        +'<td style="padding:8px;text-align:center;font-weight:700;color:#f39c12">'+cl+'</td>'
        +'<td style="padding:8px;text-align:center;font-weight:700;color:var(--acc)">'+con+'</td></tr>';
    } else {
      return'<tr style="border-bottom:1px solid var(--bdr)"><td style="padding:8px">'+(l.items?l.items.name:'—')+'</td>'
        +'<td style="padding:8px;text-align:center;font-weight:700;color:#5dade2">'+op+'</td></tr>';
    }
  }).join('');
  G('meventb').innerHTML=header
    +'<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:var(--sur2)">'
    +'<th style="padding:8px;text-align:left">Item</th>'+cols
    +'</tr></thead><tbody>'+rows+'</tbody></table>';
  G('meventmf').innerHTML='<button class="btn bo" onclick="closeMo(\'meventm\')">Close</button>'
    +(isClosed?'<button class="btn bo" onclick="printCon('+d.id+');closeMo(\'meventm\')">🖨️ Print</button>':'<button class="btn bs" onclick="closeMo(\'meventm\');openCloseEvt('+d.id+')">📦 Enter Closing Count</button>');
  openMo('meventm');
}

// ── SETTINGS ─────────────────────────────────────────────────
function loadSettings(){
  var st=localStorage.getItem('pbevs'); if(st) settings=JSON.parse(st);
  var sel=G('usel');
  sel.innerHTML='<option value="">Select your name</option>'+(settings.members||[]).map(function(m){return'<option value="'+m+'">'+m+'</option>';}).join('');
  renderML();
}
function saveS(){ localStorage.setItem('pbevs',JSON.stringify(settings)); }
function renderML(){
  var el=G('mlist');
  if(!(settings.members&&settings.members.length)){el.innerHTML='<span style="color:var(--mut);font-size:13px">No members added</span>';return;}
  el.innerHTML=settings.members.map(function(m){return'<div style="display:flex;align-items:center;gap:6px;background:var(--sur2);padding:6px 12px;border-radius:20px;border:1px solid var(--bdr)"><span style="font-size:13px">'+m+'</span><button onclick="rmM(\''+m+'\')" style="background:none;border:none;color:var(--mut);cursor:pointer;font-size:14px;line-height:1">✕</button></div>';}).join('');
  var sel=G('usel'),prev=sel.value;
  sel.innerHTML='<option value="">Select your name</option>'+settings.members.map(function(m){return'<option value="'+m+'"'+(m===prev?' selected':'')+'>'+m+'</option>';}).join('');
}
G('addmb').addEventListener('click',function(){
  var n=G('nmi').value.trim(); if(!n)return;
  if(!settings.members)settings.members=[];
  if(!settings.members.includes(n)){settings.members.push(n);saveS();renderML();}
  G('nmi').value='';
});
function rmM(n){settings.members=settings.members.filter(function(m){return m!==n;});saveS();renderML();}
G('rstbtn').addEventListener('click', async function(){
  if(!confirm('Reset all opening stocks to current SOH?'))return;
  for(var j=0;j<items.length;j++){var i=items[j],cur=Math.max(0,soh(i));await sb.from('items').update({opening_soh:cur,orders_in:0,consumed:0}).eq('id',i.id);}
  await fetchItems(); toast('✅ Monthly reset complete');
});

// ── REPORTS ───────────────────────────────────────────────────
async function loadReports(){
  var el=G('rlist');
  var r=await sb.from('monthly_reports').select('*').order('report_month',{ascending:false});
  if(r.error||!(r.data&&r.data.length)){el.innerHTML='<div class="empty">No reports yet. Click "Generate Now" above.</div>';return;}
  el.innerHTML='<div>'+r.data.map(function(rep){
    var sn=rep.snapshot||{},val=sn.total_value?fmt(sn.total_value):'—';
    return'<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--bdr);flex-wrap:wrap;gap:10px"><div><div style="font-weight:700;font-size:14px;color:var(--wht)">'+(rep.report_label||rep.report_month)+'</div><div style="font-size:11px;color:var(--mut);margin-top:3px">'+new Date(rep.generated_at).toLocaleString('en-AU')+' · Portfolio: '+val+' · '+(sn.item_count||0)+' items · '+(sn.order_count||0)+' orders · '+(sn.event_count||0)+' events</div></div><div style="display:flex;gap:8px"><button class="btn bo bsm" onclick="printRep(\''+rep.report_month+'\')">🖨️ Print</button><button class="btn bo bsm" onclick="exportRepXL(\''+rep.report_month+'\')">📊 Excel</button></div></div>';
  }).join('')+'</div>';
}

async function genReport(isAuto){
  var now=new Date(),tgt=isAuto?new Date(now.getFullYear(),now.getMonth()-1,1):new Date(now.getFullYear(),now.getMonth(),1);
  var mk=tgt.getFullYear()+'-'+String(tgt.getMonth()+1).padStart(2,'0');
  var mn=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var lbl=mn[tgt.getMonth()]+' '+tgt.getFullYear();
  await fetchItems();
  var ro=await sb.from('orders').select('*'); var re=await sb.from('events').select('*');
  var snap={total_value:items.reduce(function(s,i){return s+Math.max(0,soh(i))*i.luc;},0),item_count:items.length,in_stock:items.filter(function(i){return soh(i)>0;}).length,out_of_stock:items.filter(function(i){return soh(i)<=0;}).length,order_count:(ro.data||[]).length,event_count:(re.data||[]).length,items:items.map(function(i){return{id:i.id,name:i.name,category:i.category,price_tier:i.price_tier,supplier:i._sup||i.supplier,luc:i.luc,opening_soh:i.opening_soh,orders_in:i.orders_in,consumed:i.consumed,current_soh:Math.max(0,soh(i)),soh_value:Math.max(0,soh(i))*i.luc};})};
  var r=await sb.from('monthly_reports').upsert({report_month:mk,report_label:lbl,is_auto:isAuto,generated_by:isAuto?'Auto':(G('usel').value||'Manual'),snapshot:snap},{onConflict:'report_month'});
  if(r.error){toast('Error: '+r.error.message,true);return;}
  toast('✅ Report saved: '+lbl); loadReports();
}


function filterOItems(){
  var q=(G('osrch')||{value:''}).value.toLowerCase().trim();
  document.querySelectorAll('#ogrps tbody tr').forEach(function(row){
    var name=row.cells[0]?row.cells[0].textContent.toLowerCase():'';
    row.style.display=(!q||name.includes(q))?'':'none';
  });
  document.querySelectorAll('#ogrps > div').forEach(function(sec){
    var vis=Array.from(sec.querySelectorAll('tbody tr')).filter(function(r){return r.style.display!=='none';}).length;
    sec.style.display=(q&&vis===0)?'none':'';
  });
}

function filterCItems(){
  var q=(G('csrch')||{value:''}).value.toLowerCase().trim();
  document.querySelectorAll('#cgrp tbody tr').forEach(function(row){
    var name=row.cells[0]?row.cells[0].textContent.toLowerCase():'';
    row.style.display=(!q||name.includes(q))?'':'none';
  });
}

// ── STOCKTAKE ─────────────────────────────────────────────────
function startStocktake(){
  G('stoverlay').style.display='block';
  document.body.style.overflow='hidden';
  renderStocktake();
}

function closeStocktake(){
  G('stoverlay').style.display='none';
  document.body.style.overflow='';
}

function renderStocktake(){
  var LAYOUT=[
    {s:'LUXE',c:'#9a7a1f',t:'Luxe $65+',g:[{l:'Champagne & Sparkling',c:['Champagne','Sparkling']},{l:'White Wine',c:['White']},{l:'Red Wine',c:['Red']}]},
    {s:'CLIENT',c:'#1a5276',t:'Client $30-65',g:[{l:'Champagne & Sparkling',c:['Champagne','Sparkling']},{l:'White Wine',c:['White']},{l:'Rosé',c:['Rose']},{l:'Red Wine',c:['Red']}]},
    {s:'STAFF',c:'#1e6b40',t:'Staff <$30',g:[{l:'Sparkling',c:['Sparkling']},{l:'White Wine',c:['White']},{l:'Rosé',c:['Rose']},{l:'Red Wine',c:['Red']},{l:'Dessert Wine',c:['Dessert Wine']}]},
    {s:'NON-ALCOHOLIC',c:'#6c3483',t:'Non-Alc',g:[{l:'Non-Alc Wine',c:['Non-Alc Wine']},{l:'Non-Alc Cocktails',c:['Non-Alc Cocktail']}]},
    {s:'BEER',c:'#935116',t:null,g:[{l:null,c:['Beer']}]},
    {s:'SOFT DRINKS',c:'#154360',t:null,g:[{l:'1.25L Bottles',c:['Soft Drink'],f:function(i){return i.name.toLowerCase().includes('1.25');}},{l:'330ml Cans',c:['Soft Drink'],f:function(i){return !i.name.toLowerCase().includes('1.25');}},{l:'Water',c:['Water']}]},
    {s:'JUICES',c:'#1d6a35',t:null,g:[{l:null,c:['Juice']}]},
    {s:'SPIRITS & MIXERS',c:'#7b241c',t:null,g:[{l:'Spirits',c:['Spirit']},{l:'Mixers',c:['Mixer']}]}
  ];
  var html='';
  LAYOUT.forEach(function(sec){
    var sb='';
    sec.g.forEach(function(grp){
      var gi=items.filter(function(i){if(sec.t&&i.price_tier!==sec.t)return false;if(!grp.c.includes(i.category))return false;if(grp.f&&!grp.f(i))return false;return true;});
      if(!gi.length)return;
      if(grp.l) sb+='<div style="padding:8px 16px 4px;font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:1px;border-top:1px solid var(--bdr);background:rgba(255,255,255,.015)">— '+grp.l+' —</div>';
      var rows=gi.map(function(i){
        var s=Math.max(0,Math.round(soh(i)));
        var vt=i.vintage?'<span style="font-size:11px;color:var(--mut);margin-left:6px">'+i.vintage+'</span>':'';
        return'<tr style="border-bottom:1px solid var(--bdr)">'+
          '<td style="padding:10px 16px;font-weight:500;width:55%">'+i.name+vt+'</td>'+
          '<td style="padding:10px 16px;text-align:center;color:var(--mut);font-size:13px">'+s+'</td>'+
          '<td style="padding:10px 16px;text-align:center;background:rgba(39,174,96,.04)">'+
            '<input type="number" id="st'+i.id+'" min="0" step="1" placeholder="—" '+
            'style="width:80px;background:var(--sur);border:1.5px solid var(--bdr);color:var(--wht);border-radius:6px;padding:7px 10px;font-size:14px;font-weight:700;text-align:center;font-family:inherit" '+
            'oninput="updateStProg()">'+
          '</td>'+
        '</tr>';
      }).join('');
      sb+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">'+
        '<thead><tr style="background:var(--sur2)">'+
        '<th style="padding:9px 16px;text-align:left;font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase">Item</th>'+
        '<th style="padding:9px 16px;text-align:center;font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase">Current SOH</th>'+
        '<th style="padding:9px 16px;text-align:center;font-size:11px;color:#27ae60;font-weight:700;text-transform:uppercase;background:rgba(39,174,96,.06)">Physical Count ✏️</th>'+
        '</tr></thead><tbody>'+rows+'</tbody></table></div>';
    });
    if(!sb)return;
    html+='<div style="margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid var(--bdr)">'+
      '<div style="background:'+sec.c+';padding:12px 20px;display:flex;align-items:center;gap:12px">'+
      '<span style="font-weight:800;font-size:14px;color:#fff;letter-spacing:1.5px">'+sec.s+'</span>'+
      (sec.t?'<span style="font-size:11px;color:rgba(255,255,255,.65)">'+sec.t+'</span>':'')+
      '</div>'+sb+'</div>';
  });
  G('stbody').innerHTML=html;
  updateStProg();
}

function updateStProg(){
  var entered=items.filter(function(i){var el=document.getElementById('st'+i.id);return el&&el.value!=='';}).length;
  G('stprog').textContent=entered+' of '+items.length+' items counted';
}

async function saveStocktake(){
  var entries=[];
  items.forEach(function(i){
    var el=document.getElementById('st'+i.id);
    if(el&&el.value!==''){
      var count=parseInt(el.value);
      if(!isNaN(count)&&count>=0) entries.push({item:i,count:count});
    }
  });

  if(!entries.length){toast('No counts entered. Fill in at least one item.',true);return;}

  var confirmed=confirm('Save stocktake? This will update SOH for '+entries.length+' item(s) and record it in history.');
  if(!confirmed)return;

  var btn=G('stoverlay').querySelector('.btn.bs');
  if(btn){btn.disabled=true;btn.textContent='Saving…';}

  try{
    // Update each item — set opening_soh to physical count, zero orders_in and consumed
    for(var j=0;j<entries.length;j++){
      var e=entries[j];
      var r=await sb.from('items').update({opening_soh:e.count,orders_in:0,consumed:0}).eq('id',e.item.id);
      if(r.error) throw new Error('Failed updating '+e.item.name+': '+r.error.message);
    }

    // Save stocktake record to monthly_reports
    var now=new Date();
    var mk=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+'T'+String(now.getHours()).padStart(2,'0')+String(now.getMinutes()).padStart(2,'0');
    var lbl='Stocktake — '+now.toLocaleDateString('en-AU',{day:'2-digit',month:'short',year:'numeric'});
    await fetchItems();
    var snap={
      type:'stocktake',
      total_value:items.reduce(function(s,i){return s+Math.max(0,soh(i))*i.luc;},0),
      item_count:items.length,
      counted_items:entries.length,
      in_stock:items.filter(function(i){return soh(i)>0;}).length,
      out_of_stock:items.filter(function(i){return soh(i)<=0;}).length,
      order_count:0,event_count:0,
      items:items.map(function(i){var counted=entries.find(function(e){return e.item.id===i.id;});return{id:i.id,name:i.name,category:i.category,price_tier:i.price_tier,supplier:i._sup||i.supplier,luc:i.luc,opening_soh:i.opening_soh,orders_in:i.orders_in,consumed:i.consumed,current_soh:Math.max(0,soh(i)),soh_value:Math.max(0,soh(i))*i.luc,was_counted:!!counted,physical_count:counted?counted.count:null};})
    };
    await sb.from('monthly_reports').insert({report_month:mk,report_label:lbl,is_auto:false,generated_by:G('usel').value||'Team',snapshot:snap});

    closeStocktake();
    renderInv();
    toast('✅ Stocktake saved — '+entries.length+' items updated');
  }catch(ex){
    toast('Error: '+ex.message,true);
  }finally{
    if(btn){btn.disabled=false;btn.textContent='💾 Save Stocktake & Update Inventory';}
  }
}


async function autoReport(){
  if(new Date().getDate()===1){
    var lm=new Date(new Date().getFullYear(),new Date().getMonth()-1,1);
    var mk=lm.getFullYear()+'-'+String(lm.getMonth()+1).padStart(2,'0');
    var r=await sb.from('monthly_reports').select('*',{count:'exact',head:true}).eq('report_month',mk);
    if(!r.count) await genReport(true);
  }
}

// ── PRINT ─────────────────────────────────────────────────────
// ── CLOSE EVENT (Phase 2: enter closing counts) ───────────────
async function openCloseEvt(id){
  var r=await sb.from('events').select('*,event_lines(*,items(name,category,is_complimentary))').eq('id',id).single();
  if(r.error){toast('Not found',true);return;}
  var d=r.data, lines=d.event_lines||[];

  G('mclosetitle').textContent=d.event_name+' · '+d.event_date+(d.event_time?' '+d.event_time:'')+(d.supervisor?' · '+d.supervisor:'');

  // Build table: Item | Opening | Closing input | Consumed (live)
  var CAT_ORDER=['Champagne','Sparkling','White','Rose','Red','Dessert Wine','Non-Alc Wine','Non-Alc Cocktail','Beer','Soft Drink','Water','Juice','Spirit','Mixer'];
  lines.sort(function(a,b){
    var ai=CAT_ORDER.indexOf(a.items?a.items.category:''),bi=CAT_ORDER.indexOf(b.items?b.items.category:'');
    return(ai<0?99:ai)-(bi<0?99:bi);
  });

  var tbl=document.createElement('table');
  tbl.style.cssText='width:100%;border-collapse:collapse;font-size:13px';
  tbl.innerHTML='<thead><tr style="background:var(--sur2)">'
    +'<th style="padding:9px 14px;text-align:left;font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase">Item</th>'
    +'<th style="padding:9px 14px;text-align:center;font-size:11px;color:#5dade2;font-weight:700;text-transform:uppercase;background:rgba(41,128,185,.08)">Opening</th>'
    +'<th style="padding:9px 14px;text-align:center;font-size:11px;color:#f39c12;font-weight:700;text-transform:uppercase;background:rgba(243,156,18,.08)">Closing ✏️</th>'
    +'<th style="padding:9px 14px;text-align:center;font-size:11px;color:var(--acc);font-weight:700;text-transform:uppercase;background:rgba(233,69,96,.06)">Consumed</th>'
    +'</tr></thead>';

  var tbody=document.createElement('tbody');
  lines.forEach(function(l){
    var opening=parseFloat(l.opening_qty||l.quantity||0);
    var ic=l.items&&l.items.is_complimentary;
    var tr=document.createElement('tr');
    tr.style.cssText='border-bottom:1px solid var(--bdr)'+(ic?';background:rgba(41,128,185,.04)':'');

    // Item name
    var tdN=document.createElement('td');
    tdN.style.cssText='padding:10px 14px;font-weight:500';
    tdN.innerHTML=(l.items?l.items.name:'—')+(ic?'<div style="font-size:10px;color:#5dade2">✓ Comp</div>':'');
    tr.appendChild(tdN);

    // Opening qty
    var tdO=document.createElement('td');
    tdO.style.cssText='padding:10px 14px;text-align:center;font-weight:700;font-size:16px;color:#5dade2;background:rgba(41,128,185,.06)';
    tdO.textContent=Math.round(opening);
    tr.appendChild(tdO);

    // Closing input
    var tdC=document.createElement('td');
    tdC.style.cssText='padding:8px 14px;text-align:center;background:rgba(243,156,18,.06)';
    var inp=document.createElement('input');
    inp.type='number'; inp.min='0'; inp.max=String(opening); inp.placeholder='0';
    inp.id='cl_'+l.id;
    inp.dataset.opening=String(opening);
    inp.dataset.lineid=String(l.id);
    inp.dataset.itemid=String(l.item_id);
    inp.style.cssText='width:70px;padding:6px 8px;border:1.5px solid rgba(243,156,18,.5);border-radius:6px;text-align:center;font-size:14px;font-weight:700;background:var(--sur2);color:var(--wht);font-family:inherit';
    inp.addEventListener('input',function(){
      var op=parseFloat(this.dataset.opening)||0;
      var cl=parseFloat(this.value);
      var consumed=isNaN(cl)?op:Math.max(0,op-cl);
      var disp=document.getElementById('cd_'+this.dataset.lineid);
      if(disp){disp.textContent=Math.round(consumed);disp.style.color=consumed>0?'var(--acc)':'var(--mut)';}
    });
    tdC.appendChild(inp);
    tr.appendChild(tdC);

    // Consumed display
    var tdCon=document.createElement('td');
    tdCon.id='cd_'+l.id;
    tdCon.style.cssText='padding:10px 14px;text-align:center;font-weight:700;font-size:16px;color:var(--mut);background:rgba(233,69,96,.04)';
    tdCon.textContent=Math.round(opening); // default: assume all consumed
    tr.appendChild(tdCon);

    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);

  G('mclosebody').innerHTML='';
  G('mclosebody').appendChild(tbl);
  G('mclose').dataset.eventId=String(id);

  document.getElementById('saveclosebtn').onclick=saveCloseEvt;
  openMo('mclose');
}

async function saveCloseEvt(){
  var id=parseInt(G('mclose').dataset.eventId);
  var btn=document.getElementById('saveclosebtn');
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    var inputs=G('mclosebody').querySelectorAll('input[type="number"]');
    for(var i=0;i<inputs.length;i++){
      var inp=inputs[i];
      var lineId=parseInt(inp.dataset.lineid);
      var itemId=parseInt(inp.dataset.itemid);
      var opening=parseFloat(inp.dataset.opening)||0;
      var closing=inp.value===''?0:Math.max(0,parseFloat(inp.value)||0);
      var consumed=Math.max(0,opening-closing);

      // Update event_line with closing + consumed
      await sb.from('event_lines').update({closing_qty:closing,consumed_qty:consumed,quantity:consumed}).eq('id',lineId);

      // Correct inventory: opening qty was already deducted when event opened.
      // Now we know the real consumed; add back anything not consumed (returned stock).
      var itm=items.find(function(x){return x.id===itemId;});
      if(itm){
        // We deducted `opening` from consumed on event creation.
        // Actual consumed = consumed; difference = opening - consumed = closing (returned).
        // Correct consumed in DB: remove the over-deduction
        var prevConsumed=parseFloat(itm.consumed)||0;
        var corrected=Math.max(0,prevConsumed-(opening-consumed)); // remove the returned portion
        await sb.from('items').update({consumed:corrected}).eq('id',itemId);
      }
    }
    // Mark event as closed
    await sb.from('events').update({status:'closed'}).eq('id',id);
    await fetchItems();
    closeMo('mclose');
    loadHist();
    toast('✅ Event closed — consumption recorded');
    // Switch to Past Events tab
    setTimeout(function(){
      var pastTab=document.querySelector('.tb[data-t="ch"]');
      if(pastTab) pastTab.click();
    },200);
  }catch(ex){toast('Error: '+ex.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent='💾 Save & Close Event';}}
}

function pw(title,body){
  var w=window.open('','_blank','width=900,height=700');
  var css='body{font-family:Calibri,Arial,sans-serif;font-size:12px;color:#111;margin:20px 32px}h2{font-size:14px;color:#444;margin:16px 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px}th{background:#1a1d2e;color:#fff;padding:7px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase}td{padding:6px 10px;border-bottom:1px solid #e5e5e5}tr:nth-child(even) td{background:#f8f8f8}.hdr{display:flex;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #1a1d2e}.sb{background:#f0f3f4;border:1px solid #ddd;border-radius:6px;padding:12px 16px;margin-bottom:16px;display:flex;gap:24px;flex-wrap:wrap}.si strong{display:block;font-size:16px}.sh{background:#1a1d2e;color:#fff;padding:6px 10px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:12px}.ok{color:#27ae60;font-weight:700}.lo{color:#f39c12;font-weight:700}.ou{color:#e94560;font-weight:700}@media print{body{margin:10px 16px}}';
  var hdr='<div class="hdr"><div><b style="font-size:18px">PwC Sydney Beverage Portal</b><div style="margin-top:2px">'+title+'</div></div><div style="text-align:right;color:#666;font-size:11px">'+new Date().toLocaleString('en-AU')+'</div></div>';
  w.document.open();
  w.document.write('<!DOCTYPE html><html><head><title>'+title+'</title><style>'+css+'</style></head><body>'+hdr+body+'</body></html>');
  w.document.close();
}

function printInv(){
  var LAYOUT=[{l:'LUXE',t:'Luxe $65+',c:['Champagne','Sparkling','White','Red']},{l:'CLIENT',t:'Client $30-65',c:['Champagne','Sparkling','White','Rose','Red']},{l:'STAFF',t:'Staff <$30',c:['Sparkling','White','Rose','Red','Dessert Wine']},{l:'NON-ALCOHOLIC',t:'Non-Alc',c:['Non-Alc Wine','Non-Alc Cocktail']},{l:'BEER',t:null,c:['Beer']},{l:'SOFT DRINKS',t:null,c:['Soft Drink','Water']},{l:'JUICES',t:null,c:['Juice']},{l:'SPIRITS & MIXERS',t:null,c:['Spirit','Mixer']}];
  var tv=items.reduce(function(s,i){return s+Math.max(0,soh(i))*i.luc;},0);
  var html='<div class="sb"><div class="si"><strong>'+fmt(tv)+'</strong>Portfolio Value</div><div class="si"><strong>'+items.length+'</strong>Total Items</div><div class="si"><strong class="ok">'+items.filter(function(i){return soh(i)>0;}).length+'</strong>In Stock</div><div class="si"><strong class="ou">'+items.filter(function(i){return soh(i)<=0;}).length+'</strong>Out of Stock</div></div>';
  LAYOUT.forEach(function(sec){
    var si=items.filter(function(i){if(sec.t&&i.price_tier!==sec.t)return false;return sec.c.includes(i.category);});
    if(!si.length)return;
    html+='<div class="sh">'+sec.l+(sec.t?' — '+sec.t:'')+'</div><table><thead><tr><th>Item</th><th>Vintage</th><th>Supplier</th><th>Opening</th><th>Ordered</th><th>Consumed</th><th>SOH</th><th>Status</th></tr></thead><tbody>';
    si.forEach(function(i){var s=Math.max(0,soh(i)),cl=s<=0?'ou':s<=3?'lo':'ok';html+='<tr><td>'+i.name+'</td><td>'+(i.vintage||'')+'</td><td>'+(i._sup||'')+'</td><td>'+Math.round(i.opening_soh||0)+'</td><td>'+Math.round(i.orders_in||0)+'</td><td>'+Math.round(i.consumed||0)+'</td><td><strong>'+Math.round(s)+'</strong></td><td class="'+cl+'">'+(s<=0?'OUT':s<=3?'LOW':'OK')+'</td></tr>';});
    html+='</tbody></table>';
  });
  pw('Inventory — '+new Date().toLocaleDateString('en-AU'),html);
}

async function printOrd(id){
  var r=await sb.from('orders').select('*,order_lines(*,items(name,category))').eq('id',id).single();
  if(r.error){toast('Not found',true);return;}
  var o=r.data,tot=(o.order_lines||[]).reduce(function(s,l){return s+(l.quantity||0)*(l.unit_cost||0);},0);
  var grp={};
  (o.order_lines||[]).forEach(function(l){var c=l.items?l.items.category:'Other';if(!grp[c])grp[c]=[];grp[c].push(l);});
  var html='<div class="sb"><div class="si"><strong>'+o.order_date+'</strong>Date</div><div class="si"><strong>'+(o.ordered_by||'—')+'</strong>Ordered By</div><div class="si"><strong>'+((o.order_lines||[]).length)+'</strong>Items</div><div class="si"><strong>'+fmt(tot)+'</strong>Total</div></div>'+(o.notes?'<p style="margin-bottom:12px"><b>Note:</b> '+o.notes+'</p>':'');
  Object.keys(grp).forEach(function(cat){html+='<h2>'+cat+'</h2><table><thead><tr><th>Item</th><th>Units</th><th>Unit Cost</th><th>Total</th></tr></thead><tbody>';grp[cat].forEach(function(l){html+='<tr><td>'+(l.items?l.items.name:'—')+'</td><td>'+l.quantity+'</td><td>'+fmt(l.unit_cost)+'</td><td>'+fmt((l.quantity||0)*(l.unit_cost||0))+'</td></tr>';});html+='</tbody></table>';});
  html+='<table><tr style="background:#1a1d2e"><td colspan="3" style="padding:10px;color:#fff;font-weight:700;text-align:right">ORDER TOTAL</td><td style="padding:10px;color:#27ae60;font-weight:900;text-align:right">'+fmt(tot)+'</td></tr></table>';
  pw('Order — '+o.order_date+' — '+(o.ordered_by||''),html);
}

async function printCon(id){
  var r=await sb.from('events').select('*,event_lines(*,items(name,category,is_complimentary))').eq('id',id).single();
  if(r.error){toast('Not found',true);return;}
  var e=r.data;
  var isClosed=e.status==='closed';

  var CAT_ORDER=['Champagne','Sparkling','White','Rose','Red','Dessert Wine','Non-Alc Wine','Non-Alc Cocktail','Beer','Soft Drink','Water','Juice','Spirit','Mixer'];
  var CAT_LABEL={'Champagne':'Champagne & Sparkling','Sparkling':'Champagne & Sparkling','White':'White Wine','Rose':'Rosé Wine','Red':'Red Wine','Dessert Wine':'Dessert Wine','Non-Alc Wine':'Non-Alc Wine','Non-Alc Cocktail':'Non-Alc Cocktail','Beer':'Beer','Soft Drink':'Soft Drinks','Water':'Water','Juice':'Juices','Spirit':'Spirits','Mixer':'Mixers'};

  var grouped={};
  (e.event_lines||[]).forEach(function(l){
    var cat=l.items?l.items.category:'Other';
    if(!grouped[cat]) grouped[cat]=[];
    grouped[cat].push(l);
  });

  var css='*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:16px 24px}.title{text-align:center;font-size:16px;font-weight:700;margin-bottom:4px}.subtitle{text-align:center;font-size:11px;color:#666;margin-bottom:14px}.info{width:100%;border-collapse:collapse;margin-bottom:16px}.info td{border:1px solid #aaa;padding:6px 10px}.info .lbl{width:110px;font-weight:600;background:#f0f0f0}.items{width:100%;border-collapse:collapse;font-size:12px}.items th{border:1px solid #aaa;padding:7px 10px;background:#1a1d2e;color:#fff;font-weight:700;text-align:center;font-size:11px;text-transform:uppercase}.items th.left{text-align:left}.items td{border:1px solid #ccc;padding:7px 10px}.items .cat{background:#e8e8e8;font-weight:700;font-size:11px;text-transform:uppercase;padding:5px 10px;border:1px solid #ccc}.items .num{text-align:center;font-weight:700}.op{color:#1a5276}.cl{color:#7d6608}.con{color:#c0392b}.comp{color:#2980b9;font-style:italic;font-size:10px}@media print{body{margin:8px 14px}}';

  var totalOpen=0,totalClose=0,totalCon=0;
  (e.event_lines||[]).forEach(function(l){
    totalOpen+=parseFloat(l.opening_qty||l.quantity||0);
    totalClose+=parseFloat(l.closing_qty||0);
    totalCon+=parseFloat(l.consumed_qty||l.quantity||0);
  });

  var html='<div class="title">Beverage Consumption Sheet</div>'
    +'<div class="subtitle">'+(isClosed?'Final Report':'Opening Count Only — Awaiting Closing')+'</div>'
    +'<table class="info">'
    +'<tr><td class="lbl">Function Name</td><td colspan="3" style="font-weight:700;font-size:13px">'+(e.event_name||'')+'</td></tr>'
    +'<tr><td class="lbl">Booking ID</td><td>'+(e.booking_id||'')+'</td><td class="lbl">Package Type</td><td>'+(e.event_type||'')+'</td></tr>'
    +'<tr><td class="lbl">Date | Time</td><td>'+(e.event_date||'')+' | '+(e.event_time||'')+'</td><td class="lbl">Pax</td><td>'+(e.pax||'')+'</td></tr>'
    +'<tr><td class="lbl">Room</td><td>'+(e.room||'')+'</td><td class="lbl">Supervisor</td><td>'+(e.supervisor||'')+'</td></tr>'
    +'</table>'
    +'<table class="items"><thead><tr>'
    +'<th class="left" style="width:38%">Product</th>'
    +'<th class="op" style="width:16%">Opening</th>'
    +(isClosed?'<th class="cl" style="width:16%">Closing</th><th class="con" style="width:16%">Consumed</th>':'<th style="width:16%">Closing</th><th style="width:16%">Consumed</th>')
    +'</tr></thead><tbody>';

  var printed={};
  CAT_ORDER.forEach(function(cat){
    var lines=grouped[cat];
    if(!lines||!lines.length) return;
    var label=CAT_LABEL[cat]||cat;
    if(!printed[label]){
      printed[label]=true;
      var colspan=4;
      html+='<tr><td colspan="'+colspan+'" class="cat">'+label+'</td></tr>';
    }
    lines.forEach(function(l){
      var op=Math.round(parseFloat(l.opening_qty||l.quantity||0));
      var cl=l.closing_qty!=null?Math.round(parseFloat(l.closing_qty)):'';
      var con=l.consumed_qty!=null?Math.round(parseFloat(l.consumed_qty)):(isClosed?op:'');
      var ic=l.items&&l.items.is_complimentary;
      html+='<tr>'
        +'<td>'+(l.items?l.items.name:'—')+(ic?' <span class="comp">(Comp)</span>':'')+'</td>'
        +'<td class="num op">'+(op>0?op:'')+'</td>'
        +'<td class="num cl">'+(cl!==''?cl:'')+'</td>'
        +'<td class="num con">'+(con!==''?con:'')+'</td>'
        +'</tr>';
    });
  });

  html+='</tbody>'
    +'<tfoot><tr style="background:#f0f0f0;font-weight:700">'
    +'<td style="padding:8px 10px">TOTAL</td>'
    +'<td class="num op">'+Math.round(totalOpen)+'</td>'
    +(isClosed?'<td class="num cl">'+Math.round(totalClose)+'</td><td class="num con">'+Math.round(totalCon)+'</td>':'<td class="num"></td><td class="num"></td>')
    +'</tr></tfoot>'
    +'</table>'
    +(isClosed?'':'<p style="margin-top:16px;font-size:11px;color:#999;text-align:center">Closing counts not yet recorded. Print after closing the event for the full report.</p>');

  var w=window.open('','_blank','width=860,height=900');
  w.document.open();
  w.document.write('<!DOCTYPE html><html><head><title>Consumption Sheet — '+e.event_name+'</title><style>'+css+'</style></head><body>'+html+'</body></html>');
  w.document.close();
  setTimeout(function(){w.print();},400);
}

async function printRep(mk){
  var r=await sb.from('monthly_reports').select('*').eq('report_month',mk).single();
  if(r.error){toast('Not found',true);return;}
  var rep=r.data,sn=rep.snapshot||{},si=sn.items||[];
  var html='<div class="sb"><div class="si"><strong>'+(sn.total_value?fmt(sn.total_value):'—')+'</strong>Portfolio Value</div><div class="si"><strong>'+(sn.item_count||0)+'</strong>Items</div><div class="si"><strong class="ok">'+(sn.in_stock||0)+'</strong>In Stock</div><div class="si"><strong class="ou">'+(sn.out_of_stock||0)+'</strong>Out</div><div class="si"><strong>'+(sn.order_count||0)+'</strong>Orders</div><div class="si"><strong>'+(sn.event_count||0)+'</strong>Events</div></div><table><thead><tr><th>Item</th><th>Category</th><th>Tier</th><th>Supplier</th><th>Opening</th><th>Ordered</th><th>Consumed</th><th>Closing SOH</th><th>Status</th></tr></thead><tbody>';
  si.forEach(function(i){var cl=i.current_soh<=0?'ou':i.current_soh<=3?'lo':'ok';html+='<tr><td>'+i.name+'</td><td>'+i.category+'</td><td>'+i.price_tier+'</td><td>'+(i.supplier||'—')+'</td><td>'+Math.round(i.opening_soh||0)+'</td><td>'+Math.round(i.orders_in||0)+'</td><td>'+Math.round(i.consumed||0)+'</td><td><strong>'+Math.round(i.current_soh||0)+'</strong></td><td class="'+cl+'">'+(i.current_soh<=0?'OUT':i.current_soh<=3?'LOW':'OK')+'</td></tr>';});
  html+='</tbody></table>';
  pw('Stocktake Report — '+(rep.report_label||mk),html);
}

// ── EXCEL ─────────────────────────────────────────────────────
function exportInvXL(){
  if(typeof XLSX==='undefined'){toast('Excel loading, try again',true);return;}
  var d=[['Item','Category','Price Tier','Supplier','Vintage','Opening','Ordered','Consumed','SOH','Status']];
  items.forEach(function(i){var s=Math.max(0,soh(i));d.push([i.name,i.category,i.price_tier,i._sup||i.supplier||'',i.vintage||'',Math.round(i.opening_soh||0),Math.round(i.orders_in||0),Math.round(i.consumed||0),Math.round(s),s<=0?'OUT':s<=3?'LOW':'OK']);});
  var wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(d);
  ws['!cols']=[{wch:40},{wch:16},{wch:16},{wch:18},{wch:8},{wch:10},{wch:10},{wch:10},{wch:8},{wch:8}];
  XLSX.utils.book_append_sheet(wb,ws,'Inventory');
  XLSX.writeFile(wb,'PwC_Inventory_'+new Date().toISOString().split('T')[0]+'.xlsx');
  toast('📊 Exported to Excel');
}

async function exportRepXL(mk){
  if(typeof XLSX==='undefined'){toast('Excel loading, try again',true);return;}
  var r=await sb.from('monthly_reports').select('*').eq('report_month',mk).single();
  if(r.error){toast('Not found',true);return;}
  var rep=r.data, sn=rep.snapshot||{}, si=sn.items||[];

  var LAYOUT=[
    {s:'LUXE',t:'Luxe $65+',col:'FF9A7A1F',groups:[
      {l:'Champagne & Sparkling',c:['Champagne','Sparkling']},
      {l:'White Wine',c:['White']},
      {l:'Red Wine',c:['Red']}
    ]},
    {s:'CLIENT',t:'Client $30-65',col:'FF1A5276',groups:[
      {l:'Champagne & Sparkling',c:['Champagne','Sparkling']},
      {l:'White Wine',c:['White']},
      {l:'Rose',c:['Rose']},
      {l:'Red Wine',c:['Red']}
    ]},
    {s:'STAFF',t:'Staff <$30',col:'FF1E6B40',groups:[
      {l:'Sparkling',c:['Sparkling']},
      {l:'White Wine',c:['White']},
      {l:'Rose',c:['Rose']},
      {l:'Red Wine',c:['Red']},
      {l:'Dessert Wine',c:['Dessert Wine']}
    ]},
    {s:'NON-ALCOHOLIC',t:'Non-Alc',col:'FF6C3483',groups:[
      {l:'Non-Alc Wine',c:['Non-Alc Wine']},
      {l:'Non-Alc Cocktails',c:['Non-Alc Cocktail']}
    ]},
    {s:'BEER',t:null,col:'FF935116',groups:[{l:null,c:['Beer']}]},
    {s:'SOFT DRINKS & WATER',t:null,col:'FF154360',groups:[
      {l:'1.25L Bottles',c:['Soft Drink'],f:function(i){return i.name.toLowerCase().includes('1.25');}},
      {l:'330ml Cans',c:['Soft Drink'],f:function(i){return !i.name.toLowerCase().includes('1.25');}},
      {l:'Water',c:['Water']}
    ]},
    {s:'JUICES',t:null,col:'FF1D6A35',groups:[{l:null,c:['Juice']}]},
    {s:'SPIRITS & MIXERS',t:null,col:'FF7B241C',groups:[
      {l:'Spirits',c:['Spirit']},
      {l:'Mixers',c:['Mixer']}
    ]}
  ];

  var wb=XLSX.utils.book_new();
  var rows=[];
  var merges=[];
  var rowStyles=[];  // track what style each row needs

  // Title rows
  rows.push(['PwC Sydney Beverage Portal — Stocktake Report']);
  rowStyles.push('title');
  rows.push([rep.report_label||mk, '', '', '', '', '', '', '', '']);
  rowStyles.push('subtitle');
  rows.push(['Generated: '+new Date(rep.generated_at).toLocaleString('en-AU'), '', '', '', 'Items: '+si.length, '', 'In Stock: '+si.filter(function(i){return i.current_soh>0;}).length, 'Out: '+si.filter(function(i){return i.current_soh<=0;}).length, '']);
  rowStyles.push('meta');
  rows.push([]);
  rowStyles.push('blank');

  // Column headers
  rows.push(['Item','Vintage','Supplier','Opening','Ordered','Consumed','Closing SOH','Status','']);
  rowStyles.push('header');

  LAYOUT.forEach(function(sec){
    var secHasContent=false;
    var secStartRow=rows.length;
    var secRowData=[];

    sec.groups.forEach(function(grp){
      var gi=si.filter(function(i){
        if(sec.t && i.price_tier!==sec.t) return false;
        if(!grp.c.includes(i.category)) return false;
        if(grp.f && !grp.f(i)) return false;
        return true;
      });
      if(!gi.length) return;
      secHasContent=true;

      if(grp.l){
        secRowData.push({type:'grp', data:[grp.l,'','','','','','','',''], col:sec.col});
      }
      gi.forEach(function(i){
        var s=Math.round(i.current_soh||0);
        secRowData.push({type:'item', data:[
          i.name,
          i.vintage||'',
          i.supplier||'',
          Math.round(i.opening_soh||0),
          Math.round(i.orders_in||0),
          Math.round(i.consumed||0),
          s,
          s<=0?'OUT':s<=3?'LOW':'OK',
          ''
        ], status: s<=0?'out':s<=3?'low':'ok'});
      });
    });

    if(!secHasContent) return;

    // Section header row
    rows.push([sec.s+(sec.t?' — '+sec.t:''),'','','','','','','','']);
    rowStyles.push({type:'sec', col:sec.col});

    secRowData.forEach(function(rd){
      rows.push(rd.data);
      rowStyles.push(rd.type==='grp'?'grp':{type:'item', status:rd.status});
    });
    rows.push([]);
    rowStyles.push('blank');
  });

  var ws=XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols']=[{wch:42},{wch:10},{wch:18},{wch:10},{wch:10},{wch:10},{wch:12},{wch:8},{wch:4}];

  // Apply styles
  var range=XLSX.utils.decode_range(ws['!ref']||'A1:I1');
  var COLS=['A','B','C','D','E','F','G','H','I'];

  rows.forEach(function(row, ri){
    var style=rowStyles[ri];
    var isObj=typeof style==='object';
    var styleType=isObj?style.type:style;

    COLS.forEach(function(col, ci){
      var cell_ref=col+(ri+1);
      if(!ws[cell_ref]) ws[cell_ref]={t:'z',v:''};
      var c=ws[cell_ref];

      if(styleType==='title'){
        c.s={font:{bold:true,sz:16,color:{rgb:'1A1D2E'}},alignment:{horizontal:'left'}};
      } else if(styleType==='subtitle'){
        c.s={font:{bold:true,sz:12,color:{rgb:'444444'}}};
      } else if(styleType==='header'){
        c.s={font:{bold:true,sz:10,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'1A1D2E'}},alignment:{horizontal:'center'},border:{bottom:{style:'medium',color:{rgb:'000000'}}}};
        if(ci===0) c.s.alignment={horizontal:'left'};
      } else if(styleType==='sec'){
        c.s={font:{bold:true,sz:11,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:(isObj?style.col:'FF1A1D2E').replace('FF','')}}};
      } else if(styleType==='grp'){
        c.s={font:{bold:true,sz:10,color:{rgb:'333333'}},fill:{fgColor:{rgb:'E8E8E8'}}};
      } else if(styleType==='meta'){
        c.s={font:{sz:9,color:{rgb:'666666'}}};
      } else if(isObj && styleType==='item'){
        var fillColor=ci%2===0?'FFFFFF':'FAFAFA';
        var fontColor='111111';
        if(ci===7){ // Status column
          if(style.status==='out') fontColor='C0392B';
          else if(style.status==='low') fontColor='F39C12';
          else fontColor='27AE60';
        }
        if(ci===6 && style.status!=='ok'){ // SOH column when low/out
          fontColor=style.status==='out'?'C0392B':'F39C12';
        }
        c.s={font:{sz:10,color:{rgb:fontColor},bold:(ci===6)},fill:{fgColor:{rgb:fillColor}},alignment:{horizontal:ci>2?'center':'left'}};
      }
    });
  });

  // Merge title rows across columns
  if(!ws['!merges']) ws['!merges']=[];
  ws['!merges'].push({s:{r:0,c:0},e:{r:0,c:7}}); // Title
  ws['!merges'].push({s:{r:1,c:0},e:{r:1,c:3}}); // Subtitle

  XLSX.utils.book_append_sheet(wb,ws,rep.report_label||mk);
  XLSX.writeFile(wb,'PwC_Stocktake_'+mk+'.xlsx');
  toast('✅ Excel exported');
}




// ── EDIT IN HISTORY ───────────────────────────────────────────
async function editOrd(id){
  var r=await sb.from('orders').select('*,order_lines(*,items(name,category))').eq('id',id).single();
  if(r.error){toast('Not found',true);return;}
  var d=r.data;

  var wrap=document.createElement('div');

  var info=document.createElement('div');
  info.style.cssText='margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--bdr)';
  info.innerHTML='<b style="color:var(--wht)">'+d.order_date+'</b> · '+(d.ordered_by||'—');
  wrap.appendChild(info);

  var tbl=document.createElement('table');
  tbl.style.cssText='width:100%;border-collapse:collapse;font-size:13px';
  tbl.innerHTML='<thead><tr style="background:var(--sur2)">'
    +'<th style="padding:9px 14px;text-align:left;font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase">Item</th>'
    +'<th style="padding:9px 14px;text-align:center;font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase">Current Qty</th>'
    +'<th style="padding:9px 14px;text-align:center;font-size:11px;color:#f39c12;font-weight:700;text-transform:uppercase">Update To</th>'
    +'</tr></thead>';

  var tbody=document.createElement('tbody');
  (d.order_lines||[]).forEach(function(l){
    var tr=document.createElement('tr');
    tr.style.borderBottom='1px solid var(--bdr)';

    var tdN=document.createElement('td');
    tdN.style.cssText='padding:10px 14px;font-weight:500';
    tdN.textContent=l.items?l.items.name:'—';
    tr.appendChild(tdN);

    var tdQ=document.createElement('td');
    tdQ.style.cssText='padding:10px 14px;text-align:center;color:var(--mut)';
    tdQ.textContent=l.quantity+' units';
    tr.appendChild(tdQ);

    var tdI=document.createElement('td');
    tdI.style.cssText='padding:8px 14px;text-align:center';
    var inp=document.createElement('input');
    inp.type='number'; inp.min='0'; inp.value=l.quantity;
    inp.id='oq_'+l.id;
    inp.style.cssText='width:70px;padding:6px 8px;border:1.5px solid rgba(243,156,18,.5);border-radius:6px;text-align:center;font-size:14px;font-weight:700;background:var(--sur2);color:var(--wht);font-family:inherit';
    tdI.appendChild(inp);
    tr.appendChild(tdI);

    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  wrap.appendChild(tbl);

  G('mordb').innerHTML='';
  G('mordb').appendChild(wrap);

  G('mordm').dataset.editLines=JSON.stringify((d.order_lines||[]).map(function(l){
    return{id:l.id,item_id:l.item_id,quantity:l.quantity};
  }));

  G('mordmf').innerHTML='<button class="btn bo" onclick="closeMo(\'mordm\')">Cancel</button>'
    +'<button class="btn bs" id="saveordbtn">Save Changes</button>';
  document.getElementById('saveordbtn').addEventListener('click', saveOrdEdit);

  openMo('mordm');
}

async function saveOrdEdit(){
  var btn=G('saveordbtn');
  var lines=JSON.parse(G('mordm').dataset.editLines||'[]');
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    for(var i=0;i<lines.length;i++){
      var l=lines[i];
      var inp=document.getElementById('oq_'+l.id);
      if(!inp)continue;
      var newQty=Math.max(0,parseInt(inp.value)||0);
      var diff=newQty-l.quantity;
      await sb.from('order_lines').update({quantity:newQty}).eq('id',l.id);
      if(diff!==0){
        var itm=items.find(function(x){return x.id===l.item_id;});
        if(itm){
          var newO=Math.max(0,(parseFloat(itm.orders_in)||0)+diff);
          await sb.from('items').update({orders_in:newO}).eq('id',l.item_id);
        }
      }
    }
    await fetchItems();
    closeMo('mordm');
    loadHist();
    toast('✅ Order updated');
  }catch(ex){toast('Error: '+ex.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent='💾 Save Changes';}}
}

// ── STEPPER ENHANCEMENT ───────────────────────────────────────
// Auto-wraps every number input with − / + buttons
(function(){
  var CSS='.stepper{display:inline-flex;align-items:center;gap:6px;justify-content:center}.stepper-btn{background:var(--sur2);border:1px solid var(--bdr);border-radius:6px;width:28px;height:28px;color:var(--wht);font-size:16px;font-weight:700;cursor:pointer;line-height:1;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;transition:background .12s,border-color .12s}.stepper-btn:hover{background:var(--bdr);border-color:var(--acc)}.stepper-btn:active{transform:scale(.94)}';
  var s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
  function bump(inp,d){var step=parseFloat(inp.step)||1,min=inp.min!==''?parseFloat(inp.min):-Infinity,max=inp.max!==''?parseFloat(inp.max):Infinity,cur=parseFloat(inp.value)||0,next=Math.min(max,Math.max(min,cur+d*step));inp.value=(step%1===0)?String(Math.round(next)):String(next);inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));}
  function isStepBtn(el){if(!el||el.tagName!=='BUTTON')return false;var t=(el.textContent||'').trim();return t==='−'||t==='-'||t==='+';}
  function wrap(inp){
    if(inp.dataset.stepperized)return;
    if(inp.closest('.stepper')){inp.dataset.stepperized='1';return;}
    var prev=inp.previousElementSibling,next=inp.nextElementSibling;
    if(isStepBtn(prev)&&isStepBtn(next)){inp.dataset.stepperized='1';return;}
    inp.dataset.stepperized='1';
    var w=document.createElement('span');w.className='stepper';
    var minus=document.createElement('button');minus.type='button';minus.className='stepper-btn';minus.textContent='−';minus.tabIndex=-1;
    var plus=document.createElement('button');plus.type='button';plus.className='stepper-btn';plus.textContent='+';plus.tabIndex=-1;
    minus.addEventListener('click',function(e){e.preventDefault();bump(inp,-1);});
    plus.addEventListener('click',function(e){e.preventDefault();bump(inp,+1);});
    var p=inp.parentNode;p.insertBefore(w,inp);w.appendChild(minus);w.appendChild(inp);w.appendChild(plus);
  }
  function scan(){document.querySelectorAll('input[type="number"]').forEach(wrap);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var m=muts[i];for(var j=0;j<m.addedNodes.length;j++){var n=m.addedNodes[j];if(n.nodeType!==1)continue;if(n.matches&&n.matches('input[type="number"]'))wrap(n);if(n.querySelectorAll)n.querySelectorAll('input[type="number"]').forEach(wrap);}}}).observe(document.body,{childList:true,subtree:true});
})();
