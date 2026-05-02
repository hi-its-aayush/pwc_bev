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

async function startApp(){
  loadSettings();
  await seedItems();
  loadDash();
  autoReport();
}

// ── SEEDING ───────────────────────────────────────────────────
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
// ── INVENTORY LAYOUT CONFIG ──────────────────────────────────
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
// ── INVENTORY ─────────────────────────────────────────────────
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
  var si=sortByPopularity(items.filter(function(i){return i._sup===activeSup;}));
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
      return '<tr style="border-bottom:1px solid var(--bdr)">'
        +'<td style="padding:10px 14px;font-weight:500">'+i.name+vt+'</td>'
        +'<td style="padding:10px 14px;text-align:center;font-weight:700;color:'+sc+'">'+Math.max(0,Math.round(s))+'</td>'
        +'<td style="padding:10px 14px;font-size:11px;color:var(--mut);text-align:center">'+cs.l+'</td>'
        +'<td style="padding:8px 14px;text-align:center;background:rgba(243,156,18,.04)">'
        +'<div style="display:flex;align-items:center;gap:5px;justify-content:center">'
        +'<button type="button" onclick="adjOQ('+i.id+',-1)" style="background:var(--sur2);border:1px solid var(--bdr);border-radius:6px;width:28px;height:28px;color:var(--wht);font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1">&#8722;</button>'
        +'<input type="number" id="qo'+i.id+'" min="0" step="1" placeholder="0" style="width:54px;background:var(--sur);border:1.5px solid var(--bdr);color:var(--wht);border-radius:6px;padding:5px 6px;font-size:14px;font-weight:700;text-align:center;font-family:inherit" oninput="updateOTotal()">'
        +'<button type="button" onclick="adjOQ('+i.id+',1)" style="background:var(--sur2);border:1px solid var(--bdr);border-radius:6px;width:28px;height:28px;color:var(--wht);font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1">+</button>'
        +'</div></td></tr>';
    }).join('');
    return '<div style="margin-bottom:16px;border-radius:10px;overflow:hidden;border:1px solid var(--bdr)">'
      +'<div style="background:var(--sur2);padding:9px 16px;font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:1.2px;display:flex;align-items:center;justify-content:space-between">'
      +'<span>'+g+'</span><span style="font-weight:400">'+gi.length+' items</span></div>'
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
function updateOTotal(){ items.forEach(function(i){ var el=document.getElementById('qo'+i.id); if(el && parseFloat(el.value)>0) el.style.borderColor='#f39c12'; }); }

G('subord').addEventListener('click', function(){
  var date=G('odate').value,by=G('oby').value.trim();
  if(!date||!by){toast('Please enter order date and your name',true);return;}
  var lines=[];
  items.forEach(function(i){var el=document.getElementById('qo'+i.id);if(!el)return;var c=parseFloat(el.value)||0;if(c>0)lines.push({item:i,cartons:c,units:c*ctn(i).q});});
  if(!lines.length){toast('No quantities entered',true);return;}
  pending={date:date,by:by,lines:lines,sup:activeSup};
  showEmailPreview();
  openMo('memail');
});

function showEmailPreview(){
  var sup=SUPS.find(function(s){return s.k===pending.sup;})||{ct:pending.sup,em:''};
  var grouped={};
  pending.lines.forEach(function(l){var c=l.item.category;if(!grouped[c])grouped[c]=[];grouped[c].push(l);});
  var body='Hi '+sup.ct+',\n\nCan we please have the following delivered to us next week:\n\n';
  Object.keys(grouped).forEach(function(cat){
    body+=cat+':\n';
    grouped[cat].forEach(function(l){body+='  '+l.cartons+' x carton(s) — '+l.item.name+' ('+l.units+' units)\n';});
    body+='\n';
  });
  body+='Many thanks,\n'+pending.by+'\nPwC Sydney';
  G('metitle').textContent='📧 Order Email — '+pending.sup;
  G('mebody').innerHTML='<p style="color:var(--mut);font-size:12px;margin-bottom:14px">Copy this email and paste into Outlook. Then click <strong>Confirm</strong>.</p><div style="background:var(--bg);border:1px solid var(--bdr);border-radius:8px;padding:16px 20px;font-size:13px;line-height:1.9;white-space:pre-wrap;color:var(--txt);max-height:360px;overflow-y:auto" id="eprev">'+body+'</div>';
  G('mefooter').innerHTML='<button class="btn bo" onclick="copyEmail()">📋 Copy Email</button><button class="btn bo" onclick="closeMo(\'memail\')">Cancel</button><button class="btn bs" onclick="confirmOrder()">✅ Confirm & Update Inventory</button>';
}

