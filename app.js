var $=function(i){return document.getElementById(i)},tr=function(x){return x.trim()},ROWS=[];
document.querySelectorAll(".tabs button").forEach(function(b){b.onclick=function(){
  document.querySelectorAll(".tabs button").forEach(function(x){x.className=x==b?"on":""});
  document.querySelectorAll("section").forEach(function(s){s.hidden=s.id!=b.dataset.t})}});
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
function cpD(){var e=$("d-out"),text=e.value,b=window.event&&window.event.target;
  function done(ok){if(!b||b.tagName!="BUTTON")return;var label=b.dataset.l||b.textContent;b.dataset.l=label;b.textContent=ok?"Copied!":"Copy failed";clearTimeout(b._t);b._t=setTimeout(function(){b.textContent=label},1500)}
  function fallback(){e.focus();e.select();var ok=false;try{ok=document.execCommand("copy")}catch(x){}done(ok)}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(function(){done(true)},fallback);
  else fallback()}
function runD(){var out=[],warn=[];
  parse($("d-in").value).forEach(function(r){var f=r.map(tr),ci=-1;
    for(var i=f.length-1;i>=0;i--)if(f[i]){ci=i;break}
    if(ci<0||!DELIVERY_CARRIERS.some(function(c){return f[ci].toLowerCase()===c.toLowerCase()}))return;
    var trip=f[0],load=f[1],origin=f[2],dests=stopDestinations(f[9]),dates=stopDates(f[10]),date;
    if(dests.length!==dates.length)warn.push("Line "+r.line+" (trip "+trip+"): destination/date counts differ.");
    var hubs=["Allen Park, MI","Irving, TX"],isRoundTrip=dests.length>2&&hubs.some(function(h){return samePlace(origin,h)&&samePlace(dests[dests.length-1],h)});
    var deliveryIndex=isRoundTrip?dests.length-2:dests.length-1,deliveryLocation=dests[deliveryIndex];
    if(isRoundTrip){if(dates.length<dests.length-1)date=null;else date=dates[deliveryIndex]}
    else date=toDate(f[12]);
    var driver=ci>=2?tr(f[ci-2]).replace(/\s+/g," "):"";
    if(!deliveryLocation){warn.push("Line "+r.line+" (trip "+trip+"): delivery location is missing or unreadable; skipped.");return}
    if(!date){warn.push("Line "+r.line+" (trip "+trip+"): delivery date is missing or unreadable; skipped.");return}
    if(!trip||!load||!driver){warn.push("Line "+r.line+": trip number, load ID, or driver name is missing; skipped.");return}
    out.push([trip,load,deliveryLocation,dateOnly(date),driver].join(" "))});
  $("d-out").value=out.join("; ");$("d-w").textContent=warn.join("\n")}

/* ---------- Converter ---------- */
function toggleCTime(hours){var id=hours>0?"c-add-hour":"c-minus-hour",on=$(id).getAttribute("aria-pressed")!=="true";
  ["c-add-hour","c-minus-hour"].forEach(function(i){var b=$(i),active=i===id&&on;
    b.setAttribute("aria-pressed",String(active));
    b.textContent=(i==="c-add-hour"?"Add":"Subtract")+" 1 hour: "+(active?"On":"Off")})}
function shiftCDate(d){var h=$("c-add-hour").getAttribute("aria-pressed")==="true"?1:$("c-minus-hour").getAttribute("aria-pressed")==="true"?-1:0;
  return d&&h?new Date(d.getTime()+h*36e5):d}
