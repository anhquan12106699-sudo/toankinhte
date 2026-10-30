/* Lịch sử ngành — stage cuộn: logo vô cực chạy từ trái sang phải theo scroll.
   Không phụ thuộc thư viện ngoài. */
(function(){
  'use strict';
  var root = document.getElementById('lich-su');
  if(!root) return;

  var track  = document.getElementById('lshTrack'),
      pin    = document.getElementById('lshPin'),
      board  = document.getElementById('lshBoard'),
      svg    = document.getElementById('lshPath'),
      bgPath = document.getElementById('lshPathBg'),
      fgPath = document.getElementById('lshPathFg'),
      orb    = document.getElementById('lshOrb'),
      ribbon = document.getElementById('lshRibbon'),
      bar    = document.getElementById('lshBar'),
      step   = document.getElementById('lshStep');

  if(!track || !pin || !board || !svg || !orb) return;

  var cards = [].slice.call(board.querySelectorAll('.lsh-card'));
  var dotsWrap = document.getElementById('lshDots');
  var cardX = [];
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var mqSmall  = window.matchMedia ? window.matchMedia('(max-width: 900px)') : null;

  var L = 0, W = 0, H = 0, cur = 0, target = 0, raf = 0;

  function staticMode(){
    return (mqReduce && mqReduce.matches) || (mqSmall && mqSmall.matches);
  }

  /* ---- dựng đường đi qua tâm từng mốc ---- */
  function build(){
    if(staticMode()){ L = 0; return; }
    var r = board.getBoundingClientRect();
    if(r.width < 40 || r.height < 40){ return; }
    W = r.width; H = r.height;
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    /* toạ độ layout (offset*) để không bị ảnh hưởng bởi transform lúc thẻ ẩn.
       Lưu ý: thẻ đặt left:var(--x) rồi translateX(-50%) nên offsetLeft CHÍNH LÀ tâm thẻ. */
    var mid = H * 0.5;
    var geo = cards.map(function(c){
      return {
        x: c.offsetLeft,
        edge: c.getAttribute('data-side') === 'up'
          ? c.offsetTop + c.offsetHeight
          : c.offsetTop,
        up: c.getAttribute('data-side') === 'up'
      };
    });
    if(!geo.length) return;

    cardX = geo.map(function(g){ return g.x; });

    /* dây nối: luôn ngắn hơn khoảng cách thẻ ↔ trục giữa để đường cong không cắt vào thẻ */
    var gapMin = geo.reduce(function(m, g){ return Math.min(m, Math.abs(mid - g.edge)); }, Infinity);
    var conn = Math.min(Math.max(10, gapMin * 0.32), Math.max(8, gapMin - 8));

    var pts = [{ x: Math.max(56, geo[0].x * 0.55), y: mid }];
    geo.forEach(function(g, i){
      g.y = g.up ? g.edge + conn : g.edge - conn;
      pts.push({ x: g.x, y: g.y });
      cards[i].style.setProperty('--conn', conn.toFixed(1) + 'px');
    });
    var last = geo[geo.length - 1].x;
    pts.push({ x: Math.min(W - 22, last + Math.max(70, last * 0.15)), y: mid });

    var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
    for(var k = 1; k < pts.length; k++){
      var a = pts[k - 1], b = pts[k], mx = (a.x + b.x) / 2;
      d += ' C' + mx.toFixed(1) + ' ' + a.y.toFixed(1) +
           ' ' + mx.toFixed(1) + ' ' + b.y.toFixed(1) +
           ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
    }
    bgPath.setAttribute('d', d);
    fgPath.setAttribute('d', d);

    if(dotsWrap){
      var NS = 'http://www.w3.org/2000/svg';
      while(dotsWrap.firstChild) dotsWrap.removeChild(dotsWrap.firstChild);
      for(var n = 1; n < pts.length - 1; n++){
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', pts[n].x.toFixed(1));
        c.setAttribute('cy', pts[n].y.toFixed(1));
        c.setAttribute('r', 5.5);
        c.dataset.i = n - 1;
        dotsWrap.appendChild(c);
      }
    }

    L = fgPath.getTotalLength();
    fgPath.style.strokeDasharray = L + ' ' + L;
    fgPath.style.strokeDashoffset = L;
    setP(cur);
  }

  /* ---- tiến độ cuộn trong track ---- */
  function progress(){
    var r = track.getBoundingClientRect();
    var dist = r.height - pin.offsetHeight;
    if(dist <= 0) return 0;
    return Math.max(0, Math.min(1, -r.top / dist));
  }

  /* ---- áp trạng thái theo p (0 → 1) ---- */
  function setP(p){
    var live = p > 0.015;
    root.classList.toggle('is-live', live);

    if(!L){
      if(bar) bar.style.width = '0%';
      return;
    }

    var pt = fgPath.getPointAtLength(p * L);

    orb.style.left = pt.x + 'px';
    orb.style.top  = pt.y + 'px';
    var scale = 1 + 1.1 * Math.max(0, 1 - p / 0.1);
    orb.style.transform = 'translate(-50%,-50%) scale(' + scale.toFixed(3) + ')';

    fgPath.style.strokeDashoffset = (L * (1 - p)).toFixed(2);
    if(bar) bar.style.width = (p * 100).toFixed(2) + '%';
    if(ribbon) ribbon.style.transform = 'translate3d(0,' + (p * 38 - 32).toFixed(2) + '%,0)';

    var reached = 0;
    cards.forEach(function(c, i){
      var on = pt.x >= cardX[i] - 10;
      if(on) reached = i + 1;
      c.classList.toggle('on', on);
      if(dotsWrap && dotsWrap.children[i]) dotsWrap.children[i].classList.toggle('on', on);
    });
    if(step) step.textContent = (reached < 10 ? '0' : '') + reached;
  }

  /* ---- vòng lặp làm mượt ---- */
  function tick(){
    raf = 0;
    target = progress();
    cur += (target - cur) * 0.2;
    if(Math.abs(target - cur) < 0.0015) cur = target;
    setP(cur);
    if(cur !== target) raf = requestAnimationFrame(tick);
  }
  function requestTick(){ if(!raf) raf = requestAnimationFrame(tick); }

  /* ---- làm mới khi kích thước đổi ---- */
  function refresh(){
    L = 0;
    build();
    cur = 0;
    target = progress();
    cur = target;
    setP(cur);
    requestTick();
  }

  window.addEventListener('scroll', requestTick, { passive: true });

  var resizeTimer = 0;
  function onResize(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refresh, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('load', function(){ setTimeout(refresh, 120); });

  if(window.ResizeObserver){
    new ResizeObserver(onResize).observe(board);
  }

  /* section bị ẩn/hiện theo tab -> dựng lại sau khi hiện */
  document.addEventListener('click', function(e){
    if(e.target.closest('[data-tab],[data-scroll]')){
      setTimeout(refresh, 420);
      setTimeout(refresh, 900);
    }
  });
  if(mqReduce && mqReduce.addEventListener){ mqReduce.addEventListener('change', refresh); }
  if(mqSmall && mqSmall.addEventListener){ mqSmall.addEventListener('change', refresh); }

  build();
  requestTick();
  setTimeout(refresh, 300);

  /* ---- video tư liệu ---- */
  var btn = root.querySelector('.lsh-media'),
      modal = document.getElementById('lshModal');
  if(btn && modal){
    var frame = modal.querySelector('iframe');
    function close(){
      modal.classList.remove('open');
      if(frame) frame.src = 'about:blank';
    }
    btn.addEventListener('click', function(){
      var id = (btn.getAttribute('data-yt') || '').trim();
      if(!id || !frame) return;
      frame.src = 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
      modal.classList.add('open');
    });
    modal.addEventListener('click', function(e){
      if(e.target === modal || e.target.classList.contains('lsh-x')) close();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && modal.classList.contains('open')) close();
    });
  }
})();