function copyEmail(){
  var text=G('eprev').textContent;
  navigator.clipboard.writeText(text).then(function(){toast('📋 Copied! Paste into Outlook.');});
}

async function confirmOrder(){
  if(!pending)return;
  try{
    var r1=await sb.from('orders').insert({order_date:pending.date,ordered_by:pending.by,status:'submitted'}).select().single();
    if(r1.error) throw r1.error;
    await sb.from('order_lines').insert(pending.lines.map(function(l){return{order_id:r1.data.id,item_id:l.item.id,quantity:l.units,unit_cost:l.item.luc};}));
    for(var j=0;j<pending.lines.length;j++){var l=pending.lines[j];await sb.from('items').update({orders_in:(parseFloat(l.item.orders_in)||0)+l.units}).eq('id',l.item.id);}
    await fetchItems(); loadOrders();
    G('metitle').textContent='✅ Order Saved!';
    G('mebody').innerHTML='<div style="text-align:center;padding:24px 0"><div style="font-size:40px">✅</div><div style="font-weight:700;margin-top:12px">Order confirmed & inventory updated</div></div>';
    G('mefooter').innerHTML='<button class="btn bs" onclick="closeMo(\'memail\')">Done</button>';
  }catch(ex){toast(ex.message,true);}
}

// ── CONSUMPTION (UNIFIED RENDER) ──────────────────────────────
var CCATS=[
  ['🍾 Champagne & Sparkling',['Champagne','Sparkling']],['🥂 White Wine',['White']],['🌹 Rosé',['Rose']],
  ['🍷 Red Wine',['Red']],['🍸 Non-Alc',['Non-Alc Wine','Non-Alc Cocktail','Dessert Wine']],
  ['🍺 Beer',['Beer']],['🥤 Soft Drinks',['Soft Drink','Water']],['🧃 Juices',['Juice']],['🥃 Spirits & Mixers',['Spirit','Mixer']]
];

function loadCon() { G('edate').value=td(); conCounts={}; showCS1(); }
function showCS1() { G('cs1').style.display='block'; G('cs2').style.display='none'; renderShorts(); }

function renderShorts(){
  G('cshorts').innerHTML=CCATS.map(function(c,i){return'<button onclick="jumpCat('+i+')" style="background:var(--sur);border:1px solid var(--bdr);border-radius:20px;padding:6px 14px;color:var(--txt);font-size:12px;cursor:pointer;font-family:inherit;transition:all .15s" onmouseover="this.style.borderColor=\'var(--acc)\'" onmouseout="this.style.borderColor=\'var(--bdr)\'">'+c[0]+'</button>';}).join('');
}

function valEvt(){ if(!G('ename').value.trim()||!G('edate').value){toast('Please fill in Function Name and Date',true);return false;}return true; }

G('cnext').addEventListener('click',function(){if(!valEvt())return;goCS2();});
function jumpCat(idx){if(!valEvt())return;goCS2(); setTimeout(() => { G('csec_'+idx).scrollIntoView({behavior:'smooth',block:'center'}); }, 100); }

function goCS2(){
  G('cs1').style.display='none'; G('cs2').style.display='block';
  G('cbadget').textContent=G('ename').value;
  var pts=[G('edate').value,G('etime').value,G('eroom').value,G('epax').value?G('epax').value+' pax':'',G('etype').value,G('esup').value];
  G('cbadgem').textContent=pts.filter(Boolean).join(' · ');
  renderCJumpBar(); 
  renderAllConsumptionItems(); 
}

function renderCJumpBar() {
  G('ctabs').innerHTML = CCATS.map(function(cat, i) {
    return '<button onclick="document.getElementById(\'csec_'+i+'\').scrollIntoView({behavior:\'smooth\',block:\'center\'})" style="padding:7px 14px;border-radius:20px;border:1.5px solid var(--bdr);background:var(--sur);color:var(--mut);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .15s">' + cat[0] + '</button>';
  }).join('');
}