function runC(){var warn=[];ROWS=[];
  var selectedDate=$("c-date").value;
  if(!selectedDate){$("c-out").value="";$("c-w").textContent="Choose a day to include (same date used in GEGW).";return}
  var dayKey=selectedDate;
  parse($("c-in").value).forEach(function(r){
    var status=tr(r[4]||"");
    if(/cancelled|tonu/i.test(status)){warn.push("load "+tr(r[1]||"")+" was removed : "+status);return}
    var ne=r.map(tr).filter(Boolean);if(ne.length<5)return;
    var trip=tr(r[0]),load=tr(r[1]),pick=tr(r[2]),sched=shiftCDate(toDate(r[3]));
    if(!sched){warn.push("Line "+r.line+" (trip "+trip+"): couldn't parse, skipped.");return}
    var scheduledKey=sched.getFullYear()+"-"+String(sched.getMonth()+1).padStart(2,"0")+"-"+String(sched.getDate()).padStart(2,"0");
    if(scheduledKey!==dayKey)return;
    var dests=lines(ne[ne.length-2]),dates=lines(ne[ne.length-1]).map(function(s){return shiftCDate(toDate(s))});
    if(!dests.length||!dates.length||dates.some(function(d){return !d})){warn.push("Line "+r.line+" (trip "+trip+"): couldn't parse, skipped.");return}
    var k=Math.min(dests.length,dates.length)-1;
    if(dests.length!==dates.length)warn.push("Line "+r.line+" (trip "+trip+"): destination/date counts differ. Check it.");
    var nz=function(s){return s.toLowerCase().replace(/\s+/g," ")};
    if(nz(dests[k])===nz(pick)){if(k>0)k--;else warn.push("Line "+r.line+" (trip "+trip+"): only destination equals pickup. Verify.")}
    ROWS.push(["One Brokerage LLC","FA2H2",trip,load,pick+"-"+dests[k],fmt(sched),"","YES","",fmt(new Date(sched.getTime()+18e5)),"YES","",fmt(dates[k]),"YES"])});
  ROWS.sort(function(a,b){var x=parseFloat(a[2]),y=parseFloat(b[2]);return(isNaN(x)||isNaN(y))?String(a[2]).localeCompare(String(b[2]),undefined,{numeric:true}):x-y});
  $("c-out").value=ROWS.map(function(r){return r.join("\t")}).join("\n");$("c-w").textContent=warn.join("\n")}
function cpC(){cpH(ROWS,$("c-out").value)}

