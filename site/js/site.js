/* Astraea Link home page behaviour: theme toggle, "See How We Fix It" video, plans reveal. WCAG 2.2: pause controls (2.2.2), reduced motion, no flashing. */
(function(){
var R=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function lab(b,l,c){b.setAttribute('aria-label',l);b.title=l;b.querySelector('use').setAttribute('href','#i-'+c)}
var root=document.documentElement,tt=document.getElementById('tt');
if(tt&&!tt.getAttribute('data-astra-theme')){
  tt.setAttribute('data-astra-theme','1');
  tt.addEventListener('click',function(){
    var light=root.classList.contains('light')||root.getAttribute('data-theme')==='light';
    if(window.__astraSetTheme)window.__astraSetTheme(light?'dark':'light');
  });
}
var D=[["Audit","We scan and hand-test your site against WCAG 2.2 AA and flag every barrier."],["Roadmap","Issues are ranked by impact, each with its fix and an effort estimate."],["Remediate","The fix goes into your code, not a widget on top."],["Re-test","Every fix is checked again by hand before we sign it off."],["Monitor","Regular checks catch new issues as your site changes, with reports to your team."]];
var DW=5000,sc=[].slice.call(document.querySelectorAll('.sc')),ol=document.getElementById('stp'),cap=document.getElementById('cap'),end=document.getElementById('end'),vb=document.getElementById('vb');
ol.innerHTML=D.map(function(d,k){return '<li><button class="sb" type="button" data-k="'+k+'"><span class="tr" aria-hidden="true"><i></i></span>'+d[0]+'</button></li>'}).join('');
var sb=[].slice.call(ol.querySelectorAll('.sb')),cur=0,timer=null,playing=false,left=DW,t0=0,vS=false;
function bar(k,run,ms){var i=sb[k].querySelector('.tr i');i.style.transition='none';i.style.width='0';void i.offsetWidth;if(run){i.style.transition='width '+ms+'ms linear';i.style.width='100%'}}
function show(k){cur=k;sc.forEach(function(s){s.classList.remove('on');s.querySelectorAll('*').forEach(function(e){e.style.animationPlayState=''})});void sc[k].offsetWidth;sc[k].classList.add('on');document.getElementById('cn').textContent='Step '+(k+1)+' of 5';document.getElementById('ct').textContent=D[k][0];document.getElementById('cp').textContent=D[k][1];sb.forEach(function(b,j){b.classList.toggle('past',j<k);if(j===k)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');if(j!==k)bar(j,false)});left=DW}
function vplay(){end.hidden=true;playing=true;lab(vb,'Pause video','pause');t0=Date.now();bar(cur,true,left);timer=setTimeout(adv,left);sc[cur].querySelectorAll('*').forEach(function(e){e.style.animationPlayState=''})}
function vpause(){playing=false;clearTimeout(timer);left-=Date.now()-t0;var i=sb[cur].querySelector('.tr i');var w=getComputedStyle(i).width;i.style.transition='none';i.style.width=w;sc[cur].querySelectorAll('*').forEach(function(e){e.style.animationPlayState='paused'});lab(vb,'Play video','play')}
function adv(){if(cur<4){show(cur+1);if(playing){t0=Date.now();bar(cur,true,DW);timer=setTimeout(adv,DW)}}else{playing=false;left=0;sb[4].classList.add('past');lab(vb,'Replay video','refresh');end.hidden=false}}
vb.addEventListener('click',function(){vS=true;if(playing)vpause();else{if(left<=0){show(0)}vplay()}});
sb.forEach(function(b){b.addEventListener('click',function(){vS=true;if(playing)vpause();cap.setAttribute('aria-live','polite');show(+b.dataset.k);sb[cur].querySelector('.tr i').style.width='100%';lab(vb,'Play video','play')})});
document.getElementById('endl').addEventListener('click',function(e){e.preventDefault();var h=document.getElementById('h2p');document.getElementById('plans').scrollIntoView({behavior:R?'auto':'smooth'});h.focus({preventScroll:true})});
show(0);
if(R){sc.forEach(function(s){s.querySelectorAll('*').forEach(function(e){e.style.animation='none';e.style.opacity='1';e.style.transform='none';e.style.maxWidth='100%'})});end.hidden=false;vS=true}
var pw=document.getElementById('pw'),pb=document.getElementById('pb'),T=7000,pst=0,pel=0,pt=null,ps='idle';
function pfin(){ps='done';pw.classList.remove('paused','armed');pw.classList.add('done');lab(pb,'Replay animation','refresh')}
function parm(ms){clearTimeout(pt);pt=setTimeout(pfin,ms)}
function pstart(){pw.classList.remove('done','paused','go');pw.classList.add('armed');void pw.offsetWidth;pw.classList.add('go');pel=0;pst=Date.now();ps='play';lab(pb,'Pause animation','pause');parm(T)}
pb.addEventListener('click',function(){if(ps==='play'){clearTimeout(pt);pel+=Date.now()-pst;pw.classList.add('paused');ps='pause';lab(pb,'Play animation','play')}else if(ps==='pause'){pst=Date.now();pw.classList.remove('paused');ps='play';lab(pb,'Pause animation','pause');parm(T-pel)}else{pstart()}});
if(R||!('IntersectionObserver' in window)){pw.classList.add('st');pb.hidden=true}else{pw.classList.add('armed')}
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;if(e.target.id==='vid'&&!vS){vS=true;vplay()}if(e.target.id==='pw'&&ps==='idle'&&!R){pstart()}io.unobserve(e.target)})},{threshold:.2});io.observe(document.getElementById('vid'));io.observe(pw)}else if(!R){vplay();pstart()}
})();