function renderAllConsumptionItems() {
  var html = CCATS.map(function(cd, catIdx) {
    var catLabel = cd[0], cats = cd[1];
    var ci = sortByPopularity(items.filter(function(i) { return cats.includes(i.category); }));
    if (ci.length === 0) return '';

    var rows = ci.map(function(i) {
      var s=soh(i), sc=s<=0?'var(--acc)':s<=3?'#f39c12':'var(--wht)', ic=i.is_complimentary;
      var vt=i.vintage?' <span style="color:var(--mut);font-size:11px">'+i.vintage+'</span>':'';
      var curVal = conCounts[i.id] || '';
      return '<tr style="border-bottom:1px solid var(--bdr);'+(ic?'background:rgba(41,128,185,.04)':'')+'">' +
        '<td style="padding:10px 14px"><div style="font-weight:500">'+i.name+vt+'</div>' +
          (ic?'<div style="font-size:10px;color:#5dade2;margin-top:2px">✓ Complimentary</div>':'') + '</td>' +
        '<td style="padding:10px 14px;text-align:center;font-weight:700;color:'+sc+'">'+Math.max(0,Math.round(s))+'</td>' +
        '<td style="padding:10px 14px;text-align:center;background:rgba(41,128,185,.06)">' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:8px">' +
            '<button onclick="adjOp('+i.id+',-1)" style="background:var(--sur2);border:1px solid var(--bdr);border-radius:6px;width:28px;height:28px;color:var(--txt);font-size:16px;cursor:pointer;font-weight:700;line-height:1;font-family:inherit">−</button>' +
            '<input type="number" id="qop_'+i.id+'" min="0" step="1" placeholder="0" value="'+curVal+'" style="width:54px;background:var(--sur);border:1.5px solid '+(ic?'rgba(41,128,185,.5)':'var(--bdr)')+';color:var(--wht);border-radius:6px;padding:5px 6px;font-size:14px;font-weight:700;text-align:center;font-family:inherit" oninput="onOpInput('+id+')">' +
            '<button onclick="adjOp('+i.id+',1)" style="background:var(--sur2);border:1px solid var(--bdr);border-radius:6px;width:28px;height:28px;color:var(--txt);font-size:16px;cursor:pointer;font-weight:700;line-height:1;font-family:inherit">+</button>' +
          '</div></td><input type="hidden" id="qc'+i.id+'" value="'+curVal+'"></tr>';
    }).join('');

    return '<div id="csec_'+catIdx+'" style="margin-bottom:24px;border-radius:10px;overflow:hidden;border:1px solid var(--bdr)">' +
      '<div style="background:var(--sur2);padding:8px 14px;font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:1px;display:flex;justify-content:space-between"><span>'+catLabel+'</span><span style="font-weight:400">'+ci.length+' items</span></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:rgba(255,255,255,.02)">' +
        '<th style="padding:7px 14px;text-align:left;font-size:10px;color:var(--mut)">Item</th>' +
        '<th style="padding:7px 14px;text-align:center;font-size:10px;color:var(--mut)">SOH</th>' +
        '<th style="padding:7px 14px;text-align:center;font-size:10px;color:#5dade2;background:rgba(41,128,185,.06)">Opening Count</th>' +
      '</tr></thead><tbody>'+rows+'</tbody></table></div>';
  }).join('');
  G('cgrp').innerHTML = html || '<div class="empty">No items available.</div>';
  updateCSummary();
}

function adjOp(id,d){ var el=G('qop_'+id); if(!el)return; el.value=Math.max(0,(parseFloat(el.value)||0)+d); onOpInput(id); }

function onOpInput(id){
  var el = G('qop_'+id);
  if (el) {
    conCounts[id] = parseFloat(el.value) || 0;
    var hid = G('qc'+id); if (hid) hid.value = el.value;
  }
  updateCSummary();
}