/* ---------- GEGW report ---------- */
function runReport(monthly){var prefix=monthly?"mf":"f",rows=parse($(prefix+"-in").value),warn=[],date="";
  if(rows.length){var ne=rows[0].map(tr).filter(Boolean);if(ne.length==1&&/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ne[0])){var p=ne[0].split("/");date=p[0].padStart(2,"0")+"/"+p[1].padStart(2,"0")+"/"+p[2];rows.shift()}}
  if(monthly){
    var month=$("mf-month").value;
    if(month){var mp=month.split("-");date=new Date(+mp[0],+mp[1]-1,1).toLocaleString("en-US",{month:"long",year:"numeric"})}
    else if(date){var dp=date.split("/");date=new Date(+dp[2],+dp[0]-1,1).toLocaleString("en-US",{month:"long",year:"numeric"})}
  }else if(!date&&$("f-date").value){var q=$("f-date").value.split("-");date=q[1]+"/"+q[2]+"/"+q[0]}
  if(!date){$(prefix+"-out").value="";$(prefix+"-w").textContent=monthly?"Report month missing: paste a date as the first line or fill the month field.":"Report date missing: paste it as the first line or fill the date field.";return}
  var N=0,y=[0,0,0],buckets=[[0,0,0,0,0],[0,0,0,0,0]],seen={},nm=["pickup","departure","delivery"];
  rows.forEach(function(r){var f=r.map(tr),fl=f.filter(function(x){return x==="YES"||x==="NO"});

    // Skip pasted table header row if present
    if(r.line<=2&&!fl.length&&f.some(function(x){return/supplier|load\s*id|trip\s*id|contract|scheduled/i.test(x)}))return;
    var id=f.filter(function(x){return/^\d{8,}$/.test(x)})[0];
    var tag="Line "+r.line+(id?" (load "+id+")":"");
    if(fl.length!==3){warn.push(tag+": bad row, "+fl.length+" flags found (need exactly 3).");return}
    N++;fl.forEach(function(x,i){if(x==="YES")y[i]++});

    if(id){if(seen[id])warn.push(tag+": duplicate load number "+id+" (also line "+seen[id]+").");else seen[id]=r.line}
    var pr=[];var stageIdx=0;
    f.forEach(function(x,i){if(x!=="YES"&&x!=="NO")return;var a=toDate(f[i-2]),b=toDate(f[i-1]);
      var currStage=stageIdx++;
      if(i>=2&&a&&b){
        pr.push([a,b]);
        var delayMs=currStage===0?b.getTime()-a.getTime():a.getTime()-b.getTime();
        if(x==="YES"){
          if(delayMs>864e5)warn.push(tag+": "+nm[currStage]+" flagged YES but actual is "+Math.round(delayMs/36e5)+"h later than planned.");
          else if(delayMs<-864e5)warn.push(tag+": "+nm[currStage]+" flagged YES but actual is "+Math.round(-delayMs/36e5)+"h earlier than planned.");
        }
      }else pr.push(null)});

    [0,2].forEach(function(stage,k){
      if(fl[stage]!=="NO")return;
      var times=pr[stage];
      if(!times){warn.push(tag+": "+nm[stage]+" flagged NO but times are missing/unreadable; excluded from lateness buckets.");return}
      // Pickup is planned/actual; delivery is actual/planned, as in the flagger.
      var d=Math.round((stage?times[0]-times[1]:times[1]-times[0])/6e4);
      if(d<=0){warn.push(tag+": "+nm[stage]+" flagged NO but delay is on time or early; excluded from lateness buckets.");return}
      buckets[k][d<=15?0:d<=30?1:d<60?2:d<180?3:4]++});
    if(pr[0]&&pr[2]&&Math.max(pr[2][0],pr[2][1])<Math.min(pr[0][0],pr[0][1]))warn.push(tag+": delivery is earlier than pickup.")});
  $(prefix+"-w").textContent=warn.join("\n");
  if(!N){$(prefix+"-out").value="";return}
  var pc=function(n){return(n/N*100).toFixed(2)+"%"};
  var labels=["0-15 min late","15-30 min late","30-1hr late","1+ hr late","3hr + late"];
  $(prefix+"-out").value=["**GEGW loads "+(monthly?"monthly report ":"report ")+date+"**",
    y[0]+" out of "+N+" loads picked up on time **"+pc(y[0])+"**",
    y[1]+" out of "+N+" loads departed on time **"+pc(y[1])+"**",
    y[2]+" out of "+N+" loads delivered on time **"+pc(y[2])+"**",
    "", "PU:"]
    .concat(labels.map(function(label,i){return label+": "+buckets[0][i]}),
      ["", "Delivery:"],labels.map(function(label,i){return label+": "+buckets[1][i]})).join("\n")}
function runF(){runReport(false)}
function runMF(){runReport(true)}

/* ---------- Reporter ---------- */
var COMPOUND=["Dock/Yard operations","Traffic/Construction"];
var ROUTE=/^[^,]+,\s*[A-Z]{2}\s*-\s*[^,]+,\s*[A-Z]{2}$/;
function dly(m){var h=Math.floor(m/60),n=m%60,p=[];if(h)p.push(h+(h==1?"hr":"hrs"));if(n)p.push(n+(n==1?"min":"mins"));return p.join(" ")}
function runR(){var car={},P=[],D=[],ck=[],hasTracker=!!tr($("r-in2").value);
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
      var c=car[ref];if(!c&&hasTracker){c="[CARRIER]";ck.push(tag+": carrier blank or REF# not in tracker.")}
      if(rs.indexOf("(none in data)")>=0)ck.push(tag+": no reason in data ("+z[0]+").");
      var report=["REF# "+ref+" // "+truck+" => "+route,"REASON: "+rs.join("/"),"DELAY: "+dly(mx)];
      if(c)report.push(c);z[1].push(report.join("\n"))})});
  $("r-pk").textContent=P.join("\n\n");$("r-dl").textContent=D.join("\n\n");
  $("r-n").textContent=P.length+" pickup entries and "+D.length+" delivery entries";
  $("r-w").textContent=ck.length?ck.join("\n"):"Nothing to check."}

