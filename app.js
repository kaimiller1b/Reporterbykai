var $=function(i){return document.getElementById(i)},tr=function(x){return x.trim()},ROWS=[];
document.querySelectorAll(".tabs button").forEach(function(b){b.onclick=function(){
  document.querySelectorAll(".tabs button").forEach(function(x){x.className=x==b?"on":""});
  ["c","m","f","r","d","g"].forEach(function(t){$(t).hidden=t!=b.dataset.t})}});
function parse(t){var rows=[],row=[],f="",q=false,ln=1,st=1;
  for(var i=0;i<t.length;i++){var c=t[i];
    if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else{if(c=="\n")ln++;f+=c}}
    else if(c=='"')q=true;
    else if(c=="\t"){row.push(f);f=""}
    else if(c=="\n"||c=="\r"){if(c=="\r"&&t[i+1]=="\n")i++;row.push(f);row.line=st;rows.push(row);row=[];f="";ln++;st=ln}
    else f+=c}
  row.push(f);row.line=st;rows.push(row);
  return rows.filter(function(r){return r.some(function(x){return tr(x)})})}
var RX=/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})/;
function toDate(s){var m=RX.exec(s||"");if(!m)return null;var y=+m[3];if(y<100)y+=2000;return new Date(y,+m[1]-1,+m[2],+m[4],+m[5])}
function fmt(d){var h=d.getHours(),ap=h>=12?"PM":"AM";h=h%12;if(!h)h=12;
  return (d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear()+" "+h+":"+String(d.getMinutes()).padStart(2,"0")+" "+ap}
function lines(s){return s.split(/[\r\n]+/).map(tr).filter(Boolean)}
var FMT="font-family:Arial;font-size:10pt;text-align:center;vertical-align:middle";
function cpH(rows,plain){var e=function(x){return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;")};
  var h="<table>"+rows.map(function(r){return"<tr>"+r.map(function(c){return'<td style="'+FMT+'">'+e(c)+"</td>"}).join("")+"</tr>"}).join("")+"</table>";
  var b=window.event&&window.event.target;
  function done(ok){if(!b||b.tagName!="BUTTON")return;var t=b.dataset.l||b.textContent;b.dataset.l=t;b.textContent=ok?"Copied!":"Copy failed";
    clearTimeout(b._t);b._t=setTimeout(function(){b.textContent=t},1500)}
  function legacy(){var d=document.createElement("div");d.innerHTML=h;d.style.cssText="position:fixed;left:-9999px;top:0";document.body.appendChild(d);
    var r=document.createRange(),sel=getSelection();r.selectNodeContents(d);sel.removeAllRanges();sel.addRange(r);
    var ok=false;try{ok=document.execCommand("copy")}catch(x){}sel.removeAllRanges();d.remove();return ok}
  function text(){return navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(plain):Promise.reject()}
  if(!plain){done(false);return}
  if(navigator.clipboard&&navigator.clipboard.write&&window.ClipboardItem){
    try{navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([h],{type:"text/html"}),"text/plain":new Blob([plain],{type:"text/plain"})})])
      .then(function(){done(true)},function(){done(legacy())})}catch(x){done(legacy())}}
  else if(legacy())done(true);
  else text().then(function(){done(true)},function(){done(false)})}
function cpT(id){var e=$(id),t=e.tagName=="TEXTAREA"?e.value:e.textContent;cpH(t.split("\n").map(function(l){return[l]}),t)}

