
(function(){
  var root=document.getElementById('lich-su'),z=document.getElementById('lsxZoom'); if(!root||!z) return;
  var st=document.getElementById('lsxStage'),logo=document.getElementById('lsxZlogo'),zt=document.getElementById('lsxZt'),
      zh=document.getElementById('lsxZh'),zf=document.getElementById('lsxZf');
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches,raf=0,MAX=Math.log(9),H=0,tot=0;
  function cl(x){return Math.max(0,Math.min(1,x));}
  function measure(){ H=window.innerHeight; tot=z.offsetHeight-H; }
  var lastP=-1;
  function frame(){
    raf=0; if(!tot) measure(); if(tot<=0) return;
    var p=cl(-z.getBoundingClientRect().top/tot);
    if(Math.abs(p-lastP)<.0005) return; lastP=p;
    var fill=cl((p-.4)/.3), vis=p<=0||p>=1?(p<=0?'visible':'hidden'):'visible';
    logo.style.transform='scale('+(reduce?1:Math.exp(Math.min(p,.72)/.72*MAX)).toFixed(3)+')';
    logo.style.visibility=fill>=1?'hidden':'visible';
    zf.style.opacity=fill;
    zt.style.opacity=1-cl(p/.2); zt.style.transform='translateY('+(-p*60).toFixed(0)+'px)';
    zh.style.opacity=1-cl(p/.08);
    st.style.opacity=1-cl((p-.82)/.18);
    st.style.visibility=p>=1?'hidden':'visible';
    if(p>.9) root.classList.add('lsx-seen');
  }
  function req(){ if(!raf) raf=requestAnimationFrame(frame); }
  addEventListener('scroll',req,{passive:true});
  addEventListener('resize',function(){tot=0;lastP=-1;req();});
  var was=root.classList.contains('intro-active');
  new MutationObserver(function(){
    var now=root.classList.contains('intro-active'); if(now===was) return; was=now;
    if(now){tot=0;lastP=-1;root.classList.remove('lsx-seen');root.dispatchEvent(new Event('lsx:reset'));req();}
  }).observe(root,{attributes:true,attributeFilter:['class']});
  req();setTimeout(function(){tot=0;lastP=-1;req();},300);
})();