function updateCSummary(){
  var en = items.filter(function(i){ return conCounts[i.id] > 0; });
  G('csum').style.display=en.length?'block':'none';
  G('csumlist').innerHTML=en.map(function(i){ return'<div style="background:var(--sur2);border:1px solid var(--bdr);border-radius:20px;padding:4px 10px;font-size:12px;display:flex;align-items:center;gap:6px"><span style="font-weight:600;color:var(--acc)">'+conCounts[i.id]+'×</span><span>'+i.name+'</span></div>';}).join('');
}

G('subcon').addEventListener('click', async function(){
  var name=G('ename').value.trim(),date=G('edate').value;
  if(!name||!date){toast('Please fill in Function Name and Date',true);return;}
  var lines=[];
  items.forEach(function(i){ var q=parseFloat(conCounts[i.id])||0; if(q>0) lines.push({item:i,qty:q}); });
  if(!lines.length){toast('No quantities entered',true);return;}
  var btn=G('subcon'); btn.disabled=true; btn.textContent='Saving…';
  try{
    var r1=await sb.from('events').insert({event_name:name,event_date:date,status:'open'}).select().single();
    if(r1.error) throw r1.error;
    await sb.from('event_lines').insert(lines.map(function(l){return{event_id:r1.data.id,item_id:l.item.id,quantity:l.qty,opening_qty:l.qty};}));
    for(var k=0;k<lines.length;k++){ var ln=lines[k]; await sb.from('items').update({consumed:(parseFloat(ln.item.consumed)||0)+ln.qty}).eq('id',ln.item.id); }
    await fetchItems(); conCounts={}; loadCon();
    toast('✅ Opening count saved');
    document.querySelector('#nav a[data-p="history"]').click();
  }catch(ex){toast(ex.message,true);}
  finally{btn.textContent='✅ Submit Opening Count';btn.disabled=false;}
});

// ── HISTORY ───────────────────────────────────────────────────
async function loadHist(){
  var ra=await sb.from('events').select('*,event_lines(*,items(name))').eq('status','open').order('created_at',{ascending:false});
  var ab=G('hactb');
  ab.innerHTML=!(ra.data&&ra.data.length)?'<tr><td colspan="6"><div class="empty">✅ No active events</div></td></tr>':
    ra.data.map(function(e){
      return '<tr><td>'+e.event_date+'</td><td style="font-weight:600">'+e.event_name+'</td><td>'+e.event_type+'</td><td>'+(e.supervisor||'—')+'</td><td>'+e.event_lines.length+' items</td>'
        +'<td style="display:flex;gap:6px;justify-content:flex-end"><button class="btn bs bsm" onclick="openCloseEvt('+e.id+')">Close Event</button></td></tr>';
    }).join('');
}

function loadSettings(){
  var st=localStorage.getItem('pbevs'); if(st) settings=JSON.parse(st);
  renderML();
}
function renderML(){
  var el=G('mlist');
  el.innerHTML=(settings.members||[]).map(function(m){return'<div style="display:flex;align-items:center;gap:6px;background:var(--sur2);padding:6px 12px;border-radius:20px;border:1px solid var(--bdr)"><span style="font-size:13px">'+m+'</span><button onclick="rmM(\''+m+'\')" style="background:none;border:none;color:var(--mut);cursor:pointer;font-size:14px;line-height:1">✕</button></div>';}).join('');
}

async function autoReport(){
  if(new Date().getDate()===1){
    var lm=new Date(new Date().getFullYear(),new Date().getMonth()-1,1);
    var mk=lm.getFullYear()+'-'+String(lm.getMonth()+1).padStart(2,'0');
    var r=await sb.from('monthly_reports').select('*',{count:'exact',head:true}).eq('report_month',mk);
    if(!r.count) await genReport(true);
  }
}

function filterOItems(){
  var q=G('osrch').value.toLowerCase().trim();
  document.querySelectorAll('#ogrps tbody tr').forEach(function(row){ row.style.display=(!q||row.textContent.toLowerCase().includes(q))?'':'none'; });
}

function filterCItems(){
  var q=G('csrch').value.toLowerCase().trim();
  document.querySelectorAll('#cgrp tbody tr').forEach(function(row){ row.style.display=(!q||row.textContent.toLowerCase().includes(q))?'':'none'; });
}

// ── STARTUP ───────────────────────────────────────────────────
startApp();