/* ---------- Late reason filler ---------- */
function reasonParts(text){var marked=String(text||"");
  COMPOUND.forEach(function(c){marked=marked.replace(new RegExp(c.split("/").join("\\s*\\/\\s*"),"ig"),c.replace(/\//g,"\u0001"))});
  return marked.split("/").map(function(x){return tr(x).replace(/\u0001/g,"/")}).filter(Boolean)}
function hasReasonForStage(reasons,lateStages,stageIndex){var ordinal=lateStages.slice(0,stageIndex+1).filter(Boolean).length-1;
  return ordinal>=0&&!!reasons[ordinal]}
function addReason(reasons,reason){if(reasons.some(function(x){return x.toLowerCase()===reason.toLowerCase()}))return false;
  reasons.push(reason);return true}
function stageDelay(actualText,plannedText){var actual=toDate(actualText),planned=toDate(plannedText);
  return actual&&planned?Math.round((actual-planned)/6e4):null}
function deliveryReason(delay){return delay<=120?"traffic":delay<=300?"mechanical issue":null}
function runLR(){var rows=parse($("lr-in").value),messages=[];
  rows.forEach(function(row){var trip=tr(row[2]||"")||"(unknown trip)",note=row[14]||"";
    if(/tracking\s+on\s+time|eta\s+on\s+time/i.test(note))return;
    if(row.length<15){messages.push("Trip "+trip+": check: Pu not updated");return}
    var reasons=reasonParts(note),flags=[tr(row[7]||""),tr(row[10]||""),tr(row[13]||"")];
    var delays=[stageDelay(row[6],row[5]),stageDelay(row[8],row[9]),stageDelay(row[11],row[12])];
    var invalid=false,invalidPickup=false;
    flags.forEach(function(flag,i){var bad=(flag!=="YES"&&flag!=="NO")||
        (flag==="NO"&&(delays[i]===null||delays[i]<=0))||(flag==="YES"&&delays[i]>0);
      if(bad){invalid=true;if(i<2)invalidPickup=true}});
    if(invalid){messages.push("Trip "+trip+": "+(invalidPickup?"check: Pu not updated":"Big delay"));return}
    var late=flags.map(function(flag,i){return flag==="NO"&&delays[i]>0});
    var originalReasons=reasons.slice(),changed=false;
    if(late[0]){
      if(!hasReasonForStage(originalReasons,late,0))changed=addReason(reasons,"Stuck at the previous load.")||changed;
      if(late[2]&&!hasReasonForStage(originalReasons,late,2))changed=addReason(reasons,"late departure")||changed;
    }else if(late[1]){
      if(!hasReasonForStage(originalReasons,late,1))messages.push("Trip "+trip+": check: Pu not updated");
      if(late[2]&&!hasReasonForStage(originalReasons,late,2)){
        var netDelay=delays[1]-delays[2];
        if(netDelay>=0)changed=addReason(reasons,"late departure")||changed;
        else{
          var reason=deliveryReason(-netDelay);
          if(reason)changed=addReason(reasons,reason)||changed;
          else messages.push("Trip "+trip+": Big delay");
        }
      }
    }else if(late[2]&&!hasReasonForStage(originalReasons,late,2)){
      var reason=deliveryReason(delays[2]);
      if(reason)changed=addReason(reasons,reason)||changed;
      else messages.push("Trip "+trip+": Big delay");
    }
    if(changed)row[14]=reasons.join("/");
  });
  $("lr-out").value=rows.map(function(row){return row.join("\t")}).join("\n");
  $("lr-w").textContent=messages.filter(function(message,index){return messages.indexOf(message)===index}).join("\n")||"Nothing to check."}
function cpLR(){var text=$("lr-out").value;cpH(parse(text).map(function(row){return row}),text)}

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