/* ---------- Delivery dates ---------- */
var DELIVERY_CARRIERS=["SALEM TRUCK RENTAL LLC","WRNR LLC","Lucky Freight LLC"];
function stopDestinations(s){var a=[],re=/([A-Za-z0-9.' -]+,\s*[A-Z]{2})(?=\s|$)/g,m;
  while((m=re.exec(s||""))!==null)a.push(tr(m[1]));
  return a}
function stopDates(s){var a=[],re=/\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}/g,m;
  while((m=re.exec(s||""))!==null){var d=toDate(m[0]);if(d)a.push(d)}
  return a}
function dateOnly(d){return(d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear()}
function samePlace(a,b){return a.toLowerCase().replace(/\s*,\s*/g,", ").replace(/\s+/g," ")===b.toLowerCase().replace(/\s*,\s*/g,", ").replace(/\s+/g," ")}
function runD(){var out=[],warn=[];
  parse($("d-in").value).forEach(function(r){var f=r.map(tr),ci=-1;
    for(var i=f.length-1;i>=0;i--)if(f[i]){ci=i;break}
    if(ci<0||!DELIVERY_CARRIERS.some(function(c){return f[ci].toLowerCase()===c.toLowerCase()}))return;
    var trip=f[0],origin=f[2],dests=stopDestinations(f[9]),dates=stopDates(f[10]),date;
    if(dests.length!==dates.length)warn.push("Line "+r.line+" (trip "+trip+"): destination/date counts differ.");
    var hubs=["Allen Park, MI","Irving, TX"],isRoundTrip=dests.length>2&&hubs.some(function(h){return samePlace(origin,h)&&samePlace(dests[dests.length-1],h)});
    if(isRoundTrip){if(dates.length<dests.length-1)date=null;else date=dates[dests.length-2]}
    else date=toDate(f[12]);
    var driver=ci>=2?tr(f[ci-2]):"";
    if(!date){warn.push("Line "+r.line+" (trip "+trip+"): delivery date is missing or unreadable; skipped.");return}
    if(!trip||!driver){warn.push("Line "+r.line+": trip number or driver name is missing; skipped.");return}
    out.push([trip,dateOnly(date),driver].join(" "))});
  $("d-out").value=out.join("; ");$("d-w").textContent=warn.join("\n")}

/* ---------- Converter ---------- */
function runC(){var warn=[];ROWS=[];
  parse($("c-in").value).forEach(function(r){
    var ne=r.map(tr).filter(Boolean);if(ne.length<5)return;
    var trip=tr(r[0]),load=tr(r[1]),pick=tr(r[2]),sched=toDate(r[3]);
    var dests=lines(ne[ne.length-2]),dates=lines(ne[ne.length-1]).map(toDate);
    if(!sched||!dests.length||!dates.length||dates.some(function(d){return !d})){warn.push("Line "+r.line+" (trip "+trip+"): couldn't parse, skipped.");return}
    var k=Math.min(dests.length,dates.length)-1;
    if(dests.length!==dates.length)warn.push("Line "+r.line+" (trip "+trip+"): destination/date counts differ. Check it.");
    var nz=function(s){return s.toLowerCase().replace(/\s+/g," ")};
    if(nz(dests[k])===nz(pick)){if(k>0)k--;else warn.push("Line "+r.line+" (trip "+trip+"): only destination equals pickup. Verify.")}
    ROWS.push(["One Brokerage LLC","FA2H2",trip,load,pick+"-"+dests[k],fmt(sched),"","YES","",fmt(new Date(sched.getTime()+18e5)),"YES","",fmt(dates[k]),"YES"])});
  ROWS.sort(function(a,b){var x=parseFloat(a[2]),y=parseFloat(b[2]);return(isNaN(x)||isNaN(y))?String(a[2]).localeCompare(String(b[2]),undefined,{numeric:true}):x-y});
  $("c-out").value=ROWS.map(function(r){return r.join("\t")}).join("\n");$("c-w").textContent=warn.join("\n")}
function cpC(){cpH(ROWS,$("c-out").value)}

/* ---------- Filter ---------- */
function runF(){var rows=parse($("f-in").value),warn=[],date="";
  if(rows.length){var ne=rows[0].map(tr).filter(Boolean);if(ne.length==1&&/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ne[0])){var p=ne[0].split("/");date=p[0].padStart(2,"0")+"/"+p[1].padStart(2,"0")+"/"+p[2];rows.shift()}}
  if(!date&&$("f-date").value){var q=$("f-date").value.split("-");date=q[1]+"/"+q[2]+"/"+q[0]}
  if(!date){$("f-out").value="";$("f-w").textContent="Report date missing: paste it as the first line or fill the date field.";return}
  var N=0,y=[0,0,0],buckets=[[0,0,0,0,0],[0,0,0,0,0]],seen={},nm=["pickup","departure","delivery"];
  rows.forEach(function(r){var f=r.map(tr),fl=f.filter(function(x){return x==="YES"||x==="NO"});
    if(fl.length!==3){warn.push("Line "+r.line+": bad row, "+fl.length+" flags found (need exactly 3).");return}
    N++;fl.forEach(function(x,i){if(x==="YES")y[i]++});
    var id=f.filter(function(x){return/^\d{8,}$/.test(x)})[0];
    if(id){if(seen[id])warn.push("Line "+r.line+": duplicate load number "+id+" (also line "+seen[id]+").");else seen[id]=r.line}
    var pr=[];f.forEach(function(x,i){if(x!=="YES"&&x!=="NO")return;var a=toDate(f[i-2]),b=toDate(f[i-1]);
      if(i>=2&&a&&b){pr.push([a,b]);if(x==="YES"&&Math.abs(a-b)>864e5)warn.push("Line "+r.line+": "+nm[pr.length-1]+" flagged YES but times are more than 24h apart.")}else pr.push(null)});
    [0,2].forEach(function(stage,k){
      if(fl[stage]!=="NO")return;
      var times=pr[stage];
      if(!times){warn.push("Line "+r.line+": "+nm[stage]+" flagged NO but times are missing/unreadable; excluded from lateness buckets.");return}
      // Pickup is planned/actual; delivery is actual/planned, as in the flagger.
      var d=Math.round((stage?times[0]-times[1]:times[1]-times[0])/6e4);
      if(d<=0){warn.push("Line "+r.line+": "+nm[stage]+" flagged NO but delay is on time or early; excluded from lateness buckets.");return}
      buckets[k][d<=15?0:d<=30?1:d<60?2:d<180?3:4]++});
    if(pr[0]&&pr[2]&&Math.max(pr[2][0],pr[2][1])<Math.min(pr[0][0],pr[0][1]))warn.push("Line "+r.line+": delivery is earlier than pickup.")});
  $("f-w").textContent=warn.join("\n");
  if(!N){$("f-out").value="";return}
  var pc=function(n){return(n/N*100).toFixed(2)+"%"};
  var labels=["0-15 min late","15-30 min late","30-1hr late","1+ hr late","3hr + late"];
  $("f-out").value=["**GEGW loads report "+date+"**",
    y[0]+" out of "+N+" loads picked up on time **"+pc(y[0])+"**",
    y[1]+" out of "+N+" loads departed on time **"+pc(y[1])+"**",
    y[2]+" out of "+N+" loads delivered on time **"+pc(y[2])+"**",
    "", "PU:"]
    .concat(labels.map(function(label,i){return label+": "+buckets[0][i]}),
      ["", "Delivery:"],labels.map(function(label,i){return label+": "+buckets[1][i]})).join("\n")}

/* ---------- Reporter ---------- */
var COMPOUND=["Dock/Yard operations","Traffic/Construction"];
var ROUTE=/^[^,]+,\s*[A-Z]{2}\s*-\s*[^,]+,\s*[A-Z]{2}$/;
function dly(m){var h=Math.floor(m/60),n=m%60,p=[];if(h)p.push(h+(h==1?"hr":"hrs"));if(n)p.push(n+(n==1?"min":"mins"));return p.join(" ")}
function runR(){var car={},P=[],D=[],ck=[];
  parse($("r-in2").value).forEach(function(r){var f=r.map(tr),e=f.length;
    while(e>0&&(!f[e-1]||/^tracking/i.test(f[e-1])))e--;
    var c=e>0?f[e-1]:"";if(/^[\d\s()+.\-]+$/.test(c))c="";
    f.forEach(function(x){if(/^\d{6,}$/.test(x))car[x]=c})});
  parse($("r-in1").value).forEach(function(r){var f=r.map(tr),ri=-1;
    for(var i=0;i<f.length;i++)if(ROUTE.test(f[i])){ri=i;break}
    if(ri<2){ck.push("Line "+r.line+": no route/REF#/truck# found, row skipped.");return}
    var truck=f[ri-2],ref=f[ri-1],route=f[ri].replace(/\s*-\s*/g,"-").replace(/\s+/g," "),g=f.slice(ri+1);
    while(g.length<10)g.push("");
    var st=[{n:"pickup",p:g[0],a:g[1],fl:g[2]},{n:"pickup",p:g[4],a:g[3],fl:g[5]},{n:"delivery",p:g[7],a:g[6],fl:g[8]}];
    var nt=g[9];COMPOUND.forEach(function(c){nt=nt.replace(new RegExp(c.split("/").join("\\s*\\/\\s*"),"ig"),c.replace(/\//g,"\u0001"))});
    var R=nt.split("/").map(function(x){return tr(x).replace(/\u0001/g,"/")}).filter(function(x){return x&&!/^(tracking|eta) on time$/i.test(x)});
    var nos=st.filter(function(s){return s.fl==="NO"}),tag="Trip "+truck+" (REF "+ref+")";
    var used=0;
    nos.forEach(function(s){
      if(!R.length){s.r="(none in data)";return}
      var k=Math.min(used,R.length-1);
      // A later late-departure reason belongs to delivery, not the pickup/departure group.
      if(s.n==="pickup"&&k>0&&/^late\s+departure$/i.test(R[k])){s.r=R[0];return}
      s.r=R[k];
      if(used>=R.length&&s.n==="delivery")ck.push(tag+": reason reused for "+s.n+" ("+s.r+").");
      used++});
    if(nos.length&&R.length>used)ck.push(tag+": unused reason(s) "+R.slice(used).join("/")+". Is that part of one reason?");
    var late={pickup:[],delivery:[]};
    st.forEach(function(s,i){var a=toDate(s.a),p=toDate(s.p),d=a&&p?Math.round((a-p)/6e4):null,l="S"+(i+1);
      if(s.fl!=="YES"&&s.fl!=="NO"){ck.push(tag+": "+l+" flag is not YES/NO.");return}
      if(s.fl==="YES"){if(d>0)ck.push(tag+": "+l+" flagged YES but actual is "+dly(d)+" after planned.");return}
      if(d===null){ck.push(tag+": "+l+" flagged NO but times are missing/unreadable.");return}
      if(d<=0){ck.push(tag+": "+l+" flagged NO but delay is "+d+" min, skipped.");return}
      if(d>=720)ck.push(tag+": "+l+" delay is "+dly(d)+", looks like a typo?");
      s.d=d;late[s.n].push(s)});
    [["pickup",P],["delivery",D]].forEach(function(z){var a=late[z[0]];if(!a.length)return;
      var mx=Math.max.apply(null,a.map(function(s){return s.d})),rs=[];
      a.forEach(function(s){if(rs.indexOf(s.r)<0)rs.push(s.r)});
      var c=car[ref];if(!c){c="[CARRIER]";ck.push(tag+": carrier blank or REF# not in tracker.")}
      if(rs.indexOf("(none in data)")>=0)ck.push(tag+": no reason in data ("+z[0]+").");
      z[1].push("REF# "+ref+" // "+truck+" => "+route+"\nREASON: "+rs.join("/")+"\nDELAY: "+dly(mx)+"\n"+c)})});
  $("r-pk").textContent=P.join("\n\n");$("r-dl").textContent=D.join("\n\n");
  $("r-n").textContent=P.length+" pickup entries and "+D.length+" delivery entries";
  $("r-w").textContent=ck.length?ck.join("\n"):"Nothing to check."}

/* ---------- Flagger ---------- */
var GRID=[];
function qt(x){return/[\t\n"]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x}
function runG(){var warn=[],ch=0;GRID=[];
  parse($("g-in").value).forEach(function(r){var f=r.map(tr),ix=[];
    f.forEach(function(x,i){if(x==="YES"||x==="NO")ix.push(i)});
    if(ix.length!==3){warn.push("Line "+r.line+": found "+ix.length+" flags (need 3), left unchanged.");GRID.push(f);return}
    ix.forEach(function(i,s){var A=toDate(f[i-2]),B=toDate(f[i-1]);
      if(i<2||!A||!B){warn.push("Line "+r.line+": stage "+(s+1)+" times unreadable, flag left as is.");return}
      var d=Math.round((s?A-B:B-A)/6e4),n=d>0?"NO":"YES";
      if(n!==f[i]){ch++;f[i]=n}});
    GRID.push(f)});
  $("g-out").value=GRID.map(function(f){return f.map(qt).join("\t")}).join("\n");
  $("g-w").textContent=(GRID.length?ch+" flag(s) changed.\n":"")+warn.join("\n")}
function cpG(){cpH(GRID,$("g-out").value)}

/* ---------- 5 min minuer ---------- */
var MGRID=[];
function runM(){var warn=[],ch=0;MGRID=[];
  parse($("m-in").value).forEach(function(r){var f=r.map(tr),ix=[];
    f.forEach(function(x,i){if(x==="YES"||x==="NO")ix.push(i)});
    if(ix.length!==3){warn.push("Line "+r.line+": found "+ix.length+" flags (need 3), left unchanged.");MGRID.push(f);return}
    ix.forEach(function(i,s){
      if(f[i]!=="YES")return;
      var pi=s?i-1:i-2,ai=s?i-2:i-1;
      if(i<2||!toDate(f[pi])||!toDate(f[ai])){warn.push("Line "+r.line+": stage "+(s+1)+" times unreadable, actual time left unchanged.");return}
      var p=toDate(f[pi]),a=toDate(f[ai]),d=Math.round((a-p)/6e4);
      if(d>0&&d<=5){f[ai]=fmt(new Date(a.getTime()-3e5));ch++}});
    MGRID.push(f)});
  $("m-out").value=MGRID.map(function(f){return f.map(qt).join("\t")}).join("\n");
  $("m-w").textContent=(MGRID.length?ch+" actual time(s) adjusted.\n":"")+warn.join("\n")}
function cpM(){cpH(MGRID,$("m-out").value)}
