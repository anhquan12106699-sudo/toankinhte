(function(){
  var root=document.getElementById('lich-su'); if(!root) return;
  var tl=document.getElementById('lsxTl'), fill=document.getElementById('lsxFill'),
      svg=document.getElementById('lsxPath'), bg=document.getElementById('lsxPathBg'),
      fg=document.getElementById('lsxPathFg'), mark=document.getElementById('lsxMark'),
      items=[].slice.call(root.querySelectorAll('.lsx-item')),
      nodes=items.map(function(it){return it.querySelector('.lsx-node');}),
      ticking=false, L=0, lw=0, lh=0;
  /* dựng đường cong uốn lượn đi qua tâm các mốc */
  function build(){
    var r=tl.getBoundingClientRect(); lw=r.width; lh=r.height;
    if(!lh||!nodes.length) return;
    svg.setAttribute('width',lw); svg.setAttribute('height',lh);
    var pts=nodes.map(function(n){var b=n.getBoundingClientRect();return {x:b.left+b.width/2-r.left,y:b.top+b.height/2-r.top};});
    var all=[{x:pts[0].x,y:0}].concat(pts,[{x:pts[pts.length-1].x,y:lh}]);
    var A=lw<=900?10:Math.min(100,lw*.085), a=1.33, k=.38, d='M'+all[0].x.toFixed(1)+' 0';
    for(var i=1;i<all.length;i++){
      var p0=all[i-1], p1=all[i], t=(i%2)?1:-1, h=p1.y-p0.y;
      d+=' C'+(p0.x+t*A*a).toFixed(1)+' '+(p0.y+h*k).toFixed(1)+' '+(p1.x+t*A*a).toFixed(1)+' '+(p1.y-h*k).toFixed(1)+' '+p1.x.toFixed(1)+' '+p1.y.toFixed(1);
    }
    bg.setAttribute('d',d); fg.setAttribute('d',d);
    L=fg.getTotalLength(); fg.style.strokeDasharray=L+' '+L;
  }
  var cur=0, curAng=null, first=true, raf=0;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  function frame(){
    raf=0;
    var r=tl.getBoundingClientRect(), vh=window.innerHeight;
    if(r.width!==lw||r.height!==lh) build();
    var t=Math.max(0,Math.min(1,(vh*.6-r.top)/r.height));
    if(first||reduce){ cur=t; first=false; } else { cur+=(t-cur)*.05; if(Math.abs(t-cur)<.0005) cur=t; }
    if(L){
      fg.style.strokeDashoffset=L*(1-cur);
      var s_=cur*L, pt=fg.getPointAtLength(s_),
          q=fg.getPointAtLength(Math.min(L,s_+4)), o=fg.getPointAtLength(Math.max(0,s_-4));
      var ang=Math.atan2(q.y-o.y,q.x-o.x)*180/Math.PI;
      if(curAng===null||reduce) curAng=ang; else curAng+=(((ang-curAng+540)%360)-180)*.12;
      mark.style.left=pt.x+'px'; mark.style.top=pt.y+'px';
      mark.style.transform='translate(-50%,-50%) rotate('+curAng.toFixed(1)+'deg)';
      var py=pt.y;
      items.forEach(function(it,i){
        var n=nodes[i].getBoundingClientRect();
        it.classList.toggle('on', py >= (n.top+n.height/2-r.top)-6);
      });
    }
    if(cur!==t) raf=requestAnimationFrame(frame);
  }
  function update(){ ticking=false; if(!raf) raf=requestAnimationFrame(frame); }
  function req(){ if(!ticking){ ticking=true; requestAnimationFrame(update); } }
  window.addEventListener('scroll',req,{passive:true});
  window.addEventListener('resize',function(){lw=0;req();});
  window.addEventListener('load',function(){lw=0;req();});
  if(window.ResizeObserver){ new ResizeObserver(function(){lw=0;req();}).observe(tl); }
  document.addEventListener('click',function(e){ if(e.target.closest('[data-tab],[data-scroll]')){ setTimeout(function(){lw=0;req();},350); } });
  build(); update(); setTimeout(function(){lw=0;update();},300);
})();
