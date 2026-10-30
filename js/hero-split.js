(function(){
  function init(){
    var h=document.querySelector('.hero h1'); if(!h||h.dataset.split) return;
    h.dataset.split='1'; h.setAttribute('aria-label',h.textContent.trim());
    var i=0;
    [].slice.call(h.querySelectorAll('.h1-pre,.h1-main')).forEach(function(sp,k){
      var t=sp.textContent; sp.textContent=''; sp.setAttribute('aria-hidden','true');
      for(var c=0;c<t.length;c++){var e=document.createElement('span');e.className='ch';e.style.setProperty('--i',i++);e.textContent=t[c]===' '?'\u00a0':t[c];sp.appendChild(e);}
      if(k===0){var g=document.createElement('span');g.className='ch';g.style.setProperty('--i',i++);g.textContent='\u00a0';sp.appendChild(g);}
    });
    play();
  }
  function play(){var h=document.querySelector('.hero h1'); if(!h) return; h.classList.remove('go'); void h.offsetWidth; h.classList.add('go');}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.addEventListener('pageshow',function(e){ if(e.persisted) play(); });
  document.addEventListener('click',function(e){ if(e.target.closest('[data-tab="trang-chu"]')) setTimeout(play,150); });
})();
