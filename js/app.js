const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ---- Header scroll shrink ----
  const header = document.getElementById('siteHeader');
  const toTop = document.getElementById('toTop');

  // Đồng bộ chiều cao thật của header vào biến CSS, để menu trượt mobile
  // luôn bắt đầu ngay dưới header (không bị hở khoảng trắng phía trên).
  function syncMobileNavHeaderH(){
    document.documentElement.style.setProperty('--mnav-header-h', header.offsetHeight + 'px');
    // Header đã cố định (fixed): giữ khoảng đệm cố định = chiều cao header lúc chưa cuộn,
    // để nội dung không bị nhảy khi header thu gọn.
    if(window.scrollY <= 30){
      document.documentElement.style.setProperty('--hdr-space', header.offsetHeight + 'px');
    }
  }
  syncMobileNavHeaderH();
  if('ResizeObserver' in window){
    new ResizeObserver(syncMobileNavHeaderH).observe(header);
  } else {
    window.addEventListener('resize', syncMobileNavHeaderH);
  }

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
    toTop.classList.toggle('show', window.scrollY > 500);
  });
  toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

  // ---- Hero slider: ảnh nền toàn khung, chuyển ảnh mờ dần (crossfade) ----
  (function(){
    const slider = document.getElementById('heroSlider');
    const track = document.getElementById('heroSliderTrack');
    if(!slider || !track) return;
    const dotsWrap = document.getElementById('heroSliderDots');
    const prevBtn = document.getElementById('heroSliderPrev');
    const nextBtn = document.getElementById('heroSliderNext');
    const slides = Array.from(track.children);
    const count = slides.length;
    if(!count) return;

    let index = 0, autoplayTimer = null;

    slides.forEach((el, i) => {
      el.classList.toggle('is-active', i === 0);
      el.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero-slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Ảnh ' + (i + 1));
      dot.addEventListener('click', () => { show(i); resetAutoplay(); });
      dotsWrap.appendChild(dot);
    });
    const dots = dotsWrap.querySelectorAll('.hero-slider-dot');

    function show(i){
      index = (i + count) % count;
      slides.forEach((el, k) => {
        const on = k === index;
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dots.forEach((d, k) => d.classList.toggle('active', k === index));
    }
    const next = () => show(index + 1);
    const prev = () => show(index - 1);

    prevBtn.addEventListener('click', () => { prev(); resetAutoplay(); });
    nextBtn.addEventListener('click', () => { next(); resetAutoplay(); });

    // vuốt trái/phải trên điện thoại
    let startX = 0, dragging = false;
    slider.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX; });
    slider.addEventListener('pointerup', (e) => {
      if(!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      if(dx > 40){ prev(); resetAutoplay(); }
      else if(dx < -40){ next(); resetAutoplay(); }
    });
    slider.addEventListener('pointerleave', () => { dragging = false; });

    function startAutoplay(){
      clearInterval(autoplayTimer);
      if (REDUCED_MOTION) return;
      autoplayTimer = setInterval(() => { if (!document.hidden) next(); }, 5500);
    }
    function resetAutoplay(){ startAutoplay(); }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearInterval(autoplayTimer); else resetAutoplay();
    });
    startAutoplay();
  })();
  const burger = document.getElementById('burgerBtn');
  const navLinks = document.getElementById('navLinks');
  const navBackdrop = document.getElementById('navBackdrop');

  function openMobileNav(){
    if(typeof syncMobileNavHeaderH === 'function') syncMobileNavHeaderH();
    navLinks.classList.add('open');
    if(navBackdrop){
      navBackdrop.classList.add('is-visible');
      navBackdrop.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';
  }
  function closeMobileNav(){
    navLinks.classList.remove('open');
    // thu các dropdown đang mở
    document.querySelectorAll('.navlinks .has-dropdown.open').forEach(i => i.classList.remove('open'));
    if(navBackdrop){
      navBackdrop.classList.remove('is-visible');
      navBackdrop.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }
  function toggleMobileNav(){
    if(navLinks.classList.contains('open')) closeMobileNav();
    else openMobileNav();
  }

  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileNav();
  });

  // Bấm vào khoảng trống (lớp phủ) → đóng menu, trả về màn chính
  if(navBackdrop){
    navBackdrop.addEventListener('click', () => closeMobileNav());
  }

  // Bấm ra ngoài panel menu cũng đóng
  document.addEventListener('click', (e) => {
    if(!navLinks.classList.contains('open')) return;
    if(e.target.closest('#navLinks') || e.target.closest('#burgerBtn') || e.target.closest('#siteHeader .brand')) return;
    // nếu click vào backdrop đã xử lý ở trên
    if(e.target === navBackdrop) return;
    // click vùng nội dung phía dưới menu
    if(!e.target.closest('#siteHeader')) closeMobileNav();
  });

  // Chỉ đóng menu burger khi bấm link thường / mục con — KHÔNG đóng khi bấm mục cha (để xổ mục con)
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if(a.classList.contains('nav-parent')) return;
    closeMobileNav();
  }));

  // ---- Nav arrows (cuộn thanh menu sang ngang) ----
  const navArrowLeft = document.getElementById('navArrowLeft');
  const navArrowRight = document.getElementById('navArrowRight');
  if(navArrowLeft && navArrowRight && navLinks){
    const scrollAmount = () => Math.max(navLinks.clientWidth * 0.6, 160);
    navArrowLeft.addEventListener('click', () => navLinks.scrollBy({left: -scrollAmount(), behavior:'smooth'}));
    navArrowRight.addEventListener('click', () => navLinks.scrollBy({left: scrollAmount(), behavior:'smooth'}));

    const updateNavArrows = () => {
      const max = navLinks.scrollWidth - navLinks.clientWidth;
      navArrowLeft.disabled = navLinks.scrollLeft <= 4;
      navArrowRight.disabled = navLinks.scrollLeft >= max - 4;
    };
    navLinks.addEventListener('scroll', updateNavArrows);
    window.addEventListener('resize', updateNavArrows);
    updateNavArrows();
  }

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.15});
  revealEls.forEach(el => io.observe(el));

  // ---- Hiệu ứng dải xanh + chữ: chạy lại mỗi lần tải / vào tab ----
  function replayGreenHead(el){
    if(!el) return;
    el.classList.remove('animating');
    // đảm bảo không bị ẩn bởi .reveal
    el.classList.add('in');
    // force reflow để animation restart
    void el.offsetWidth;
    el.classList.add('animating');
  }
  function replayVisibleGreenHeads(){
    const heads = document.querySelectorAll('.section-head-left, .sect:not(.sect-dark) > .container > .sect-head, .identity-wrap');
    heads.forEach(head => {
      const section = head.closest('section') || head.parentElement;
      if(!section) return;
      const style = window.getComputedStyle(section);
      if(style.display === 'none' || style.visibility === 'hidden') return;
      replayGreenHead(head);
    });
  }
  window.__replayGreenHeads = replayVisibleGreenHeads;
  // chạy khi DOM sẵn sàng / load
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      requestAnimationFrame(() => setTimeout(replayVisibleGreenHeads, 40));
    });
  } else {
    requestAnimationFrame(() => setTimeout(replayVisibleGreenHeads, 40));
  }
  window.addEventListener('pageshow', (e) => {
    // bfcache / reload
    requestAnimationFrame(() => setTimeout(replayVisibleGreenHeads, 40));
  });

  // ---- Đếm số cuộn (hero stats) ----
  function animateCounter(el){
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const pad = parseInt(el.getAttribute('data-pad') || '0', 10);
    const duration = 1600;
    const start = performance.now();
    function tick(now){
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(target * eased);
      el.textContent = (pad ? String(value).padStart(pad,'0') : value) + suffix;
      if(progress < 1) requestAnimationFrame(tick);
      else el.textContent = (pad ? String(target).padStart(pad,'0') : target) + suffix;
    }
    requestAnimationFrame(tick);
  }
  const counters = document.querySelectorAll('.counter');
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        animateCounter(entry.target);
        counterIO.unobserve(entry.target);
      }
    });
  }, {threshold:.5});
  counters.forEach(c => counterIO.observe(c));

  // (Đã bỏ scroll-spy: menu đang chuyển theo tab và được tô màu bởi setActiveNav(); scroll-spy cũ gỡ hết active rồi chỉ sáng mục con nên làm mất màu mục cha)

  // ---- Slideshow áo ngành (tự động trượt mỗi 3 giây + mũi tên / vuốt) ----
  const uCarousel = document.getElementById('uniformCarousel');
  const uDotsWrap = document.getElementById('uniformDots');
  const uWrap = uCarousel && uCarousel.closest('.uniform-carousel-wrap');
  const uPrev = document.getElementById('uniformPrev');
  const uNext = document.getElementById('uniformNext');
  if(uCarousel && uDotsWrap){
    const uSlides = uCarousel.querySelectorAll('.uniform-slide');
    let uIndex = 0;
    let uTimer = null;

    uSlides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'uniform-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Ảnh ' + (i + 1));
      dot.addEventListener('click', () => { goToSlide(i); resetTimer(); });
      uDotsWrap.appendChild(dot);
    });
    const uDots = uDotsWrap.querySelectorAll('.uniform-dot');

    function goToSlide(i){
      uIndex = (i + uSlides.length) % uSlides.length;
      uCarousel.style.transform = 'translateX(-' + (uIndex * 100) + '%)';
      uDots.forEach((d, di) => d.classList.toggle('active', di === uIndex));
    }
    function nextSlide(){ goToSlide(uIndex + 1); }
    function prevSlide(){ goToSlide(uIndex - 1); }
    function resetTimer(){
      if(uTimer) clearInterval(uTimer);
      if (!REDUCED_MOTION) uTimer = setInterval(nextSlide, 3000);
    }
    if(uPrev) uPrev.addEventListener('click', () => { prevSlide(); resetTimer(); });
    if(uNext) uNext.addEventListener('click', () => { nextSlide(); resetTimer(); });

    let startX = 0, dragging = false;
    const threshold = 40;
    const swipeEl = uWrap || uCarousel;
    swipeEl.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX; });
    swipeEl.addEventListener('pointerup', (e) => {
      if(!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      if(dx > threshold){ prevSlide(); resetTimer(); }
      else if(dx < -threshold){ nextSlide(); resetTimer(); }
    });
    swipeEl.addEventListener('pointerleave', () => { dragging = false; });
    swipeEl.addEventListener('mouseenter', () => { if(uTimer) clearInterval(uTimer); });
    swipeEl.addEventListener('mouseleave', () => { resetTimer(); });

    resetTimer();
  }

  // ---- Accordion (chương trình đào tạo) ----
  document.querySelectorAll('.acc-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const panel = item.querySelector('.acc-panel');
      const wasOpen = item.classList.contains('open');
      // close siblings
      item.parentElement.querySelectorAll('.acc-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.acc-panel').style.maxHeight = null;
      });
      if(!wasOpen){
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
  // init open first accordion panel height
  window.addEventListener('load', () => {
    const openItem = document.querySelector('.acc-item.open .acc-panel');
    if(openItem) openItem.style.maxHeight = openItem.scrollHeight + 'px';
  });

  // ---- Nav dropdown: click thu/xổ (mũi tên to trên mobile) ----
  function setDropdownOpen(item, open){
    item.classList.toggle('open', !!open);
  }
  document.querySelectorAll('.navlinks .has-dropdown').forEach(item => {
    const parent = item.querySelector('.nav-parent');
    if(!parent) return;

    parent.addEventListener('click', (e) => {
      const isMobile = window.matchMedia('(max-width:1100px)').matches;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.navlinks .has-dropdown.open').forEach(i => {
        if(i !== item) setDropdownOpen(i, false);
      });
      setDropdownOpen(item, !wasOpen);
      if(isMobile) parent.dataset.skipTab = '1';
    }, true); // capture: chạy trước handler đóng burger / chuyển tab
  });
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.navlinks')){
      document.querySelectorAll('.navlinks .has-dropdown.open').forEach(i => setDropdownOpen(i, false));
    }
  });
  // Desktop: chọn mục con thì đóng panel ngay (dù chuột còn đang đè lên), mở lại khi chuột rời rồi vào lại.
  // Dùng ủy quyền sự kiện ở document (capture) để không bị mất khi trang khác xử lý/chặn click.
  (function(){
    const nl = () => document.getElementById('navLinks');
    const closeAll = () => document.querySelectorAll('.navlinks .has-dropdown.open').forEach(i => setDropdownOpen(i, false));
    document.addEventListener('click', (e) => {
      const el = nl();
      if(el && e.target.closest && e.target.closest('#navLinks .dropdown a')){
        el.classList.add('nav-suppress');
        closeAll();
      }
    }, true);
    // Chuột ra khỏi vùng menu (kể cả panel) thì gỡ trạng thái ép đóng
    document.addEventListener('mousemove', (e) => {
      const el = nl();
      if(el && el.classList.contains('nav-suppress') && !e.target.closest('#navLinks')) el.classList.remove('nav-suppress');
    }, {passive:true});
    // Cuộn trang: đóng panel đang mở; nếu chuột vẫn đứng trên menu thì ép đóng cho tới khi chuột di chuyển ra
    window.addEventListener('scroll', () => {
      const el = nl(); if(!el) return;
      closeAll();
      if(el.querySelector('.has-dropdown:hover')) el.classList.add('nav-suppress');
    }, {passive:true});
  })();
  // Khi chọn mục con trên mobile thì đóng menu burger
  document.querySelectorAll('.navlinks .dropdown a').forEach(a => {
    a.addEventListener('click', () => {
      document.querySelectorAll('.navlinks .has-dropdown.open').forEach(i => setDropdownOpen(i, false));
      if(typeof closeMobileNav === 'function') closeMobileNav();
      else {
        const nav = document.getElementById('navLinks');
        if(nav) nav.classList.remove('open');
      }
    });
  });






  // ---- Giới thiệu: chuyển panel qua dropdown menu ----
  (function(){
    const panels = document.querySelectorAll('[data-intro-panel]');

    function activateIntroTab(id){
      if(!id) id = 'chung';
      panels.forEach(panel => {
        const on = panel.getAttribute('data-intro-panel') === id;
        panel.classList.toggle('intro-active', on);
      });
      // highlight item trong dropdown (KHÔNG đụng nav-parent trên thanh)
      document.querySelectorAll('.navlinks .has-dropdown .dropdown [data-scroll]').forEach(a => {
        if(!a.closest('.has-dropdown')) return;
        const parent = a.closest('.has-dropdown').querySelector('.nav-parent');
        if(!parent || parent.getAttribute('data-tab') !== 'gioi-thieu') return;
        const s = a.getAttribute('data-scroll');
        a.classList.toggle('active', s === id || (id === 'chung' && (s === 'chung' || s === 'gioi-thieu')));
      });
    }

    window.__activateIntroTab = activateIntroTab;

    const hash = (location.hash || '').replace(/^#/, '');
    if(hash === 'lich-su' || hash === 'nhan-dien'){
      activateIntroTab(hash);
    } else if(hash === 'gioi-thieu' || hash === 'chung'){
      activateIntroTab('chung');
    } else {
      activateIntroTab('chung');
    }
  })();

  // ---- Tin tức: chuyển panel qua dropdown (Thông báo / Tin ngành) ----
  (function(){
    const panels = document.querySelectorAll('[data-news-panel]');

    function activateNewsTab(id){
      if(!id) id = 'thong-bao';
      panels.forEach(panel => {
        panel.classList.toggle('active', panel.getAttribute('data-news-panel') === id);
      });
      // Đổi tiêu đề banner theo mục đang xem
      const NEWS_HEAD = {
        'thong-bao': { eyebrow: 'Tin tức', title: 'Thông báo', lead: 'Các thông báo chính thức từ ngành Toán Kinh tế – Học viện Tài chính.' },
        'tin-nganh': { eyebrow: 'Tin tức', title: 'Tin ngành Toán kinh tế', lead: 'Tin tức và hoạt động mới nhất của ngành Toán Kinh tế – Học viện Tài chính.' }
      };
      const hd = NEWS_HEAD[id] || NEWS_HEAD['thong-bao'];
      const e1 = document.getElementById('newsEyebrow'), e2 = document.getElementById('newsTitle'), e3 = document.getElementById('newsLead');
      if (e1) e1.textContent = hd.eyebrow;
      if (e2) e2.textContent = hd.title;
      if (e3) e3.textContent = hd.lead;
      // highlight dropdown items (chỉ trong .dropdown, không tô nav-parent)
      document.querySelectorAll('.navlinks .has-dropdown .dropdown a[data-tab="tin-tuc"][data-scroll]').forEach(a => {
        a.classList.toggle('active', a.getAttribute('data-scroll') === id);
      });
    }

    window.__activateNewsTab = activateNewsTab;

    const hash = (location.hash || '').replace(/^#/, '');
    if(hash === 'tin-nganh' || hash === 'thong-bao'){
      activateNewsTab(hash);
    } else {
      activateNewsTab('thong-bao');
    }
  })();

  // ---- Tab navigation: chuyển tab khi click menu ----
  (function(){
    const VALID = ['trang-chu','gioi-thieu','tin-tuc','tuyen-sinh','hoi-thao','thu-vien','ctdt-toan-tc','ctdt-thong-ke','tat-ca-tin'];

    function setActiveNav(tab){
      // Gỡ hết active trên toàn bộ link trong nav
      document.querySelectorAll('#navLinks a').forEach(el => el.classList.remove('active'));
      // Chỉ gắn active cho đúng 1 mục cấp 1 trên thanh
      document.querySelectorAll('#navLinks > a.nav-item[data-tab]').forEach(a => {
        if (a.getAttribute('data-tab') === tab) a.classList.add('active');
      });
      document.querySelectorAll('#navLinks > .has-dropdown > .nav-parent[data-tab]').forEach(parent => {
        const pTab = parent.getAttribute('data-tab');
        if (pTab === tab) parent.classList.add('active');
        else if ((tab === 'ctdt-toan-tc' || tab === 'ctdt-thong-ke') && (pTab === 'ctdt-toan-tc' || pTab === 'ctdt-thong-ke')) {
          parent.classList.add('active');
        }
      });
      document.querySelectorAll('#navLinks .dropdown a[data-tab]').forEach(a => {
        if (a.getAttribute('data-tab') === tab) a.classList.add('active');
      });
    }

    // ===== SEO động: tiêu đề / mô tả / og / canonical theo trang & bài =====
    const SITE = 'Ngành Toán Kinh Tế - Học viện Tài chính';
    const SEO0 = {
      desc: (document.querySelector('meta[name="description"]') || {}).content || '',
      ogDesc: (document.querySelector('meta[property="og:description"]') || {}).content || '',
      img: (document.getElementById('seoOgImage') || {}).content || ''
    };
    const TAB_TITLE = {
      'gioi-thieu':'Giới thiệu','tin-tuc':'Tin tức','tuyen-sinh':'Tuyển sinh','hoi-thao':'Hội thảo - Tọa đàm',
      'thu-vien':'Thư viện','tat-ca-tin':'Tất cả tin',
      'ctdt-toan-tc':'CTĐT Toán tài chính','ctdt-thong-ke':'CTĐT Thống kê ứng dụng trong tài chính'
    };
    function setMeta(sel, attr, val){ const e = document.querySelector(sel); if (e) e.setAttribute(attr, val); }
    function setSeo(o){
      const url = o.url || (location.origin + location.pathname);
      document.title = o.title;
      setMeta('meta[name="description"]','content',o.desc);
      setMeta('meta[property="og:title"]','content',o.title);
      setMeta('meta[property="og:description"]','content',o.desc);
      setMeta('meta[property="og:type"]','content',o.type || 'website');
      setMeta('meta[name="twitter:title"]','content',o.title);
      setMeta('meta[name="twitter:description"]','content',o.desc);
      setMeta('#seoOgUrl','content',url);
      setMeta('#seoCanonical','href',url);
      setMeta('#seoOgImage','content',o.img || SEO0.img);
      setMeta('#seoTwImage','content',o.img || SEO0.img);
      let ld = document.getElementById('seoArticleLd');
      if (o.ld) {
        if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'seoArticleLd'; document.head.appendChild(ld); }
        ld.textContent = JSON.stringify(o.ld);
      } else if (ld) ld.remove();
    }
    window.__seoPage = function(tab){
      const t = TAB_TITLE[tab];
      setSeo({ title: t ? t + ' — ' + SITE : SITE, desc: SEO0.desc });
    };
    window.__seoPost = function(it, postId){
      const plain = (h) => String(h || '').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
      let desc = plain(it.content) || plain(it.detail);
      if (desc.length > 160) desc = desc.slice(0,157).replace(/\s+\S*$/,'') + '…';
      desc = desc || SEO0.desc;
      const title = (it.title || 'Bài viết') + ' — ' + SITE;
      const url = location.origin + location.pathname + '?post=' + encodeURIComponent(postId);
      const img = (typeof it.image === 'string' && /^https?:\/\//i.test(it.image)) ? it.image : '';
      const d = new Date(it.time);
      const ld = { '@context':'https://schema.org','@type':'Article','headline': it.title || '',
        'description': desc, 'inLanguage':'vi', 'mainEntityOfPage': url,
        'author': { '@type':'Organization','name': SITE }, 'publisher': { '@type':'Organization','name': SITE } };
      if (!isNaN(d.getTime())) ld.datePublished = d.toISOString();
      if (img) ld.image = img;
      setSeo({ title, desc, url, img, type:'article', ld });
    };

    // ===== Cột "Tin cùng chuyên mục" + nút chia sẻ =====
    window.__renderRelated = function(items, it, postId){
      const box = document.getElementById('apRelated'), aside = document.getElementById('apAside');
      if (!box || !aside) return;
      // Bài thuộc "Thư viện": không hiện tin cùng chuyên mục, để rộng chỗ cho phần xem tài liệu
      const layout = document.getElementById('apLayout');
      const isLib = String(it.category || '').trim() === 'Thư viện';
      if (layout) layout.classList.toggle('ap-lib', isLib);
      if (isLib) { aside.style.display = 'none'; box.innerHTML = ''; return; }
      const esc = (t) => String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const base = location.pathname.split('?')[0] || './';
      const ts = (x) => { const d = new Date(x.time); return isNaN(d.getTime()) ? 0 : d.getTime(); };
      const cat = String(it.category || '').trim();
      // Trạng thái có thiết kế: icon + câu gợi ý (+ nút thử lại khi lỗi)
      const icoList = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5h16"/><path d="M4 12h10.5"/><path d="M4 17.5h7"/></svg>';
      const icoWarn = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.4 20.6 19H3.4z"/><path d="M12 9.4v4.2"/><path d="M12 16.5h.01"/></svg>';
      const relEmpty = function(ico, title, text, isErr){
        return '<div class="ap-rel-empty is-state'+(isErr?' is-error':'')+'"'+(isErr?' role="alert"':'')+'>'+ico+
          '<strong>'+title+'</strong><span class="ap-rel-empty-txt">'+text+'</span>'+
          (isErr?'<button type="button" class="ap-rel-retry">Thử lại</button>':'')+'</div>';
      };
      aside.style.display = 'block';
      box.innerHTML = '<div class="ap-rel-empty">Đang tải tin cùng chuyên mục…</div>';
      // Trang bài chỉ tải 1 bài => phải lấy danh sách đầy đủ để tìm tin cùng chuyên mục
      const src = (typeof window.__loadNewsFeed === 'function') ? window.__loadNewsFeed() : Promise.resolve(items || []);
      src.then(function(all){
        const rel = (all || []).filter(x => String(x.category || '').trim() === cat && String(x.id || x.time || '') !== String(postId))
          .sort((a, b) => ts(b) - ts(a)).slice(0, 5);
        if (!rel.length) {
          box.innerHTML = relEmpty(icoList, 'Chưa có bài khác trong chuyên mục', 'Các bài viết mới cùng chuyên mục sẽ xuất hiện tại đây.', false);
          return;
        }
        box.innerHTML = rel.map(x => {
          const id = String(x.id || x.time || '');
          const d = ts(x) ? new Date(ts(x)) : null;
          const ds = d ? String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear() : '';
          return '<a class="ap-rel" href="' + esc(base + '?post=' + encodeURIComponent(id)) + '" data-relid="' + esc(id) + '">' +
                 '<div class="ap-rel-img">' + esc(x.category || '') + '</div>' +
                 '<div class="ap-rel-body"><div class="ap-rel-t">' + esc(x.title || '') + '</div>' + (ds ? '<div class="ap-rel-d">' + ds + '</div>' : '') + '</div></a>';
        }).join('');
        // Nạp ảnh bìa sau cho nhẹ
        if (typeof window.__getNewsCovers === 'function') {
          window.__getNewsCovers(rel.map(x => String(x.id || x.time || ''))).then(function(map){
            box.querySelectorAll('a.ap-rel').forEach(function(a){
              const u = map[a.getAttribute('data-relid')];
              const slot = a.querySelector('.ap-rel-img');
              if (u && slot) { const im = document.createElement('img'); im.className = 'ap-rel-img'; im.alt = ''; im.loading = 'lazy'; im.src = u; slot.replaceWith(im); }
            });
          });
        }
      }).catch(function(){
        box.innerHTML = relEmpty(icoWarn, 'Không tải được tin cùng chuyên mục', 'Hãy kiểm tra kết nối mạng rồi thử lại, hoặc xem toàn bộ tin ở mục Tin tức.', true);
        const rb = box.querySelector('.ap-rel-retry');
        if (rb) rb.addEventListener('click', function(){
          rb.disabled = true;
          window.__renderRelated(items, it, postId);
        });
      });
    };

    window.__captureView = function(){
      const m = document.body.className.match(/(?:^|\s)tab-([\w-]+)/);
      return { view: true, tab: m ? m[1] : 'trang-chu',
               hash: (location.hash || '').replace(/^#/, ''), scrollY: window.scrollY || 0 };
    };

    function switchTab(tab, scrollId, opts){
      if(!VALID.includes(tab)) return;
      opts = opts || {};
      // chụp trạng thái TRƯỚC khi đổi tab (để Back quay về đúng trang cũ)
      const prevView = opts.push ? window.__captureView() : null;
      // Thoát chế độ xem bài viết khi user chuyển mục menu
      // (không thoát khi init trang bài gọi switchTab với keepArticle:true)
      const stayArticle = !!opts.keepArticle;
      if (document.body.classList.contains('article-mode') && !stayArticle) {
        document.body.classList.remove('article-mode');
        const apState = document.getElementById('apState');
        const apContent = document.getElementById('apContent');
        if (apState) apState.style.display = 'none';
        if (apContent) apContent.style.display = 'none';
        // Xóa ?post=... khỏi URL, giữ hash mục đích
        try {
          const cleanPath = location.pathname.split('?')[0] || location.pathname;
          const hash = '#' + (scrollId || tab);
          if (history.replaceState) history.replaceState(null, '', cleanPath + hash);
        } catch (e) {}
      }
      const keepArtClass = stayArticle || (document.body.classList.contains('article-mode') && stayArticle);
      // Khi đang xem bài (keepArticle): chỉ gắn active nav, KHÔNG scroll / không đổi hash (tránh nhảy loạn)
      if (stayArticle) {
        document.body.classList.add('article-mode');
        // giữ article-mode + tab class
        document.body.className = document.body.className
          .split(/\s+/)
          .filter(c => c && !c.startsWith('tab-') && c !== 'article-mode')
          .concat(['tab-' + tab, 'article-mode'])
          .join(' ');
        setActiveNav(tab);
        return; // dừng tại đây — không scrollIntoView, không replaceState
      }
      document.body.className = document.body.className
        .split(/\s+/)
        .filter(c => c && !c.startsWith('tab-') && c !== 'article-mode')
        .concat(['tab-' + tab])
        .join(' ');
      setActiveNav(tab);
      // close mobile menu & dropdowns
      if(typeof closeMobileNav === 'function') closeMobileNav();
      else {
        const nav = document.getElementById('navLinks');
        if(nav) nav.classList.remove('open');
        document.querySelectorAll('.navlinks .has-dropdown.open').forEach(i => i.classList.remove('open'));
      }

      // Replay hiệu ứng dải xanh khi vào lại tab
      requestAnimationFrame(() => {
        setTimeout(() => {
          if(typeof window.__replayGreenHeads === 'function') window.__replayGreenHeads();
        }, 30);
      });

      // intro sub-tab
      if(tab === 'gioi-thieu'){
        const introId = (scrollId === 'lich-su' || scrollId === 'nhan-dien') ? scrollId
          : (scrollId === 'gioi-thieu' || scrollId === 'chung' || !scrollId) ? 'chung' : 'chung';
        if(typeof window.__activateIntroTab === 'function'){
          window.__activateIntroTab(introId);
        }
      }
      // news sub-tab
      if(tab === 'tin-tuc'){
        const newsId = (scrollId === 'tin-nganh') ? 'tin-nganh' : 'thong-bao';
        if(typeof window.__activateNewsTab === 'function'){
          window.__activateNewsTab(newsId);
        }
      }

      if (!stayArticle) window.__seoPage(tab);
      // Khôi phục khi bấm Back: không cuộn, không đổi hash
      if (opts.noScroll) return;

      // scroll
      requestAnimationFrame(() => {
        if(tab === 'gioi-thieu'){
          // map scrollId -> section element
          const mapId = {chung:'gioi-thieu', 'gioi-thieu':'gioi-thieu', 'lich-su':'lich-su', 'nhan-dien':'nhan-dien'};
          const sid = mapId[scrollId] || 'gioi-thieu';
          const el = document.getElementById(sid);
          if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); return; }
          window.scrollTo({top:0, behavior:'smooth'}); return;
        }
        if(tab === 'tin-tuc'){
          const sec = document.getElementById('tin-tuc');
          if(sec){ sec.scrollIntoView({behavior:'smooth', block:'start'}); return; }
        }
        if(tab === 'trang-chu'){
          if(scrollId){
            const el = document.getElementById(scrollId);
            if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); return; }
          }
          window.scrollTo({top:0, behavior:'smooth'}); return;
        }
        if(scrollId){
          const el = document.getElementById(scrollId);
          if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); return; }
        }
        window.scrollTo({top:0, behavior:'smooth'});
      });

      // update hash without jump
      const newHash = '#' + (scrollId || tab);
      if (opts.push && history.pushState && location.hash !== newHash) {
        // lưu vị trí hiện tại vào mục lịch sử cũ rồi thêm mục mới -> nút Back dùng được
        try { history.replaceState(prevView, '', location.href); } catch(e){}
        history.pushState(null, '', newHash);
      } else if(history.replaceState){
        history.replaceState(null, '', newHash);
      }
    }

    // ---- Nút "Khám phá ngành học": xổ/ẩn danh sách chuyên ngành ----
    (function(){
      const btn = document.getElementById('heroExploreBtn');
      const panel = document.getElementById('heroSub');
      if(!btn || !panel) return;
      function setOpen(open){
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.hidden = !open;
      }
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        setOpen(btn.getAttribute('aria-expanded') !== 'true');
      });
      document.addEventListener('click', function(e){
        if(panel.hidden) return;
        if(!panel.contains(e.target) && !btn.contains(e.target)) setOpen(false);
      });
      document.addEventListener('keydown', function(e){
        if(e.key === 'Escape' && !panel.hidden){ setOpen(false); btn.focus(); }
      });
      panel.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setOpen(false); }); });
    })();

    // Click handlers: chỉ gắn vào thẻ <a data-tab> (tránh bubble từ wrapper div)
    document.querySelectorAll('a[data-tab]').forEach(el => {
      el.addEventListener('click', (e) => {
        if(el.dataset.skipTab === '1'){
          delete el.dataset.skipTab;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        // Mobile: mục cha có dropdown chỉ xổ, không chuyển tab
        if(el.classList.contains('nav-parent') && window.matchMedia('(max-width:1100px)').matches){
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const tab = el.getAttribute('data-tab');
        if(!tab || !VALID.includes(tab)) return;
        e.preventDefault();
        e.stopPropagation();
        const scrollId = el.getAttribute('data-scroll') || null;
        switchTab(tab, scrollId, { push: true });
      });
    });

    // Footer links that point to sections
    document.querySelectorAll('footer a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = (a.getAttribute('href') || '').slice(1);
        if(!id) return;
        // map section id -> tab
        const map = {
          'gioi-thieu':'gioi-thieu','lich-su':'gioi-thieu','nhan-dien':'gioi-thieu','chung':'gioi-thieu',
          'phat-trien':'trang-chu','dao-tao':'trang-chu','ao-nganh':'trang-chu',
          'tuyen-sinh':'tuyen-sinh','tin-tuc':'tin-tuc','hoi-thao':'hoi-thao','thu-vien':'thu-vien',
          'ctdt-toan-tc':'ctdt-toan-tc','ctdt-thong-ke':'ctdt-thong-ke','ctdt':'ctdt-toan-tc',
          'thong-bao':'tin-tuc','tin-nganh':'tin-tuc','tat-ca-tin':'tat-ca-tin','hero':'trang-chu','trang-chu':'trang-chu'
        };
        const tab = map[id] || 'trang-chu';
        e.preventDefault();
        switchTab(tab, id, { push: true });
      });
    });

    // On load: respect hash
    function initFromHash(){
      if (window.__restoringView) return; // đang quay lại từ bài viết -> không nhảy tab
      // Đang xem bài viết (?post=...) → không nhảy tab theo hash
      if (new URLSearchParams(location.search).get('post') || document.body.classList.contains('article-mode')) {
        return;
      }
      const hash = (location.hash || '').replace(/^#/, '');
      if(!hash){ switchTab('trang-chu', null, { noScroll: true }); return; }
      const map = {
        'gioi-thieu':'gioi-thieu','lich-su':'gioi-thieu','nhan-dien':'gioi-thieu','chung':'gioi-thieu',
        'phat-trien':'trang-chu','dao-tao':'trang-chu','ao-nganh':'trang-chu',
        'tuyen-sinh':'tuyen-sinh','tin-tuc':'tin-tuc','hoi-thao':'hoi-thao','thu-vien':'thu-vien',
        'ctdt-toan-tc':'ctdt-toan-tc','ctdt-thong-ke':'ctdt-thong-ke','ctdt':'ctdt-toan-tc',
        'thong-bao':'tin-tuc','tin-nganh':'tin-tuc','tat-ca-tin':'tat-ca-tin','hero':'trang-chu','trang-chu':'trang-chu'
      };
      const tab = map[hash] || (VALID.includes(hash) ? hash : 'trang-chu');
      switchTab(tab, map[hash] ? hash : null);
    }
    // Chỉ init hash khi KHÔNG phải trang bài viết
    if (!new URLSearchParams(location.search).get('post')) {
      initFromHash();
    }
    window.addEventListener('hashchange', initFromHash);
    window.__initFromHash = initFromHash;

    // expose for debug
    window.__switchTab = switchTab;
  })();

  // ===== Thông báo lỗi thân thiện (mạng / không tìm thấy) =====
  function uxIsOffline(err){
    return (typeof navigator !== 'undefined' && navigator.onLine === false) || !(err && err.message === 'not found');
  }
  // Khung chờ (skeleton) thay cho dòng chữ "Đang tải bài viết..."
  window.__apSkeletonHtml = function(){
    return '<div class="ap-skel" role="status" aria-busy="true" aria-label="Đang tải bài viết">' +
      '<i style="width:28%"></i><i class="t"></i><i class="t" style="width:72%"></i>' +
      '<i style="margin-top:20px"></i><i></i><i style="width:90%"></i><i></i><i style="width:60%"></i></div>';
  };
  function uxShowArticleError(err){
    var el = document.getElementById('apState'); if (!el) return;
    el.style.display = 'block';
    var ico = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.4 20.6 19H3.4z"/><path d="M12 9.4v4.2"/><path d="M12 16.5h.01"/></svg>';
    if (err && err.message === 'not found') {
      el.innerHTML = '<div class="ap-err" role="alert">'+
        '<div class="ap-err-ico">'+ico+'</div>'+
        '<strong>Không tìm thấy bài viết này</strong>'+
        '<p>Bài viết có thể đã bị gỡ hoặc đường liên kết không đúng.</p>'+
        '<div class="ap-err-actions"><a href="./">← Về trang chủ</a></div></div>';
      return;
    }
    var off = (typeof navigator !== 'undefined' && navigator.onLine === false);
    el.innerHTML = '<div class="ap-err" role="alert">'+
      '<div class="ap-err-ico">'+ico+'</div>'+
      '<strong>'+(off ? 'Bạn đang không có kết nối mạng' : 'Không tải được bài viết lúc này')+'</strong>'+
      '<p>'+(off ? 'Hãy kiểm tra Wi‑Fi/4G rồi thử lại để đọc bài.' : 'Máy chủ chưa phản hồi. Vui lòng thử lại sau ít phút.')+'</p>'+
      '<div class="ap-err-actions"><button type="button" id="apRetryBtn">Thử lại</button><a href="./">← Về trang chủ</a></div></div>';
    var b = document.getElementById('apRetryBtn'); if (b) b.addEventListener('click', function(){ location.reload(); });
  }

  function uxWordFailHtml(){
    return '<div class="ux-notice">Không xem trước được nội dung file Word này (có thể do định dạng phức tạp hoặc mạng chậm). ' +
      'Bạn vẫn có thể tải file gốc về máy để đọc đầy đủ.<br>' +
      '<button type="button" class="ux-btn" data-ux="dl">Tải file Word về</button></div>';
  }
  function uxBindWordFail(el){
    var b = el && el.querySelector('[data-ux="dl"]'); if (!b) return;
    b.addEventListener('click', function(){
      var a = document.querySelector('.ap-word-btn-dl'); if (a) a.click();
    });
  }

  // ===== Lọc HTML không tin cậy (chống XSS) =====
  function sanitizeHtml(h){
    if (window.DOMPurify) return window.DOMPurify.sanitize(String(h||''), {ADD_ATTR:['target']});
    return String(h||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  var __mammothPromise = null;
  function loadMammoth(){
    if (window.mammoth) return Promise.resolve(window.mammoth);
    if (!__mammothPromise) __mammothPromise = new Promise(function(res, rej){
      var sc = document.createElement('script');
      sc.src = 'https://cdn.jsdelivr.net/npm/mammoth/mammoth.browser.min.js';
      sc.onload = function(){ res(window.mammoth); };
      sc.onerror = function(){ __mammothPromise = null; rej(new Error('mammoth')); };
      document.head.appendChild(sc);
    });
    return __mammothPromise;
  }

  // ================================================================================
  // ===== DocxView: chuyển file Word (.docx) -> văn bản HTML ngay trên trang =====
  // Tự viết, KHÔNG cần thư viện ngoài / CDN. Giữ nguyên: căn lề, thụt lề (trái/phải/dòng đầu/
  // treo), khoảng cách đoạn, giãn dòng, tab, xuống dòng, danh sách đánh số/gạch đầu dòng,
  // bảng (gộp ô, viền, nền), ảnh, in đậm/nghiêng/gạch chân/màu/cỡ chữ, liên kết.
  // ================================================================================
  var DocxView = (function(){
    'use strict';
    var NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    var NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    var S = null; // trạng thái của lần chuyển đổi hiện tại

    // ---------- tiện ích XML ----------
    function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function kids(el){ var r = []; if (!el) return r; for (var c = el.firstElementChild; c; c = c.nextElementSibling) r.push(c); return r; }
    function first(el, n){ if (!el) return null; for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === n) return c; return null; }
    function attr(e, n){ if (!e) return null; var v = e.getAttributeNS(NS_W, n); if (v === null) v = e.getAttribute('w:' + n); return v; }
    function rattr(e, n){ if (!e) return ''; return e.getAttributeNS(NS_R, n) || e.getAttribute('r:' + n) || ''; }
    function wv(el, n){ var e = first(el, n); return e ? attr(e, 'val') : null; }
    function num(v){ var n = parseInt(v, 10); return isNaN(n) ? undefined : n; }
    function isOn(v){ return !(v === '0' || v === 'false' || v === 'off'); }
    function isHex(v){ return /^[0-9a-fA-F]{6}$/.test(v || ''); }
    function safeHref(h){ return /^(https?:|mailto:|tel:)/i.test(String(h || '').trim()); }
    function fmt(n){ return (Math.round(n * 1000) / 1000).toString(); }
    // độ dài (twips) -> calc theo cỡ chữ gốc của tài liệu, tự co lại trên màn hình nhỏ (--k)
    function L(tw){ return 'calc(var(--u)*' + fmt(tw / 20 / S.basePt) + '*var(--k))'; }
    // tên font trong file Word -> font-family CSS (giữ đúng font gốc + font dự phòng cùng loại)
    function cssFont(name){
      var n = String(name || '').replace(/["'\\<>;{}]/g, '').trim();
      if (!n) return '';
      var alias = { '.vntime': 'Times New Roman', '.vntimeh': 'Times New Roman', '.vntimeu': 'Times New Roman', '.vnarial': 'Arial', '.vnarialh': 'Arial', '.vnhelve': 'Arial', '.vnhelveh': 'Arial', '.vncourier': 'Courier New' };
      var key = n.toLowerCase();
      if (alias[key]) n = alias[key];
      var generic = 'sans-serif';
      if (/times|cambria|georgia|garamond|palatino|book|minion|constantia|serif/i.test(n)) generic = 'serif';
      else if (/courier|consol|mono/i.test(n)) generic = 'monospace';
      return "'" + n + "'," + generic;
    }

    // ---------- đọc file ZIP (.docx) bằng DecompressionStream có sẵn của trình duyệt ----------
    function inflateRaw(data){
      var ds = new DecompressionStream('deflate-raw');
      return new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){ return new Uint8Array(b); });
    }
    function readZip(buf){
      if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('no-DecompressionStream'));
      var u8 = new Uint8Array(buf), dv = new DataView(buf), eocd = -1, i;
      for (i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
        if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
      }
      if (eocd < 0) return Promise.reject(new Error('not-a-zip'));
      var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true);
      var files = {}, dec = new TextDecoder('utf-8');
      for (var n = 0; n < count; n++) {
        if (dv.getUint32(p, true) !== 0x02014b50) break;
        var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
        var nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
        var lho = dv.getUint32(p + 42, true);
        files[dec.decode(u8.subarray(p + 46, p + 46 + nl))] = { method: method, csize: csize, lho: lho };
        p += 46 + nl + el + cl;
      }
      function bytes(name){
        var f = files[name]; if (!f) return Promise.resolve(null);
        var lp = f.lho, start = lp + 30 + dv.getUint16(lp + 26, true) + dv.getUint16(lp + 28, true);
        var data = u8.subarray(start, start + f.csize);
        if (f.method === 0) return Promise.resolve(data);
        if (f.method === 8) return inflateRaw(data);
        return Promise.reject(new Error('zip-method-' + f.method));
      }
      return Promise.resolve({
        names: function(){ return Object.keys(files); },
        bytes: bytes,
        text: function(name){ return bytes(name).then(function(b){ return b ? dec.decode(b) : null; }); }
      });
    }

    // ---------- đọc thuộc tính đoạn / ký tự / bảng ----------
    function bside(el, s){
      if (!el) return null;
      return first(el, s) || (s === 'left' ? first(el, 'start') : (s === 'right' ? first(el, 'end') : null));
    }
    function parseBorder(e){
      if (!e) return undefined;
      return { val: attr(e, 'val'), sz: num(attr(e, 'sz')) || 4, color: attr(e, 'color') || 'auto' };
    }
    function borderCss(b){
      if (!b || !b.val || b.val === 'nil' || b.val === 'none') return 'none';
      var px = Math.min(6, Math.max(1, Math.round((b.sz || 4) / 6))), st = 'solid';
      if (/double/i.test(b.val)) { st = 'double'; px = Math.max(3, px); }
      else if (/dash/i.test(b.val)) st = 'dashed';
      else if (/dot/i.test(b.val)) st = 'dotted';
      return px + 'px ' + st + ' ' + (isHex(b.color) ? '#' + b.color : '#000');
    }
    function parsePPr(el){
      var o = {}; if (!el) return o; var v;
      if ((v = wv(el, 'pStyle')) !== null) o.styleId = v;
      if ((v = wv(el, 'jc')) !== null) o.jc = v;
      var ind = first(el, 'ind');
      if (ind) {
        var l = num(attr(ind, 'left')); if (l === undefined) l = num(attr(ind, 'start')); if (l !== undefined) o.left = l;
        var r = num(attr(ind, 'right')); if (r === undefined) r = num(attr(ind, 'end')); if (r !== undefined) o.right = r;
        var fl = num(attr(ind, 'firstLine')), hg = num(attr(ind, 'hanging'));
        if (hg !== undefined) o.first = -hg; else if (fl !== undefined) o.first = fl;
      }
      var sp = first(el, 'spacing');
      if (sp) {
        var b = num(attr(sp, 'before')), a = num(attr(sp, 'after')), ln = num(attr(sp, 'line'));
        if (attr(sp, 'beforeAutospacing') === '1') b = 280;
        if (attr(sp, 'afterAutospacing') === '1') a = 280;
        if (b !== undefined) o.before = b; if (a !== undefined) o.after = a;
        if (ln !== undefined) { o.line = ln; o.lineRule = attr(sp, 'lineRule') || 'auto'; }
      }
      var cs = first(el, 'contextualSpacing'); if (cs) o.contextual = isOn(attr(cs, 'val') === null ? '1' : attr(cs, 'val'));
      var np = first(el, 'numPr');
      if (np) { var ni = wv(np, 'numId'); if (ni !== null) o.numId = ni; var il = wv(np, 'ilvl'); if (il !== null) o.ilvl = parseInt(il, 10) || 0; }
      var tb = first(el, 'tabs');
      if (tb) {
        o.tabs = [];
        kids(tb).forEach(function(t){
          if (t.localName === 'tab') o.tabs.push({ pos: num(attr(t, 'pos')), val: attr(t, 'val') || 'left', leader: attr(t, 'leader') || 'none' });
        });
      }
      var sh = first(el, 'shd'); if (sh) { var f = attr(sh, 'fill'); if (isHex(f)) o.shd = f; }
      var bd = first(el, 'pBdr');
      if (bd) { o.bdr = {}; ['top', 'left', 'bottom', 'right'].forEach(function(s){ var x = parseBorder(bside(bd, s)); if (x) o.bdr[s] = x; }); }
      var mr = first(el, 'rPr'); if (mr) o.markR = parseRPr(mr);
      return o;
    }
    function parseRPr(el){
      var o = {}; if (!el) return o; var v;
      if ((v = wv(el, 'rStyle')) !== null) o.rStyle = v;
      ['b', 'i', 'strike', 'dstrike', 'caps', 'smallCaps', 'vanish'].forEach(function(n){
        var e = first(el, n); if (e) { var x = attr(e, 'val'); o[n] = (x === null) ? true : isOn(x); }
      });
      // Word chỉ gạch chân khi w:u có w:val; thiếu w:val thì Word bỏ qua (đã đối chiếu Font.Underline qua Word)
      var u = first(el, 'u');
      if (u) {
        var uv = (attr(u, 'val') || '').toLowerCase();
        if (uv) o.u = /^(none|nil|0|false)$/.test(uv) ? 'none' : uv;
      }
      var rf = first(el, 'rFonts');
      if (rf) {
        var fn = attr(rf, 'ascii') || attr(rf, 'hAnsi') || attr(rf, 'cs') || attr(rf, 'eastAsia');
        if (fn) o.font = fn;
      }
      if ((v = wv(el, 'color')) !== null) o.color = v;
      if ((v = num(wv(el, 'sz'))) !== undefined) o.sz = v;
      if ((v = wv(el, 'highlight')) !== null) o.hl = v;
      if ((v = wv(el, 'vertAlign')) !== null) o.va = v;
      var sh = first(el, 'shd'); if (sh) { var f = attr(sh, 'fill'); if (isHex(f)) o.shd = f; }
      return o;
    }
    function parseTblPr(el){
      var o = {}; if (!el) return o; var v;
      if ((v = wv(el, 'tblStyle')) !== null) o.styleId = v;
      if ((v = wv(el, 'jc')) !== null) o.jc = v;
      var w = first(el, 'tblW'); if (w) o.w = { type: attr(w, 'type') || 'auto', w: num(attr(w, 'w')) || 0 };
      var ind = first(el, 'tblInd'); if (ind) o.ind = num(attr(ind, 'w'));
      var bd = first(el, 'tblBorders');
      if (bd) { o.bdr = {}; ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].forEach(function(s){ var x = parseBorder(bside(bd, s)); if (x) o.bdr[s] = x; }); }
      var lk = first(el, 'tblLook');
      if (lk) {
        var vh = attr(lk, 'val'), mk = vh ? parseInt(vh, 16) : null;
        var fl = function(n, bit){ var a = attr(lk, n); if (a !== null) return isOn(a); return mk !== null ? !!(mk & bit) : undefined; };
        o.look = { firstRow: fl('firstRow', 0x20), lastRow: fl('lastRow', 0x40), firstCol: fl('firstColumn', 0x80), lastCol: fl('lastColumn', 0x100), noHBand: fl('noHBand', 0x200), noVBand: fl('noVBand', 0x400) };
      }
      var cm = first(el, 'tblCellMar');
      if (cm) { o.mar = {}; ['top', 'left', 'bottom', 'right'].forEach(function(s){ var e = first(cm, s); if (e) o.mar[s] = num(attr(e, 'w')); }); }
      return o;
    }
    function parseTcPr(tcPr){
      var o = { span: 1, vm: null, bdr: {}, mar: {} };
      if (!tcPr) return o;
      var gs = first(tcPr, 'gridSpan'); if (gs) o.span = num(attr(gs, 'val')) || 1;
      var vme = first(tcPr, 'vMerge'); if (vme) o.vm = (attr(vme, 'val') === 'restart') ? 'restart' : 'continue';
      var sh = first(tcPr, 'shd'); if (sh && isHex(attr(sh, 'fill'))) o.shd = attr(sh, 'fill');
      var va = wv(tcPr, 'vAlign'); if (va) o.va = va;
      var tb = first(tcPr, 'tcBorders');
      if (tb) ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].forEach(function(s){ var x = parseBorder(bside(tb, s)); if (x) o.bdr[s] = x; });
      var tm = first(tcPr, 'tcMar');
      if (tm) ['top', 'left', 'bottom', 'right'].forEach(function(s){ var e = bside(tm, s); if (e) o.mar[s] = num(attr(e, 'w')); });
      return o;
    }
    function assignDef(t, s){ for (var k in s) if (s[k] !== undefined) t[k] = s[k]; return t; }
    function mergeP(t, s){
      for (var k in s) {
        if (s[k] === undefined) continue;
        if (k === 'tabs') t.tabs = (t.tabs || []).concat(s.tabs);
        else if (k === 'bdr') t.bdr = assignDef(assignDef({}, t.bdr || {}), s.bdr);
        else t[k] = s[k];
      }
      return t;
    }
    function mergeT(t, s){
      if (!s) return t;
      for (var k in s) {
        if (s[k] === undefined) continue;
        if (k === 'bdr' || k === 'mar') t[k] = assignDef(assignDef({}, t[k] || {}), s[k]); else t[k] = s[k];
      }
      return t;
    }

    // ---------- styles ----------
    function parseStyles(doc){
      S.styles = {}; S.defP = {}; S.defR = {}; S.defParaId = null; S.defTblId = null;
      if (!doc) return;
      var root = doc.documentElement, dd = first(root, 'docDefaults');
      if (dd) {
        var ppd = first(dd, 'pPrDefault'), rpd = first(dd, 'rPrDefault');
        if (ppd) S.defP = parsePPr(first(ppd, 'pPr'));
        if (rpd) S.defR = parseRPr(first(rpd, 'rPr'));
      }
      kids(root).forEach(function(s){
        if (s.localName !== 'style') return;
        var id = attr(s, 'styleId');
        var st = { id: id, type: attr(s, 'type'), basedOn: wv(s, 'basedOn'), p: parsePPr(first(s, 'pPr')), r: parseRPr(first(s, 'rPr')), tbl: parseTblPr(first(s, 'tblPr')), cond: {} };
        kids(s).forEach(function(x){
          if (x.localName !== 'tblStylePr') return;
          var tc = parseTcPr(first(x, 'tcPr'));
          st.cond[attr(x, 'type')] = { tbl: parseTblPr(first(x, 'tblPr')), bdr: tc.bdr, shd: tc.shd, r: parseRPr(first(x, 'rPr')), p: parsePPr(first(x, 'pPr')) };
        });
        S.styles[id] = st;
        if (attr(s, 'default') === '1') { if (st.type === 'paragraph') S.defParaId = id; if (st.type === 'table') S.defTblId = id; }
      });
    }
    function chainOf(id){
      var out = [], seen = {};
      while (id && S.styles[id] && !seen[id]) { seen[id] = 1; out.unshift(S.styles[id]); id = S.styles[id].basedOn; }
      return out;
    }
    function sameAsDefault(p){
      var o = {};
      for (var k in p) {
        if (k === 'tabs' || k === 'bdr' || k === 'markR') { o[k] = p[k]; continue; }
        if (S.defP[k] !== p[k]) o[k] = p[k];
      }
      return o;
    }
    function resolveP(styleId, direct, ctx){
      var o = {}; mergeP(o, S.defP);
      if (ctx.tblStyle) chainOf(ctx.tblStyle).forEach(function(st){ mergeP(o, st.p); });
      if (ctx.condP) mergeP(o, ctx.condP);
      chainOf(styleId).forEach(function(st){
        var p = st.p;
        if (ctx.tblStyle && st.id === S.defParaId) p = sameAsDefault(p);
        mergeP(o, p);
      });
      var numId = direct.numId !== undefined ? direct.numId : o.numId;
      var ilvl = direct.ilvl !== undefined ? direct.ilvl : (o.ilvl || 0);
      if (numId && numId !== '0') {
        var lv = getLvl(numId, ilvl);
        if (lv && lv.p) ['left', 'right', 'first'].forEach(function(k){ if (lv.p[k] !== undefined) o[k] = lv.p[k]; });
      }
      var d = assignDef({}, direct); delete d.numId; delete d.ilvl; delete d.styleId; delete d.markR;
      if (direct.tabs) d.tabs = direct.tabs; if (direct.bdr) d.bdr = direct.bdr;
      mergeP(o, d);
      o.numId = numId; o.ilvl = ilvl;
      return o;
    }
    function resolveR(styleId, rStyleId, direct, ctx){
      var o = assignDef({}, S.defR);
      if (ctx && ctx.tblStyle) chainOf(ctx.tblStyle).forEach(function(st){ assignDef(o, st.r); });
      if (ctx && ctx.condR) assignDef(o, ctx.condR);
      chainOf(styleId).forEach(function(st){
        var r = st.r;
        if (ctx && ctx.tblStyle && st.id === S.defParaId) { var t = {}; for (var k in r) if (S.defR[k] !== r[k]) t[k] = r[k]; r = t; }
        assignDef(o, r);
      });
      if (rStyleId) chainOf(rStyleId).forEach(function(st){ assignDef(o, st.r); });
      assignDef(o, direct || {});
      return o;
    }

    // ---------- danh sách (numbering) ----------
    function parseLvl(l){
      var st = num(wv(l, 'start')); var rf = first(first(l, 'rPr'), 'rFonts');
      return {
        start: st === undefined ? 1 : st, fmt: wv(l, 'numFmt') || 'decimal', text: wv(l, 'lvlText') || '',
        suff: wv(l, 'suff') || 'tab', p: parsePPr(first(l, 'pPr')), r: parseRPr(first(l, 'rPr')), lgl: !!first(l, 'isLgl')
      };
    }
    function parseNumbering(doc){
      S.abs = {}; S.nums = {}; S.cnt = {}; S.seenNum = {};
      if (!doc) return;
      kids(doc.documentElement).forEach(function(e){
        if (e.localName === 'abstractNum') {
          var a = { lvls: {} };
          kids(e).forEach(function(l){ if (l.localName === 'lvl') a.lvls[attr(l, 'ilvl')] = parseLvl(l); });
          S.abs[attr(e, 'abstractNumId')] = a;
        } else if (e.localName === 'num') {
          var n = { abs: wv(e, 'abstractNumId'), over: {} };
          kids(e).forEach(function(o){
            if (o.localName !== 'lvlOverride') return;
            var so = first(o, 'startOverride'), lv = first(o, 'lvl');
            n.over[attr(o, 'ilvl')] = { start: so ? num(attr(so, 'val')) : undefined, lvl: lv ? parseLvl(lv) : null };
          });
          S.nums[attr(e, 'numId')] = n;
        }
      });
    }
    function getLvl(numId, ilvl){
      var n = S.nums[numId]; if (!n) return null;
      var ov = n.over[String(ilvl)]; if (ov && ov.lvl) return ov.lvl;
      var a = S.abs[n.abs]; return a ? (a.lvls[String(ilvl)] || null) : null;
    }
    function roman(n, up){
      var m = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']], s = '';
      for (var i = 0; i < m.length; i++) while (n >= m[i][0]) { s += m[i][1]; n -= m[i][0]; }
      return up ? s.toUpperCase() : s;
    }
    function fmtNum(n, f){
      var s, k;
      switch (f) {
        case 'decimalZero': return n < 10 ? '0' + n : String(n);
        case 'lowerLetter': case 'upperLetter':
          s = String.fromCharCode(97 + (n - 1) % 26); for (k = 0; k < Math.floor((n - 1) / 26); k++) s += s.charAt(0);
          return f === 'upperLetter' ? s.toUpperCase() : s;
        case 'lowerRoman': return roman(n, false);
        case 'upperRoman': return roman(n, true);
        case 'none': return '';
        default: return String(n);
      }
    }
    function bulletChar(t){
      if (!t) return '\u2022';
      var c = t.charCodeAt(0);
      if (c === 0xF0B7) return '\u2022';
      if (c === 0xF0A7) return '\u25AA';
      if (c === 0xF0D8) return '\u27A2';
      if (c === 0xF0FC) return '\u2713';
      if (c === 0xF076) return '\u2756';
      if (c >= 0xF000 && c <= 0xF0FF) return '\u2022';
      if (t === 'o') return '\u25E6';
      return t;
    }
    function nextLabel(numId, ilvl){
      var n = S.nums[numId]; if (!n) return null;
      var lvl = getLvl(numId, ilvl); if (!lvl) return null;
      var cnt = S.cnt[n.abs] || (S.cnt[n.abs] = {});
      if (!S.seenNum[numId]) {
        S.seenNum[numId] = true;
        for (var il in n.over) if (n.over[il].start !== undefined) cnt[il] = n.over[il].start - 1;
      }
      var key = String(ilvl);
      if (cnt[key] === undefined) cnt[key] = lvl.start - 1;
      cnt[key]++;
      Object.keys(cnt).forEach(function(k){ if (parseInt(k, 10) > ilvl) delete cnt[k]; });
      if (lvl.fmt === 'bullet') return { text: bulletChar(lvl.text), lvl: lvl };
      var text = lvl.text.replace(/%(\d)/g, function(m, d){
        var li = parseInt(d, 10) - 1, cl = getLvl(numId, li), c = cnt[String(li)];
        if (c === undefined) c = cl ? cl.start : 1;
        return fmtNum(c, (lvl.lgl && li !== ilvl) ? 'decimal' : (cl ? cl.fmt : 'decimal'));
      });
      return { text: text, lvl: lvl };
    }

    // ---------- chạy chữ (run) ----------
    var HL = { yellow: '#ffff00', green: '#00ff00', cyan: '#00ffff', magenta: '#ff00ff', blue: '#0000ff', red: '#ff0000', darkBlue: '#000080', darkCyan: '#008080', darkGreen: '#008000', darkMagenta: '#800080', darkRed: '#800000', darkYellow: '#808000', darkGray: '#808080', lightGray: '#c0c0c0', black: '#000000', white: '#ffffff' };
    function runCss(rp, P){
      var css = [];
      if (rp.font) { var ff = cssFont(rp.font); if (ff) css.push('font-family:' + ff); }
      if (rp.b) css.push('font-weight:700');
      if (rp.i) css.push('font-style:italic');
      var dec = [];
      if (rp.u && !/^(none|nil|0|false)$/i.test(rp.u)) dec.push('underline');
      if (rp.strike || rp.dstrike) dec.push('line-through');
      if (dec.length) { css.push('text-decoration:' + dec.join(' ')); if (rp.u && /double/i.test(rp.u)) css.push('text-decoration-style:double'); }
      if (rp.color && isHex(rp.color) && !/^000000$/.test(rp.color)) css.push('color:#' + rp.color);
      var bg = rp.hl && HL[rp.hl] ? HL[rp.hl] : (rp.shd ? '#' + rp.shd : '');
      if (bg) css.push('background-color:' + bg);
      if (rp.caps) css.push('text-transform:uppercase');
      if (rp.smallCaps) css.push('font-variant:small-caps');
      if (rp.va === 'superscript' || rp.va === 'subscript') {
        css.push('vertical-align:' + (rp.va === 'superscript' ? 'super' : 'sub')); css.push('font-size:.75em');
      } else if (rp.sz && P.sz && rp.sz !== P.sz) css.push('font-size:' + fmt(rp.sz / P.sz) + 'em');
      return css.join(';');
    }
    function symChar(c){
      var ch = (attr(c, 'char') || '').toUpperCase(), code = parseInt(ch, 16);
      if (isNaN(code)) return '';
      if (code >= 0xF000) { var m = { 0xF0B7: '\u2022', 0xF0A7: '\u25AA', 0xF0D8: '\u27A2', 0xF0FC: '\u2713' }; return m[code] || '\u2022'; }
      return esc(String.fromCharCode(code));
    }
    function tabSpan(){ return '<span class="dx-tab"></span>'; }
    function mediaUrl(relId){
      var r = S.rels[relId]; if (!r) return '';
      var t = r.target.replace(/^\//, ''); if (!/^word\//i.test(t)) t = 'word/' + t;
      t = t.replace(/[^\/]+\/\.\.\//g, '');
      return S.media[t] || '';
    }
    // vị trí ngang của ảnh neo (floating) trong Word: left / center / right
    function anchorAlign(inl){
      var ph = first(inl, 'positionH'); if (!ph) return '';
      var al = first(ph, 'align');
      if (al) {
        var a = al.textContent.trim();
        if (a === 'left' || a === 'inside') return 'left';
        if (a === 'right' || a === 'outside') return 'right';
        if (a === 'center') return 'center';
      }
      var po = first(ph, 'posOffset');
      if (po) {
        var off = (parseInt(po.textContent, 10) || 0) / 635;
        if ((ph.getAttribute('relativeFrom') || '') === 'page') off -= S.marL;
        var ext = first(inl, 'extent'), w = ext ? (parseInt(ext.getAttribute('cx'), 10) || 0) / 635 : 0;
        var ratio = (off + w / 2) / S.textW;
        if (ratio > 0.4 && ratio < 0.6) return 'center';
        return ratio < 0.5 ? 'left' : 'right';
      }
      return '';
    }
    function drawingHtml(d, ctx, P){
      var inl = first(d, 'inline') || first(d, 'anchor'); if (!inl) return '';
      var anchor = inl.localName === 'anchor';
      var tx = inl.getElementsByTagNameNS('*', 'txbxContent')[0];
      if (tx) return '<div class="dx-tb">' + blocks(tx, { inTable: false, tblStyle: null }) + '</div>';
      var blip = inl.getElementsByTagNameNS('*', 'blip')[0]; if (!blip) return '';
      if (anchor && inl.getAttribute('behindDoc') === '1') return '';
      var url = mediaUrl(rattr(blip, 'embed')); if (!url) return '';
      var ext = first(inl, 'extent'), wTw = ext ? (parseInt(ext.getAttribute('cx'), 10) || 0) / 635 : 0;
      var dp = first(inl, 'docPr'), alt = dp ? (dp.getAttribute('descr') || '') : '';
      var css = ['max-width:100%', 'height:auto']; if (wTw > 0) css.unshift('width:' + L(wTw));
      if (anchor && !(P && P.imgOnly)) {
        var wrap = kids(inl).filter(function(x){ return /^wrap/.test(x.localName); })[0], wn = wrap ? wrap.localName : '';
        var al = 'center'; // luôn căn giữa ảnh
        if (true) {
          css.push('display:block', 'margin:.4em ' + (al === 'left' ? 'auto .4em .4em 0' : (al === 'right' ? '.4em 0 .4em auto' : 'auto')));
          if (al === 'left') css[css.length - 1] = 'margin:.4em auto .4em 0';
          else if (al === 'right') css[css.length - 1] = 'margin:.4em 0 .4em auto';
        } else if ((wn === 'wrapSquare' || wn === 'wrapTight' || wn === 'wrapThrough') && (al === 'left' || al === 'right'))
          css.push('float:' + al, 'margin:.2em ' + (al === 'left' ? '.8em .4em 0' : '0 .4em .8em'));
      }
      return '<img src="' + esc(url) + '" alt="' + esc(alt) + '" style="' + css.join(';') + '">';
    }
    function pictHtml(pc, ctx, P){
      var tx = pc.getElementsByTagNameNS('*', 'txbxContent')[0];
      if (tx) return '<div class="dx-tb">' + blocks(tx, { inTable: false, tblStyle: null }) + '</div>';
      var im = pc.getElementsByTagNameNS('*', 'imagedata')[0]; if (!im) return '';
      var url = mediaUrl(rattr(im, 'id')); if (!url) return '';
      var sh = im.parentNode, style = sh && sh.getAttribute ? (sh.getAttribute('style') || '') : '';
      var m = /width:\s*([\d.]+)pt/i.exec(style), css = ['max-width:100%', 'height:auto'];
      if (m) css.unshift('width:' + L(Math.round(parseFloat(m[1]) * 20)));
      return '<img src="' + esc(url) + '" alt="" style="' + css.join(';') + '">';
    }
    function altHtml(ac, ctx, P){
      var ch = first(ac, 'Choice') || first(ac, 'Fallback'), out = '';
      kids(ch).forEach(function(c){
        if (c.localName === 'drawing') out += drawingHtml(c, ctx, P);
        else if (c.localName === 'pict') out += pictHtml(c, ctx, P);
      });
      return out;
    }
    function runHtml(r, ctx, P, st){
      var direct = parseRPr(first(r, 'rPr'));
      var rp = resolveR(P.styleId, direct.rStyle, direct, ctx);
      var inner = '', lopen = '', lclose = '';
      kids(r).forEach(function(c){
        var nm = c.localName, top = st.fld[st.fld.length - 1];
        if (nm === 'fldChar') {
          var t = attr(c, 'fldCharType');
          if (t === 'begin') st.fld.push({ instr: '', phase: 0 });
          else if (t === 'separate' && top) {
            top.phase = 1;
            var m = /^\s*HYPERLINK\s+"([^"]+)"/i.exec(top.instr);
            if (m && safeHref(m[1])) { top.link = true; lopen += '<a href="' + esc(m[1]) + '" target="_blank" rel="noopener noreferrer">'; }
          } else if (t === 'end') { var f = st.fld.pop(); if (f && f.link) lclose += '</a>'; }
          return;
        }
        if (nm === 'instrText') { if (top) top.instr += c.textContent; return; }
        if (top && top.phase === 0) return;
        if (nm === 't') inner += esc(c.textContent);
        else if (nm === 'tab') inner += tabSpan();
        else if (nm === 'br') { var ty = attr(c, 'type'); if (ty !== 'page' && ty !== 'column') inner += '<br>'; }
        else if (nm === 'cr') inner += '<br>';
        else if (nm === 'noBreakHyphen') inner += '&#8209;';
        else if (nm === 'sym') inner += symChar(c);
        else if (nm === 'drawing') inner += drawingHtml(c, ctx, P);
        else if (nm === 'pict') inner += pictHtml(c, ctx, P);
        else if (nm === 'AlternateContent') inner += altHtml(c, ctx, P);
      });
      if (rp.vanish) return lopen + lclose;
      var css = runCss(rp, P);
      return lopen + ((css && inner) ? '<span style="' + css + '">' + inner + '</span>' : inner) + lclose;
    }
    function inlineHtml(parent, ctx, P, st){
      var out = '';
      kids(parent).forEach(function(e){
        switch (e.localName) {
          case 'r': out += runHtml(e, ctx, P, st); break;
          case 'hyperlink':
            var rel = S.rels[rattr(e, 'id')], inner = inlineHtml(e, ctx, P, st);
            out += (rel && rel.ext && safeHref(rel.target)) ? '<a href="' + esc(rel.target) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>' : inner;
            break;
          case 'ins': case 'smartTag': case 'customXml': case 'fldSimple': case 'moveTo': out += inlineHtml(e, ctx, P, st); break;
          case 'sdt': var c = first(e, 'sdtContent'); if (c) out += inlineHtml(c, ctx, P, st); break;
          case 'AlternateContent': out += altHtml(e, ctx, P); break;
        }
      });
      return out;
    }

    // ---------- đoạn văn ----------
    function paraItem(p, ctx){
      var direct = parsePPr(first(p, 'pPr'));
      var styleId = direct.styleId || S.defParaId;
      var props = resolveP(styleId, direct, ctx);
      var baseR = resolveR(styleId, null, {}, ctx);
      var sz = baseR.sz || S.baseHalf;
      var P = { styleId: styleId, sz: sz, font: baseR.font || S.baseFont || '' };
      // đoạn chỉ chứa ảnh (không chữ): xác định ảnh nằm trái / giữa / phải
      var imgOnly = false, imgAlign = '';
      var txt = Array.prototype.map.call(p.getElementsByTagNameNS(NS_W, 't'), function(n){ return n.textContent; }).join('').trim();
      if (!txt && p.getElementsByTagNameNS('*', 'blip').length && !p.getElementsByTagNameNS('*', 'txbxContent').length) {
        imgOnly = true; P.imgOnly = true;
        var an = p.getElementsByTagNameNS('*', 'anchor');
        for (var ai = 0; ai < an.length; ai++) {
          if (an[ai].getAttribute('behindDoc') === '1' || !an[ai].getElementsByTagNameNS('*', 'blip').length) continue;
          imgAlign = anchorAlign(an[ai]); break;
        }
      }
      var label = '';
      if (props.numId && props.numId !== '0') {
        var nl = nextLabel(props.numId, props.ilvl || 0);
        if (nl) {
          var mr = resolveR(styleId, null, direct.markR || {}, ctx); assignDef(mr, nl.lvl.r);
          var css = runCss(mr, P);
          label = '<span class="dx-num"' + (css ? ' style="' + css + '"' : '') + '>' + esc(nl.text) + '</span>';
          label += nl.lvl.suff === 'tab' ? tabSpan() : (nl.lvl.suff === 'space' ? ' ' : '');
        }
      }
      var inner = label + inlineHtml(p, ctx, P, { fld: [] });
      return { p: true, props: props, styleId: styleId, sz: sz, font: P.font, inner: inner, imgOnly: imgOnly && !label, imgAlign: imgAlign };
    }
    function paraHtml(it, prev, next){
      var pr = it.props, css = [], before = pr.before || 0, after = pr.after || 0;
      if (it.font && it.font !== S.baseFont) { var ff = cssFont(it.font); if (ff) css.push('font-family:' + ff); }
      if (pr.contextual) {
        if (next && next.p && next.styleId === it.styleId) after = 0;
        if (prev && prev.p && prev.styleId === it.styleId) before = 0;
      }
      var jc = pr.jc, noIndent = false;
      if (it.imgOnly) {
        var eff = 'center'; // luôn căn giữa ảnh
        jc = eff;
        // ảnh nằm giữa: bỏ thụt lề của đoạn để ảnh thật sự ở chính giữa như trong Word
        if (eff === 'center') noIndent = true;
      }
      if (jc === 'center') css.push('text-align:center');
      else if (jc === 'right' || jc === 'end') css.push('text-align:right');
      else if (jc === 'both' || jc === 'distribute' || jc === 'thaiDistribute') css.push('text-align:justify');
      if (!noIndent) {
        if (pr.left) css.push('margin-left:' + L(pr.left));
        if (pr.right) css.push('margin-right:' + L(pr.right));
        if (pr.first) css.push('text-indent:' + L(pr.first));
      }
      if (before) css.push('margin-top:' + L(before));
      if (after) css.push('margin-bottom:' + L(after));
      if (pr.line) {
        if (pr.lineRule === 'exact' || pr.lineRule === 'atLeast')
          css.push('line-height:' + fmt(Math.max(pr.lineRule === 'atLeast' ? 1.2 : 0.8, (pr.line / 20) / (it.sz / 2))));
        else css.push('line-height:' + fmt(pr.line / 240 * 1.15));
      }
      if (it.sz !== S.baseHalf) css.push('font-size:calc(var(--u)*' + fmt(it.sz / S.baseHalf) + ')');
      if (pr.shd) css.push('background-color:#' + pr.shd);
      if (pr.bdr) ['top', 'left', 'bottom', 'right'].forEach(function(s){
        if (pr.bdr[s]) { var bc = borderCss(pr.bdr[s]); css.push('border-' + s + ':' + bc); if (bc !== 'none') css.push('padding-' + s + ':.2em'); }
      });
      // tab stops (twips) cho bộ căn tab chạy sau khi dựng
      var stops = [];
      (pr.tabs || []).forEach(function(t){
        if (t.val === 'clear') { stops = stops.filter(function(x){ return x.pos !== t.pos; }); }
        else if (t.pos !== undefined) stops.push(t);
      });
      if (pr.first < 0 && pr.left > 0 && !stops.some(function(x){ return x.pos === pr.left; })) stops.push({ pos: pr.left, val: 'left', leader: 'none' });
      stops.sort(function(a, b){ return a.pos - b.pos; });
      var tabAttr = stops.length ? ' data-dxt="' + stops.map(function(t){ return t.pos + ':' + t.val + ':' + t.leader; }).join(',') + '"' : '';
      var inner = it.inner;
      if (!inner) inner = '<br>';
      else if (/<br>$/.test(inner)) inner += '\u200b';
      return '<div class="dx-p"' + tabAttr + (css.length ? ' style="' + css.join(';') + '"' : '') + '>' + inner + '</div>';
    }

    // ---------- bảng ----------
    function tableHtml(tbl, ctx){
      var direct = parseTblPr(first(tbl, 'tblPr')), sid = direct.styleId || S.defTblId;
      // định dạng theo vùng của kiểu bảng (hàng đầu, cột đầu, dòng kẻ sọc, toàn bảng...)
      var cond = {};
      chainOf(sid).forEach(function(st){
        for (var ty in st.cond) {
          var c = st.cond[ty], t = cond[ty] || (cond[ty] = { tbl: {}, bdr: {}, shd: undefined, r: {}, p: {} });
          mergeT(t.tbl, c.tbl); assignDef(t.bdr, c.bdr); if (c.shd) t.shd = c.shd; assignDef(t.r, c.r); mergeP(t.p, c.p);
        }
      });
      var tp = {};
      chainOf(sid).forEach(function(st){ mergeT(tp, st.tbl); });
      if (cond.wholeTable) mergeT(tp, cond.wholeTable.tbl);
      mergeT(tp, direct);
      var bdr = tp.bdr || {}, mar = tp.mar || {};
      var look = tp.look || { firstRow: true, firstCol: true, noVBand: true };
      var grid = []; var tg = first(tbl, 'tblGrid');
      if (tg) kids(tg).forEach(function(g){ if (g.localName === 'gridCol') grid.push(num(attr(g, 'w')) || 0); });
      var trs = kids(tbl).filter(function(x){ return x.localName === 'tr'; });
      var nrows = trs.length, ncols = grid.length;
      if (!ncols) trs.forEach(function(tr){
        var n = 0; kids(tr).forEach(function(tc){ if (tc.localName === 'tc') n += (parseTcPr(first(tc, 'tcPr')).span || 1); });
        ncols = Math.max(ncols, n);
      });
      ncols = ncols || 1;
      // vị trí viền: mép ngoài dùng top/bottom/left/right, bên trong dùng insideH/insideV
      function pick(b, ri, col, span, rowspan){
        return {
          top: ri === 0 ? b.top : b.insideH,
          bottom: (ri + (rowspan || 1) >= nrows) ? b.bottom : b.insideH,
          left: col === 0 ? b.left : b.insideV,
          right: (col + span >= ncols) ? b.right : b.insideV
        };
      }
      function condFor(ri, col, span){
        var types = ['wholeTable'];
        var fr = look.firstRow && ri === 0, lr = look.lastRow && ri === nrows - 1;
        var fc = look.firstCol && col === 0, lc = look.lastCol && col + span >= ncols;
        if (!look.noHBand && !fr && !lr) types.push(((ri - (look.firstRow ? 1 : 0)) % 2 === 0) ? 'band1Horz' : 'band2Horz');
        if (!look.noVBand && !fc && !lc) types.push(((col - (look.firstCol ? 1 : 0)) % 2 === 0) ? 'band1Vert' : 'band2Vert');
        if (fc) types.push('firstCol'); if (lc) types.push('lastCol'); if (fr) types.push('firstRow'); if (lr) types.push('lastRow');
        var out = { bdr: {}, r: {}, p: {}, shd: undefined };
        types.forEach(function(ty){
          var c = cond[ty]; if (!c) return;
          var sd = pick(c.bdr, ri, col, span, 1);
          ['top', 'left', 'bottom', 'right'].forEach(function(k){ if (sd[k]) out.bdr[k] = sd[k]; });
          if (c.shd) out.shd = c.shd; assignDef(out.r, c.r); mergeP(out.p, c.p);
        });
        return out;
      }
      var pend = {}, rows = [];
      trs.forEach(function(tr, ri){
        var row = [], col = 0, trPr = first(tr, 'trPr'), gb = trPr ? (num(wv(trPr, 'gridBefore')) || 0) : 0;
        col += gb;
        kids(tr).forEach(function(tc){
          if (tc.localName !== 'tc') return;
          var tpr = parseTcPr(first(tc, 'tcPr')), cell = { col: col, bdr: tpr.bdr, mar: tpr.mar, shd: tpr.shd, va: tpr.va, span: tpr.span, rowspan: 1 };
          if (tpr.vm === 'continue' && pend[col]) { pend[col].rowspan++; cell.skip = true; }
          else if (tpr.vm === 'restart') pend[col] = cell; else delete pend[col];
          if (!cell.skip) {
            cell.cond = condFor(ri, col, cell.span);
            // nội dung dựng ngay để đánh số danh sách đúng thứ tự tài liệu
            cell.html = blocks(tc, { inTable: true, tblStyle: sid, condR: cell.cond.r, condP: cell.cond.p });
          }
          row.push(cell); col += cell.span;
        });
        rows.push({ cells: row, gb: gb });
      });
      var total = grid.reduce(function(a, b){ return a + b; }, 0);
      var out = '';
      rows.forEach(function(rw, ri){
        out += '<tr>';
        if (rw.gb) out += '<td colspan="' + rw.gb + '"></td>';
        rw.cells.forEach(function(c){
          if (c.skip) return;
          var css = [], tb = pick(bdr, ri, c.col, c.span, c.rowspan);
          ['top', 'right', 'bottom', 'left'].forEach(function(s){
            var b = c.bdr[s] || c.cond.bdr[s] || tb[s];
            if (b) css.push('border-' + s + ':' + borderCss(b));
          });
          ['top', 'right', 'bottom', 'left'].forEach(function(s){
            var v = c.mar[s] !== undefined ? c.mar[s] : (mar[s] !== undefined ? mar[s] : ((s === 'left' || s === 'right') ? 108 : 0));
            css.push('padding-' + s + ':' + L(v));
          });
          var fill = c.shd || c.cond.shd; if (fill) css.push('background-color:#' + fill);
          if (c.va === 'center') css.push('vertical-align:middle'); else if (c.va === 'bottom') css.push('vertical-align:bottom');
          out += '<td' + (c.span > 1 ? ' colspan="' + c.span + '"' : '') + (c.rowspan > 1 ? ' rowspan="' + c.rowspan + '"' : '') + ' style="' + css.join(';') + '">' + (c.html || '<div class="dx-p"><br></div>') + '</td>';
        });
        out += '</tr>';
      });
      var tcss = [], wtw = tp.w;
      if (total) {
        var wtw2 = (wtw && wtw.type === 'dxa' && wtw.w) ? wtw.w : total;
        if (wtw && wtw.type === 'pct' && wtw.w) tcss.push('width:' + fmt(wtw.w / 50) + '%');
        else tcss.push('width:min(' + L(wtw2) + ',100%)');
      }
      if (tp.jc === 'center') tcss.push('margin-left:auto', 'margin-right:auto');
      else if (tp.jc === 'right' || tp.jc === 'end') tcss.push('margin-left:auto');
      else if (tp.ind) tcss.push('margin-left:' + L(tp.ind));
      var cols = '';
      if (total) { cols = '<colgroup>'; grid.forEach(function(g){ cols += '<col style="width:' + fmt(g / total * 100) + '%">'; }); cols += '</colgroup>'; }
      return '<table class="dx-t"' + (tcss.length ? ' style="' + tcss.join(';') + '"' : '') + '>' + cols + '<tbody>' + out + '</tbody></table>';
    }

    // ---------- khối (đoạn + bảng) ----------
    function collect(parent, ctx, items){
      kids(parent).forEach(function(e){
        switch (e.localName) {
          case 'p': items.push(paraItem(e, ctx)); break;
          case 'tbl': items.push({ html: tableHtml(e, ctx) }); break;
          case 'sdt': var c = first(e, 'sdtContent'); if (c) collect(c, ctx, items); break;
          case 'ins': case 'customXml': case 'smartTag': collect(e, ctx, items); break;
        }
      });
    }
    function blocks(parent, ctx){
      var items = []; collect(parent, ctx, items);
      return items.map(function(it, i){ return it.p ? paraHtml(it, items[i - 1], items[i + 1]) : it.html; }).join('');
    }

    // ---------- chuyển đổi ----------
    function convert(buf){
      return readZip(buf).then(function(zip){
        var names = ['word/document.xml', 'word/styles.xml', 'word/numbering.xml', 'word/_rels/document.xml.rels', 'word/settings.xml'];
        return Promise.all(names.map(function(n){ return zip.text(n); })).then(function(tx){
          var media = zip.names().filter(function(n){ return /^word\/media\//i.test(n); });
          return Promise.all(media.map(function(n){ return zip.bytes(n); })).then(function(arr){
            var parser = new DOMParser();
            function px(t){ if (!t) return null; var d = parser.parseFromString(t, 'application/xml'); return d.getElementsByTagName('parsererror').length ? null : d; }
            var docX = px(tx[0]); if (!docX) throw new Error('no-document-xml');
            S = { media: {}, rels: {} };
            var MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', svg: 'image/svg+xml' };
            media.forEach(function(n, i){
              var ext = (n.split('.').pop() || '').toLowerCase();
              if (arr[i] && MIME[ext]) S.media[n] = URL.createObjectURL(new Blob([arr[i]], { type: MIME[ext] }));
            });
            var relX = px(tx[3]);
            if (relX) kids(relX.documentElement).forEach(function(r){
              S.rels[r.getAttribute('Id')] = { target: r.getAttribute('Target') || '', ext: r.getAttribute('TargetMode') === 'External' };
            });
            parseStyles(px(tx[1])); parseNumbering(px(tx[2]));
            var setX = px(tx[4]), dt = setX ? first(setX.documentElement, 'defaultTabStop') : null;
            S.defTab = dt ? (num(attr(dt, 'val')) || 720) : 720;
            var baseR = resolveR(S.defParaId, null, {}, {});
            S.baseHalf = baseR.sz || 22;
            S.baseFont = baseR.font || S.defR.font || '';
            S.basePt = S.baseHalf / 2;
            var body = first(docX.documentElement, 'body');
            var sp = first(body, 'sectPr'), pg = sp ? first(sp, 'pgSz') : null, pm = sp ? first(sp, 'pgMar') : null;
            S.marL = pm ? (num(attr(pm, 'left')) || 1440) : 1440;
            S.textW = (pg ? (num(attr(pg, 'w')) || 11906) : 11906) - S.marL - (pm ? (num(attr(pm, 'right')) || 1440) : 1440);
            if (!(S.textW > 0)) S.textW = 9026;
            var html = blocks(body, { inTable: false, tblStyle: null });
            return { html: html, basePt: S.basePt, defTab: S.defTab, emw: S.textW / 20 / S.basePt, font: S.baseFont };
          });
        });
      });
    }

    // ---------- căn tab sau khi dựng (cần đo vị trí thật trên trang) ----------
    function layoutTabs(root){
      if (!root || !root.clientWidth) return;
      var cs = getComputedStyle(root), u = parseFloat(cs.fontSize) || 16;
      var basePt = parseFloat(root.getAttribute('data-basept')) || 11, defTw = parseFloat(root.getAttribute('data-deftab')) || 720;
      function T(tw){ return tw / 20 / basePt * u; }
      var tabs = root.querySelectorAll('.dx-tab'), i;
      for (i = 0; i < tabs.length; i++) { tabs[i].style.width = '0px'; tabs[i].style.borderBottom = ''; }
      for (i = 0; i < tabs.length; i++) {
        var tb = tabs[i], p = tb.closest('.dx-p'); if (!p) continue;
        var anc = (p.parentElement && p.parentElement.closest('td,.dx-tb,.dx-doc')) || root, acs = getComputedStyle(anc);
        var origin = anc.getBoundingClientRect().left + (parseFloat(acs.paddingLeft) || 0);
        var x = tb.getBoundingClientRect().left - origin;
        var stops = [], sa = p.getAttribute('data-dxt');
        if (sa) sa.split(',').forEach(function(s){ var a = s.split(':'); stops.push({ x: T(parseFloat(a[0])), val: a[1], leader: a[2] }); });
        var stop = null, j;
        for (j = 0; j < stops.length; j++) if (stops[j].x > x + 1) { stop = stops[j]; break; }
        var w;
        if (stop) {
          w = stop.x - x;
          if (stop.val === 'right' || stop.val === 'center' || stop.val === 'end' || stop.val === 'decimal') {
            var rg = document.createRange(); rg.setStartAfter(tb);
            var nx = tabs[i + 1];
            if (nx && nx.closest('.dx-p') === p) rg.setEndBefore(nx); else if (p.lastChild) rg.setEndAfter(p.lastChild);
            var sw = rg.getBoundingClientRect().width || 0;
            w = (stop.val === 'center') ? stop.x - x - sw / 2 : stop.x - x - sw;
          }
          if (stop.leader && stop.leader !== 'none') tb.style.borderBottom = '1px ' + (stop.leader === 'hyphen' ? 'dashed' : (stop.leader === 'underscore' ? 'solid' : 'dotted')) + ' currentColor';
        } else {
          var d = T(defTw); w = (Math.floor((x + 1) / d) + 1) * d - x;
        }
        tb.style.width = Math.max(0, w) + 'px';
      }
    }
    function mount(container, res){
      var st = '';
      if (res.font) { var ff = cssFont(res.font); if (ff) st += 'font-family:' + ff + ';'; }
      container.innerHTML = '<div class="dx-doc"' + (st ? ' style="' + st + '"' : '') +
        ' data-basept="' + res.basePt + '" data-deftab="' + res.defTab + '" data-emw="' + fmt(res.emw || 0) + '">' + res.html + '</div>';
      var root = container.firstChild;
      layoutTabs(root);
      var raf = 0;
      function again(){ if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(function(){ raf = 0; layoutTabs(root); }); }
      if (window.ResizeObserver) new ResizeObserver(function(){ again(); }).observe(container);
      else window.addEventListener('resize', again);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
      return root;
    }
    return { convert: convert, mount: mount, layoutTabs: layoutTabs };
  })();
  window.DocxView = DocxView;


  // ================================================================================
  // ===== ĐĂNG BÀI TỰ ĐỘNG TỪ SUPABASE (mục Thông báo / Tin ngành Toán kinh tế) =====
  // Dán CÙNG Project URL và anon key đã dùng ở trang đăng bài (dang-bai-supabase.html).
  // ================================================================================
  const SUPABASE_URL = "https://dawnjnljkferinamktiq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhd25qbmxqa2ZlcmluYW1rdGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjY5NjgsImV4cCI6MjEwNDAwMjk2OH0.gWZoU3nLm4otno3eUDj9N_iRNyEPipobOm5fkOlHYao";
  const SUPABASE_TABLE = "posts";
  const NEWS_FEED_URL = ""; // không dùng nữa, giữ lại để không vỡ code cũ tham chiếu biến này

  const __supabaseClient = (window.__sbCreate && SUPABASE_URL.indexOf('YOUR-PROJECT-REF') === -1)
    ? window.__sbCreate(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  // Chuyển 1 dòng trong bảng posts thành object "item" cùng hình dạng mà code hiển thị bên dưới đang mong đợi
  // Chuyển chuỗi base64 thành Blob URL (blob:...) ngắn gọn, thay vì nhúng data:... rất dài
  // (data URI quá dài khiến một số trình duyệt/app trong ứng dụng không mở được link).
  function base64ToBlobUrl(base64, mime){
    try {
      if (!base64) return '';
      // Nếu chuỗi lưu dạng đầy đủ "data:...;base64,AAAA..." (do FileReader.readAsDataURL),
      // chỉ lấy phần base64 thuần sau dấu phẩy để atob() không bị lỗi.
      var comma = base64.indexOf(',');
      var pure = (base64.indexOf('data:') === 0 && comma !== -1) ? base64.slice(comma + 1) : base64;
      const byteChars = atob(pure);
      const byteLen = byteChars.length;
      const byteArray = new Uint8Array(byteLen); // typed array: nhẹ hơn nhiều so với new Array(...)
      for (let i = 0; i < byteLen; i++) byteArray[i] = byteChars.charCodeAt(i);
      var okMime = /^(image\/(png|jpe?g|gif|webp|avif)|application\/pdf|application\/(msword|vnd\.openxmlformats-officedocument\.[a-z.]+)|application\/octet-stream)$/i.test(String(mime || ''));
      const blob = new Blob([byteArray], { type: okMime ? mime : 'application/octet-stream' });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('[base64ToBlobUrl] Lỗi giải mã file:', e);
      return '';
    }
  }

  // Chỉ cho phép link http(s) hoặc blob; chặn javascript:, data:, vbscript:... từ dữ liệu CSDL
  function safeUrl(u){
    u = String(u == null ? '' : u).trim();
    return (/^(https?:\/\/|blob:)/i.test(u) || /^[-\w]{25,}$/.test(u)) ? u : ''; // cho phép cả mã file Google Drive thuần
  }

  function mapSupabaseRow(row){
    const image = row.image_url ? row.image_url : (row.image_base64
      ? base64ToBlobUrl(row.image_base64, row.image_type || 'image/jpeg')
      : '');
    const word = safeUrl(row.word_url) ? safeUrl(row.word_url) : (row.word_base64
      ? base64ToBlobUrl(row.word_base64, row.word_type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      : '');
    let pdfs = [];
    if (Array.isArray(row.pdfs)) {
      pdfs = row.pdfs.filter(p => p && (p.base64 || p.url)).map(p => ({
        name: p.name || '',
        section: p.section || '',
        url: safeUrl(p.url) ? safeUrl(p.url) : base64ToBlobUrl(p.base64, p.type || 'application/pdf')
      }));
    }
    // Ghi chú chữ của các mục (Thư viện) được lưu cùng mảng pdfs dưới dạng kind:'note'
    const sectionNotes = {};
    if (Array.isArray(row.pdfs)) {
      row.pdfs.forEach(p => { if (p && p.kind === 'note' && p.section && p.text) sectionNotes[p.section] = String(p.text); });
    }
    return {
      id: String(row.id),
      time: row.created_at,
      category: row.category || '',
      title: row.title || '',
      badge: row.badge || '',
      content: row.content || '',
      detail: row.detail || '',
      docUrl: safeUrl(row.doc_url),
      image: image,
      word: word,
      wordRawBase64: row.word_base64 || '',
      wordName: row.word_name || '',
      pdfs: pdfs,
      sectionNotes: sectionNotes
    };
  }

  // Cache RAW dữ liệu từ Supabase (giữ base64 gốc) trong bộ nhớ của trang hiện tại.
  // Không dùng sessionStorage vì dữ liệu base64 (ảnh/Word/PDF) có thể rất lớn,
  // dễ vượt hạn mức sessionStorage; và Blob URL chỉ dùng được trong đúng phiên trang hiện tại.
  let __newsRawRows = null;
  let __newsFeedPromise = null;
  let __newsFeedItems = null;
  const __newsImages = {};
  // Danh sách chỉ lấy các cột NHẸ (không kèm file PDF/Word/ảnh base64) -> hiện ngay.
  // (Tuỳ chọn) Tên cột chứa LINK ảnh thu nhỏ (vd 'thumb_url' trên Supabase Storage). Để '' nếu chưa có cột này.
  // Khi có cột, thẻ tin dùng link trực tiếp -> không cần tải base64 ảnh bìa nữa.
  const NEWS_THUMB_COL = '';
  const NEWS_LIGHT_COLS = 'id,created_at,category,title,badge,content,doc_url,word_name' + (NEWS_THUMB_COL ? ',' + NEWS_THUMB_COL : '');
  const COVER_MAX_PX = 1200; // cạnh dài tối đa của ảnh bìa hiển thị trên thẻ

  // Giải mã base64 -> thu nhỏ còn <= COVER_MAX_PX (webp) -> giảm RAM và công vẽ ảnh khi có nhiều thẻ tin
  function makeCoverUrl(base64, mime){
    const full = base64ToBlobUrl(base64, mime);
    if (!full || !window.createImageBitmap || !HTMLCanvasElement.prototype.toBlob) return Promise.resolve(full);
    return fetch(full).then(r => r.blob()).then(b => createImageBitmap(b)).then(bm => {
      const sc = Math.min(1, COVER_MAX_PX / Math.max(bm.width, bm.height));
      if (sc >= 1) { if (bm.close) bm.close(); return full; }
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(bm.width * sc)); c.height = Math.max(1, Math.round(bm.height * sc));
      c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
      if (bm.close) bm.close();
      return new Promise(res => c.toBlob(bl => {
        if (!bl) { res(full); return; }
        URL.revokeObjectURL(full);
        res(URL.createObjectURL(bl));
      }, 'image/webp', 0.88));
    }).catch(() => full);
  }

  function applyNewsImages(){
    Object.keys(__newsImages).forEach(function(id){
      var url = __newsImages[id];
      if (!url) return;
      var sel = 'a[href="?post=' + encodeURIComponent(id) + '"]';
      document.querySelectorAll(sel).forEach(function(a){
        if (a.dataset.imgSet) return;
        var th = a.querySelector('.news-card-thumb,.hn-marquee-thumb,.hn-featured-thumb,.hn-featured-item-thumb');
        if (th) {
          th.style.backgroundImage = "url('" + url + "')";
          th.style.backgroundSize = 'cover';
          th.style.backgroundPosition = 'center';
          a.dataset.imgSet = '1';
        } else if (a.classList.contains('notice-card')) {
          var body = a.querySelector('.notice-body');
          if (body) {
            var im = document.createElement('img');
            im.src = url; im.alt = ''; im.loading = 'lazy';
            im.style.cssText = 'margin-top:10px;border-radius:12px;max-width:100%;display:block;';
            body.appendChild(im);
          }
          a.dataset.imgSet = '1';
        }
      });
    });
  }
  window.__applyNewsImages = applyNewsImages;

  // Ảnh bìa tải nền: 1 luồng, nhóm nhỏ, bài mới trước, TẠM DỪNG khi đang đọc bài (nhường băng thông cho bài)
  function startNewsImageLoading(rows){
    var ids = rows.map(function(r){ return String(r.id); }).filter(function(id){ return !__newsImages[id]; });
    var batches = [];
    for (var i = 0; i < ids.length; i += 3) batches.push(ids.slice(i, i + 3));
    var next = 0;
    function worker(){
      if (next >= batches.length) return Promise.resolve();
      if (document.body.classList.contains('article-mode')) {
        // đang đọc bài -> chờ rồi kiểm tra lại, tiếp tục khi người dùng về trang chủ
        return new Promise(function(r){ setTimeout(r, 800); }).then(worker);
      }
      var batch = batches[next++];
      return __supabaseClient.from(SUPABASE_TABLE).select('id,image_url,image_base64,image_type').in('id', batch)
        .then(function(res){
          return Promise.all((res.data || []).map(function(r){
            if (r.image_url) { __newsImages[String(r.id)] = r.image_url; if (typeof out !== 'undefined') out[String(r.id)] = r.image_url; return null; }
            if (!r.image_base64) return null;
            return makeCoverUrl(r.image_base64, r.image_type || 'image/jpeg').then(function(u){ __newsImages[String(r.id)] = u; });
          }));
        })
        .then(applyNewsImages)
        .catch(function(e){ console.warn('[ảnh bìa] lỗi tải', e); })
        .then(worker);
    }
    worker();
  }

  function loadNewsFeed(force){
    if (!__supabaseClient) return Promise.resolve([]);
    if (!force && __newsFeedItems) return Promise.resolve(__newsFeedItems);
    if (!force && __newsFeedPromise) return __newsFeedPromise;
    const q = (cols) => __supabaseClient.from(SUPABASE_TABLE).select(cols)
      .order('created_at', { ascending: false }).limit(120);
    let earlyFeed = null;
    if (!force && !NEWS_THUMB_COL && window.__sbEarly && window.__sbEarly.feed) { earlyFeed = window.__sbEarly.feed; window.__sbEarly.feed = null; }
    __newsFeedPromise = (earlyFeed ? Promise.resolve(earlyFeed) : q(NEWS_LIGHT_COLS))
      .then(res => {
        if (!res.error) return { data: res.data, light: true };
        // Nếu tên cột khác dự kiến thì quay về cách cũ
        return q('*').then(r => { if (r.error) throw r.error; return { data: r.data, light: false }; });
      })
      .then(({ data, light }) => {
        __newsRawRows = Array.isArray(data) ? data : [];
        const items = __newsRawRows.map(mapSupabaseRow);
        __newsFeedItems = items;
        if (NEWS_THUMB_COL) __newsRawRows.forEach(function(r){ if (r[NEWS_THUMB_COL]) __newsImages[String(r.id)] = r[NEWS_THUMB_COL]; });
        if (light) setTimeout(function(){ applyNewsImages(); startNewsImageLoading(__newsRawRows); }, 0);
        return items;
      })
      .catch(err => {
        __newsFeedPromise = null;
        throw err;
      });
    return __newsFeedPromise;
  }
  // Mở bài: chỉ tải phần CHỮ của đúng bài đó (nhẹ) -> hiện ngay.
  // Không lấy image_base64 (trang bài không dùng ảnh bìa), word_base64 và pdfs (rất nặng).
  const ARTICLE_TEXT_COLS = 'id,created_at,category,title,badge,content,detail,doc_url,word_name,word_type';
  // Cache bài đã tải trong bộ nhớ (tối đa 20 bài) -> mở lại / mở sau khi rê chuột vào gần như tức thì
  const __articleCache = new Map();
  function loadArticleFull(postId){
    if (!__supabaseClient) return Promise.resolve([]);
    const key = String(postId);
    if (__articleCache.has(key)) return __articleCache.get(key);
    // Nếu trang được mở bằng ?post=... thì request đã được gửi từ <head> -> dùng lại, không gửi lần 2
    const eb = window.__sbEarly || {};
    let src = null;
    if (eb.article && key === String(new URLSearchParams(location.search).get('post'))) { src = eb.article; eb.article = null; }
    if (!src) src = __supabaseClient.from(SUPABASE_TABLE).select(ARTICLE_TEXT_COLS).eq('id', postId).limit(1);
    const p = Promise.resolve(src)
      .then(res => {
        if (res.error) throw res.error;
        if (res.data && res.data.length) return [mapSupabaseRow(res.data[0])];
        __articleCache.delete(key); // không tìm thấy -> không cache
        return loadNewsFeed();
      })
      .catch(() => { __articleCache.delete(key); return loadNewsFeed(); });
    __articleCache.set(key, p);
    if (__articleCache.size > 20) __articleCache.delete(__articleCache.keys().next().value);
    return p;
  }
  // Tải trước bài (chữ + file đính kèm) khi người dùng sắp bấm
  window.__prefetchArticle = function(postId){
    try {
      if (!postId || !__supabaseClient) return;
      loadArticleFull(postId).then(function(items){
        const it = Array.isArray(items) && items.find(function(x){ return String(x.id || '') === String(postId); });
        if (it && typeof loadArticleFiles === 'function') loadArticleFiles(it, postId).catch(function(){});
      }).catch(function(){});
    } catch (e) {}
  };
  // File đính kèm (Word/PDF) tải SAU, ở nền, sau khi chữ đã hiện. Gắn vào chính object `it`.
  const __articleFilesCache = {};
  function loadArticleFiles(it, postId){
    if (!__supabaseClient) return Promise.resolve(it);
    const key = String(postId);
    if (!__articleFilesCache[key]) {
      __articleFilesCache[key] = __supabaseClient.from(SUPABASE_TABLE)
        .select('word_url,word_base64,word_type,pdfs').eq('id', postId).limit(1)
        .then(res => (res && res.data && res.data[0]) || {})
        .catch(e => { console.warn('[file đính kèm] lỗi tải', e); delete __articleFilesCache[key]; return {}; });
    }
    return __articleFilesCache[key].then(row => {
      const m = mapSupabaseRow(Object.assign({}, row, { id: postId, word_name: it.wordName }));
      it.word = m.word;
      it.wordRawBase64 = m.wordRawBase64;
      it.pdfs = m.pdfs;
      it.sectionNotes = m.sectionNotes;
      return it;
    });
  }
  window.__loadArticleFiles = loadArticleFiles;
  window.__loadArticleFull = loadArticleFull;
  window.__loadNewsFeed = loadNewsFeed;
  // Lấy ảnh bìa cho vài bài (dùng cho cột "Tin cùng chuyên mục")
  window.__getNewsCovers = function(ids){
    const out = {};
    const need = (ids || []).map(String).filter(function(id){ if (__newsImages[id]) { out[id] = __newsImages[id]; return false; } return true; });
    if (!need.length || !__supabaseClient) return Promise.resolve(out);
    return __supabaseClient.from(SUPABASE_TABLE).select('id,image_url,image_base64,image_type').in('id', need)
      .then(function(res){
        return Promise.all((res.data || []).map(function(r){
          if (r.image_url) { __newsImages[String(r.id)] = r.image_url; if (typeof out !== 'undefined') out[String(r.id)] = r.image_url; return null; }
            if (!r.image_base64) return null;
          return makeCoverUrl(r.image_base64, r.image_type || 'image/jpeg').then(function(u){ __newsImages[String(r.id)] = u; out[String(r.id)] = u; });
        }));
      }).then(function(){ return out; }).catch(function(){ return out; });
  };

  (function initNewsFeed(){
    if (!__supabaseClient) {
      // Thư viện Supabase không tải được (mất mạng / bị chặn) -> báo lỗi thay vì để "Đang tải…" mãi
      if (SUPABASE_URL.indexOf('YOUR-PROJECT-REF') === -1) {
                ['hnLatestTrack','libGrid'].forEach(function(id){
          var el = document.getElementById(id); if (!el) return;
          var host = el;
          // "Tin mới nhất" là băng chuyền: thay cả khung cuộn để thẻ lỗi không bị cắt
          if (id === 'hnLatestTrack') {
            host = document.getElementById('hnLatestMarquee') || el.parentElement;
            host.style.maskImage = 'none';
            host.style.webkitMaskImage = 'none';
          }
          host.innerHTML = '<div class="load-error" role="alert">'+
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.4 20.6 19H3.4z"/><path d="M12 9.4v4.2"/><path d="M12 16.5h.01"/></svg>'+
            '<strong>Chưa kết nối được máy chủ tin tức</strong>'+
            '<span>Hãy kiểm tra kết nối mạng rồi thử lại. Trong lúc chờ, bạn vẫn xem được các tin đã đăng trước đó.</span>'+
            '<button type="button" class="retry-news">Thử lại</button></div>';
          var b = host.querySelector('.retry-news'); if (b) b.addEventListener('click', function(){ location.reload(); });
        });
      }
      return;
    }

    const escapeHtml = (str) => String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const nl2br = (str) => escapeHtml(str).replace(/\n/g,'<br>');
    const fmtDate = (val) => {
      let d = null;
      if (val instanceof Date) {
        d = val;
      } else if (typeof val === 'number') {
        d = new Date(val);
      } else if (typeof val === 'string' && val.trim()) {
        d = new Date(val);
        if (isNaN(d.getTime())) {
          // thử định dạng kiểu Việt Nam: dd/mm/yyyy hoặc dd-mm-yyyy [hh:mm:ss]
          const m = val.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          if (m) d = new Date(+m[3], +m[2]-1, +m[1]);
        }
      }
      if (!d || isNaN(d.getTime())) return {day:'', mon:''};
      return { day: String(d.getDate()).padStart(2,'0'), mon: 'Th' + (d.getMonth()+1) + ' ' + d.getFullYear() };
    };

    loadNewsFeed()
      .then(items => {
        if (!Array.isArray(items) || !items.length) return;

        const thongBaoList = document.querySelector('#thong-bao .notice-list');
        const tinNganhGrid  = document.querySelector('#tin-nganh .news-grid');
        const hoiThaoGrid   = document.querySelector('#hoi-thao .news-grid');

        // Bài mới đăng luôn lên đầu, bài cũ xếp sau
        const __t = (x) => { const d = new Date(x.time); return isNaN(d.getTime()) ? 0 : d.getTime(); };
        items = items.slice().sort((a, b) => __t(b) - __t(a));

        items.forEach(it => {
          const cat = (it.category || '').trim();
          const chipLabel = ((it.badge || '').trim() || cat);
          const { day, mon } = fmtDate(it.time);
          const postId = String(it.id || it.time || '');

          if (cat === 'Thông báo' && thongBaoList) {
            const art = document.createElement('a');
            art.className = 'notice-card';
            art.href = '?post=' + encodeURIComponent(postId);
            art.innerHTML =
              '<div class="notice-date"><span class="day">' + day + '</span><span class="mon">' + mon + '</span></div>' +
              '<div class="notice-body">' +
                '<h3>' + escapeHtml(it.title) + '</h3>' +
                '<p>' + nl2br(it.content) + '</p>' +
                (it.image ? '<img src="' + it.image + '" alt="" style="margin-top:10px;border-radius:12px;max-width:100%;display:block;">' : '') +
              '</div>' +
              (it.badge ? '<span class="notice-tag">' + escapeHtml(it.badge) + '</span>' : '');
            thongBaoList.appendChild(art);
          }

          if (cat === 'Tin ngành Toán kinh tế' && tinNganhGrid) {
            const a = document.createElement('a');
            a.href = '?post=' + encodeURIComponent(postId);
            a.className = 'news-card';
            const thumbStyle = it.image
              ? "background-image:url('" + it.image + "');background-size:cover;background-position:center;"
              : '';
            a.innerHTML =
              '<div class="news-card-thumb" style="' + thumbStyle + '">' +
                (chipLabel ? '<span class="badge">' + escapeHtml(chipLabel) + '</span>' : '') +
              '</div>' +
              '<div class="news-card-body">' +
                '<div class="news-card-meta">' +
                  (day && mon ? '<span>' + day + ' ' + mon + '</span>' : '') +
                  (day && mon && chipLabel ? '<span class="dot"></span>' : '') +
                  (chipLabel ? '<span>' + escapeHtml(chipLabel) + '</span>' : '') +
                '</div>' +
                '<h3>' + escapeHtml(it.title) + '</h3>' +
                '<p>' + escapeHtml(it.content) + '</p>' +
              '</div>';
            tinNganhGrid.appendChild(a);
          }

          if (cat === 'Hội thảo - Tọa đàm' && hoiThaoGrid) {
            const a = document.createElement('a');
            a.href = '?post=' + encodeURIComponent(postId);
            a.className = 'news-card';
            const thumbStyle = it.image
              ? "background-image:url('" + it.image + "');background-size:cover;background-position:center;"
              : '';
            a.innerHTML =
              '<div class="news-card-thumb" style="' + thumbStyle + '">' +
                (chipLabel ? '<span class="badge">' + escapeHtml(chipLabel) + '</span>' : '') +
              '</div>' +
              '<div class="news-card-body">' +
                '<div class="news-card-meta">' +
                  (day && mon ? '<span>' + day + ' ' + mon + '</span>' : '') +
                  (day && mon && chipLabel ? '<span class="dot"></span>' : '') +
                  (chipLabel ? '<span>' + escapeHtml(chipLabel) + '</span>' : '') +
                '</div>' +
                '<h3>' + escapeHtml(it.title) + '</h3>' +
                '<p>' + escapeHtml(it.content) + '</p>' +
              '</div>';
            hoiThaoGrid.appendChild(a);
          }
        });

        // ===== Phân trang: tối đa 9 bài / trang, đánh số bên dưới =====
        const PER_PAGE = 9;
        function paginate(container){
          if (!container) return;
          const cards = Array.from(container.children).filter(c => !c.classList.contains('pg-bar'));
          const host = container.parentNode;
          let bar = host.querySelector(':scope > .pg-bar');
          if (bar) bar.remove();
          const pages = Math.ceil(cards.length / PER_PAGE);
          if (pages <= 1) { cards.forEach(c => c.style.display = ''); return; }
          bar = document.createElement('nav');
          bar.className = 'pg-bar'; bar.setAttribute('aria-label', 'Phân trang');
          container.after(bar);
          let cur = 1;
          function show(n, scroll){
            cur = Math.min(Math.max(n, 1), pages);
            cards.forEach((c, i) => { c.style.display = (i >= (cur-1)*PER_PAGE && i < cur*PER_PAGE) ? '' : 'none'; });
            let h = '<button type="button" class="pg-btn pg-prev" data-p="' + (cur-1) + '"' + (cur===1?' disabled':'') + ' aria-label="Trang trước">‹</button>';
            for (let i = 1; i <= pages; i++) {
              h += '<button type="button" class="pg-btn' + (i===cur?' active':'') + '" data-p="' + i + '"' + (i===cur?' aria-current="page"':'') + '>' + i + '</button>';
            }
            h += '<button type="button" class="pg-btn pg-next" data-p="' + (cur+1) + '"' + (cur===pages?' disabled':'') + ' aria-label="Trang sau">›</button>';
            bar.innerHTML = h;
            if (scroll) { try { host.scrollIntoView({ behavior:'smooth', block:'start' }); } catch(e){} }
          }
          bar.addEventListener('click', function(e){
            const b = e.target.closest('.pg-btn');
            if (!b || b.disabled) return;
            show(parseInt(b.getAttribute('data-p'), 10), true);
          });
          show(1, false);
        }
        // ===== Trang "Tất cả tin": mọi tin mới nhất trừ tài liệu Thư viện =====
        const allGrid = document.getElementById('allNewsGrid');
        if (allGrid) {
          const all = items.filter(it => String(it.category || '').trim() !== 'Thư viện');
          allGrid.innerHTML = '';
          if (!all.length) allGrid.innerHTML = '<div class="lib-empty">Chưa có tin nào.</div>';
          all.forEach(it => {
            const { day, mon } = fmtDate(it.time);
            const postId = String(it.id || it.time || '');
            const catLabel = String(it.category || '').trim();
            const chipLabel = ((it.badge || '').trim() || catLabel);
            const a = document.createElement('a');
            a.href = '?post=' + encodeURIComponent(postId);
            a.className = 'news-card';
            const thumbStyle = it.image
              ? "background-image:url('" + it.image + "');background-size:cover;background-position:center;" : '';
            a.innerHTML =
              '<div class="news-card-thumb" style="' + thumbStyle + '">' +
                (chipLabel ? '<span class="badge">' + escapeHtml(chipLabel) + '</span>' : '') +
              '</div>' +
              '<div class="news-card-body">' +
                '<div class="news-card-meta">' +
                  (day && mon ? '<span>' + day + ' ' + mon + '</span>' : '') +
                  (day && mon && chipLabel ? '<span class="dot"></span>' : '') +
                  (chipLabel ? '<span>' + escapeHtml(chipLabel) + '</span>' : '') +
                '</div>' +
                '<h3>' + escapeHtml(it.title) + '</h3>' +
                '<p>' + escapeHtml(it.content) + '</p>' +
              '</div>';
            allGrid.appendChild(a);
          });
          paginate(allGrid);
        }
        paginate(thongBaoList);
        paginate(tinNganhGrid);
        paginate(hoiThaoGrid);

        setTimeout(applyNewsImages, 0);
        // ===== Thư viện: tài liệu PDF =====
        (function fillLibrary(){
          const grid = document.getElementById('libGrid');
          if (!grid) return;
          const libs = items.filter(function(it){
            return String(it.category || '').trim() === 'Thư viện';
          });
          if (!libs.length) {
            grid.innerHTML = '<div class="lib-empty">Chưa có tài liệu.</div>';
            return;
          }
          grid.innerHTML = '';
          libs.forEach(function(it){
            const postId = String(it.id || it.time || '');
            const { day, mon } = fmtDate(it.time);
            const a = document.createElement('a');
            a.className = 'lib-card';
            a.href = '?post=' + encodeURIComponent(postId);
            const dateLabel = (day && mon) ? (day + ' ' + mon) : '';
            a.innerHTML =
              '<div class="lib-card-top">' +
                '<div class="lib-card-icon">' + ((it.word || it.wordName) && !(it.pdfs && it.pdfs.length) ? 'DOC' : 'PDF') + '</div>' +
                (it.badge ? '<span class="lib-badge">' + escapeHtml(it.badge) + '</span>' : '') +
              '</div>' +
              '<h3>' + escapeHtml(it.title || 'Tài liệu') + '</h3>' +
              '<p>' + escapeHtml(it.content || '') + '</p>' +
              '<div class="lib-card-meta">' +
                (dateLabel ? '<span>' + dateLabel + '</span>' : '') +
                (dateLabel ? '<span class="dot"></span>' : '') +
                '<span>' + ((it.word || it.wordName) && !(it.pdfs && it.pdfs.length) ? 'Xem / tải file Word' : 'Xem / tải PDF') + '</span>' +
              '</div>';
            grid.appendChild(a);
          });
        })();



        // ===== Tin mới nhất (trang chủ): TẤT CẢ tin — băng chuyền lướt ngang =====
        (function fillLatestMarquee(){
          const track = document.getElementById('hnLatestTrack');
          if (!track || !items.length) return;
          // Không đưa tài liệu Thư viện vào băng tin trang chủ
          items = items.filter(function(it){ return String(it.category||'').trim() !== 'Thư viện'; });
          if (!items.length) { track.innerHTML = ''; return; }

          const cardHtml = (it) => {
            const postId = String(it.id || it.time || '');
            const { day, mon } = fmtDate(it.time);
            const thumbStyle = it.image
              ? "background-image:url('" + String(it.image).replace(/'/g, "\\'") + "');"
              : '';
            const cat = escapeHtml(it.category || it.badge || '');
            const dateLabel = (day && mon) ? (day + ' ' + mon) : '';
            return (
              '<a class="hn-marquee-card" href="?post=' + encodeURIComponent(postId) + '">' +
                '<div class="hn-marquee-thumb" style="' + thumbStyle + '">' +
                  (it.badge ? '<span class="badge">' + escapeHtml(it.badge) + '</span>' : '') +
                '</div>' +
                '<div class="hn-marquee-body">' +
                  '<div class="hn-marquee-meta">' +
                    (dateLabel ? '<span>' + dateLabel + '</span>' : '') +
                    (dateLabel && cat ? '<span class="dot"></span>' : '') +
                    (cat ? '<span>' + cat + '</span>' : '') +
                  '</div>' +
                  '<h4>' + escapeHtml(it.title || '') + '</h4>' +
                  '<p>' + escapeHtml(it.content || '') + '</p>' +
                '</div>' +
              '</a>'
            );
          };

          // Nhân đôi danh sách để animation translateX(-50%) lặp liền mạch
          const once = items.map(cardHtml).join('');
          track.innerHTML = once + once;

          // Điều chỉnh tốc độ theo số lượng thẻ (ít tin → chậm hơn một chút)
          const n = Math.max(items.length, 1);
          const sec = Math.min(90, Math.max(28, n * 6));
          track.style.animationDuration = sec + 's';
        })();

        // Bỏ Thư viện khỏi tin nổi bật / tin mới nhất (chỉ hiện ở mục Thư viện)
        items = items.filter(function(it){ return String(it.category||'').trim() !== 'Thư viện'; });

        // ===== Tin nổi bật: luôn đẩy bài mới nhất lên đầu =====
        // items đã được Apps Script trả về theo thứ tự mới nhất trước (newest-first).
        if (items.length) {
          const featuredMain = document.querySelector('.hn-featured-main');
          const featuredItems = document.querySelectorAll('.hn-featured-item');

          const top = items[0];
          if (featuredMain && top) {
            const postId = String(top.id || top.time || '');
            const { day, mon } = fmtDate(top.time);
            featuredMain.href = '?post=' + encodeURIComponent(postId);
            featuredMain.removeAttribute('data-tab');
            featuredMain.removeAttribute('data-scroll');

            const thumb = featuredMain.querySelector('.hn-featured-thumb');
            if (thumb) {
              thumb.style.backgroundImage = top.image ? "url('" + top.image + "')" : '';
              thumb.style.backgroundSize = 'cover';
              thumb.style.backgroundPosition = 'center';
              const b = thumb.querySelector('.badge');
              if (b) b.textContent = top.badge || 'Nổi bật';
            }
            const meta = featuredMain.querySelector('.news-card-meta');
            if (meta) {
              let m = '';
              if (day && mon) m += '<span>' + day + ' ' + mon + '</span>';
              if (day && mon && top.category) m += '<span class="dot"></span>';
              if (top.category) m += '<span>' + escapeHtml(top.category) + '</span>';
              meta.innerHTML = m;
            }
            const h3 = featuredMain.querySelector('.hn-featured-body h3');
            if (h3) h3.textContent = top.title || '';
            const p = featuredMain.querySelector('.hn-featured-body p');
            if (p) p.textContent = top.content || '';
          }

          const rest = items.slice(1, 1 + featuredItems.length);
          featuredItems.forEach((el, i) => {
            const it = rest[i];
            if (!it) { el.style.display = 'none'; return; }
            el.style.display = '';
            const postId = String(it.id || it.time || '');
            const { day, mon } = fmtDate(it.time);
            el.href = '?post=' + encodeURIComponent(postId);
            el.removeAttribute('data-tab');
            el.removeAttribute('data-scroll');

            const thumb = el.querySelector('.hn-featured-item-thumb');
            if (thumb) {
              thumb.style.backgroundImage = it.image ? "url('" + it.image + "')" : '';
              thumb.style.backgroundSize = 'cover';
              thumb.style.backgroundPosition = 'center';
            }
            const meta = el.querySelector('.news-card-meta');
            if (meta) {
              let m = '';
              if (day && mon) m += '<span>' + day + ' ' + mon + '</span>';
              if (day && mon && it.category) m += '<span class="dot"></span>';
              if (it.category) m += '<span>' + escapeHtml(it.category) + '</span>';
              meta.innerHTML = m;
            }
            const h4 = el.querySelector('.hn-featured-item-body h4');
            if (h4) h4.textContent = it.title || '';
          });
        }
      })
      .catch(err => {
        console.error('[Supabase] Không tải được bài viết:', err);
        const msg = '<div class="load-error" role="alert">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.4 20.6 19H3.4z"/><path d="M12 9.4v4.2"/><path d="M12 16.5h.01"/></svg>'+
          '<strong>'+(navigator.onLine === false ? 'Bạn đang không có kết nối mạng' : 'Không tải được dữ liệu tin tức')+'</strong>'+
          '<span>'+(navigator.onLine === false ? 'Kiểm tra Wi‑Fi/4G rồi thử lại để xem tin mới nhất.' : 'Máy chủ chưa phản hồi. Vui lòng thử lại sau ít phút.')+'</span>'+
          '<button type="button" class="retry-news">Thử lại</button></div>';
              ['hnLatestTrack','libGrid'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        let host = el;
        // "Tin mới nhất" là băng chuyền: thay cả khung cuộn để thẻ lỗi không bị cắt
        if (id === 'hnLatestTrack') {
          host = document.getElementById('hnLatestMarquee') || el.parentElement;
          host.style.maskImage = 'none';
          host.style.webkitMaskImage = 'none';
        }
        host.innerHTML = msg;
        const b = host.querySelector('.retry-news'); if (b) b.addEventListener('click', () => location.reload());
        });
      });
  })();


  // ===== Tiện ích PDF trên trang bài =====
  function driveFileIdFromUrl(url){
    if (!url) return '';
    var s = String(url);
    if (s.indexOf('data:') === 0 || s.indexOf('blob:') === 0) return ''; // dữ liệu từ Supabase, không phải link Drive
    if (/^https?:\/\/[^\/]*supabase\.co\//i.test(s)) return ''; // link file trong Supabase Storage, không phải Drive (tránh nhầm tên file dài thành mã Drive)
    // Link Cloudflare R2 / CDN / URL không phải Google: KHÔNG phải Drive (tránh nhầm hostname pub-xxxx.r2.dev hay tên file dài thành mã Drive)
    if (/^https?:\/\//i.test(s) && !/^https?:\/\/(drive|docs)\.google\.com\//i.test(s)) return '';
    var m = s.match(/\/d\/([-\w]{25,})/);
    if (m) return m[1];
    m = s.match(/[?&]id=([-\w]{25,})/);
    if (m) return m[1];
    if (/^[-\w]{25,}$/.test(s)) return s; // chuỗi chỉ gồm mã Drive
    return '';
  }
  function extractPdfsFromItem(it){
    var list = [];
    if (!it) return list;
    if (it.pdfs && it.pdfs.length) {
      for (var i = 0; i < it.pdfs.length; i++) {
        var p = it.pdfs[i];
        if (!p) continue;
        if (typeof p === 'string' && p.trim()) list.push({ name: '', url: safeUrl(p) });
        else if (p.url) list.push({ name: p.name || '', url: safeUrl(p.url) });
      }
    }
    if (!list.length && it.pdf && String(it.pdf).trim()) {
      list.push({ name: it.pdfName || '', url: String(it.pdf).trim() });
    }
    if (!list.length) {
      var blob = String(it.detail || '') + ' ' + String(it.content || '');
      var re = /data-pdf-url="([^"]+)"/gi;
      var names = [];
      var re2 = /data-pdf-name="([^"]+)"/gi;
      var m2;
      while ((m2 = re2.exec(blob)) !== null) names.push(m2[1]);
      var m, idx = 0;
      while ((m = re.exec(blob)) !== null) {
        list.push({ name: names[idx] || '', url: m[1] });
        idx++;
      }
      if (!list.length) {
        var m3 = blob.match(/https:\/\/drive\.google\.com\/file\/d\/([-\w]{25,})[^"'\s]*/i);
        if (m3) list.push({ name: '', url: m3[0].replace(/["']+$/, '') });
      }
    }
    return list;
  }
  function renderArticlePdfFrame(it){
    var box = document.getElementById('apPdfBox');
    var frameWrap = document.getElementById('apPdfFrameWrap');
    var frame = document.getElementById('apPdfFrame');
    var listEl = document.getElementById('apPdfFileList');
    var titleEl = document.getElementById('apPdfTitle');
    var subEl = document.getElementById('apPdfSub');
    if (!box) return;

    var pdfs = extractPdfsFromItem(it);
    if (!pdfs.length) {
      box.classList.remove('show');
      if (frame) { frame.removeAttribute('src'); frame.removeAttribute('data-pdf-id'); }
      if (listEl) listEl.innerHTML = '';
      return;
    }

    box.classList.add('show');
    if (titleEl) {
      titleEl.textContent = pdfs.length > 1
        ? ('Tài liệu đính kèm (' + pdfs.length + ' file)')
        : (pdfs[0].name || (it.title ? (String(it.title) + ' — PDF') : 'Tài liệu đính kèm'));
    }
    var isMobile = window.matchMedia && window.matchMedia('(max-width:900px)').matches;
    if (subEl) {
      subEl.textContent = isMobile
        ? 'Bấm Xem trên từng file để mở trên điện thoại'
        : (pdfs.length > 1 ? 'Chọn file để xem bên dưới' : 'Xem trực tiếp bên dưới · hoặc tải về');
    }

    function openInFrame(pdf){
      var fileId = driveFileIdFromUrl(pdf.url);
      var previewUrl = fileId
        ? ('https://drive.google.com/file/d/' + fileId + '/preview')
        : pdf.url;
      if (frame && !isMobile) {
        if (frame.getAttribute('data-pdf-id') !== (fileId || pdf.url)) {
          frame.setAttribute('data-pdf-id', fileId || pdf.url);
          frame.src = previewUrl;
        }
        if (frameWrap) frameWrap.style.display = 'block';
      } else if (frame) {
        frame.removeAttribute('src');
        if (frameWrap) frameWrap.style.display = 'none';
      }
    }

    if (listEl) {
      listEl.innerHTML = '';
      pdfs.forEach(function(pdf, idx){
        var fileId = driveFileIdFromUrl(pdf.url);
        var viewUrl = fileId
          ? ('https://drive.google.com/file/d/' + fileId + '/view?usp=drivesdk')
          : pdf.url;
        var downloadUrl = fileId
          ? ('https://drive.google.com/uc?export=download&id=' + fileId)
          : pdf.url;
        var row = document.createElement('div');
        row.className = 'ap-pdf-file-row' + (idx === 0 ? ' active' : '');
        row.innerHTML =
          '<div class="ap-pdf-icon">PDF</div>' +
          '<div class="name"></div>' +
          '<div class="ap-pdf-actions">' +
            '<button type="button" class="ap-pdf-open">Xem</button>' +
            '<a class="ap-pdf-btn-view" target="_blank" rel="noopener noreferrer">Mở tab</a>' +
            '<a class="ap-pdf-btn-dl" target="_blank" rel="noopener noreferrer">Tải về</a>' +
          '</div>';
        row.querySelector('.name').textContent = pdf.name || ('File PDF ' + (idx + 1));
        row.querySelector('.ap-pdf-btn-view').href = viewUrl;
        row.querySelector('.ap-pdf-btn-dl').href = downloadUrl;
        if (!fileId) row.querySelector('.ap-pdf-btn-dl').setAttribute('download', pdf.name || ('tai-lieu-' + (idx + 1) + '.pdf'));
        row.querySelector('.ap-pdf-open').addEventListener('click', function(){
          listEl.querySelectorAll('.ap-pdf-file-row').forEach(function(r){ r.classList.remove('active'); });
          row.classList.add('active');
          if (isMobile) {
            try {
              var w = window.open(viewUrl, '_blank');
              if (!w) location.href = viewUrl;
            } catch (e) { location.href = viewUrl; }
          } else {
            openInFrame(pdf);
          }
        });
        listEl.appendChild(row);
      });
    }

    // Mặc định mở file đầu trên desktop
    openInFrame(pdfs[0]);
  }

  // ===== Đọc PDF -> hiện thành bài viết ngay trên trang (pdf.js, tải khi cần) =====
  var PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/';
  var __pdfjsPromise = null;
  function loadPdfJs(){
    if (!__pdfjsPromise) {
      __pdfjsPromise = import(PDFJS_BASE + 'pdf.min.mjs').then(function(lib){
        lib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.mjs';
        return lib;
      });
    }
    return __pdfjsPromise;
  }
  function escHtml(t){
    return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function linkifyHtml(t){
    return escHtml(t).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]”"'])/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  }
  // Gom các mảnh chữ của 1 trang thành dòng, rồi gom dòng thành đoạn văn / tiêu đề / gạch đầu dòng
  function pdfPageToBlocks(items){
    var rows = [];
    items.forEach(function(it){
      if (!it.str && !it.hasEOL) return;
      var tr = it.transform || [1,0,0,1,0,0];
      var size = Math.abs(tr[3]) || it.height || 10;
      var x = tr[4], y = tr[5];
      var row = null;
      for (var i = rows.length - 1; i >= 0 && i >= rows.length - 6; i--) {
        if (Math.abs(rows[i].y - y) <= Math.max(2, rows[i].size * 0.45)) { row = rows[i]; break; }
      }
      if (!row) { row = { y: y, size: size, parts: [], minX: x, maxX: x + (it.width || 0) }; rows.push(row); }
      row.parts.push({ x: x, w: it.width || 0, str: it.str });
      row.size = Math.max(row.size, size);
      row.minX = Math.min(row.minX, x);
      row.maxX = Math.max(row.maxX, x + (it.width || 0));
    });
    rows.sort(function(a,b){ return b.y - a.y; });
    var lines = rows.map(function(r){
      r.parts.sort(function(a,b){ return a.x - b.x; });
      var txt = '', prevEnd = null;
      r.parts.forEach(function(p){
        if (prevEnd !== null && p.x - prevEnd > r.size * 0.18 && !/^\s/.test(p.str) && !/\s$/.test(txt)) txt += ' ';
        txt += p.str;
        prevEnd = p.x + p.w;
      });
      return { text: txt.replace(/\s+/g,' ').trim(), y: r.y, size: r.size, minX: r.minX, maxX: r.maxX };
    }).filter(function(l){ return l.text; });
    return lines;
  }
  function pdfLinesToHtml(allPages){
    // thống kê cỡ chữ & lề để nhận diện tiêu đề, đoạn văn
    var sizes = [], minXs = [], maxXs = [];
    allPages.forEach(function(lines){ lines.forEach(function(l){
      if (l.fig) return;
      sizes.push(l.size); minXs.push(l.minX); maxXs.push(l.maxX);
    }); });
    if (!sizes.length) sizes.push(10), minXs.push(0), maxXs.push(100);
    var med = function(a){ var b=a.slice().sort(function(x,y){return x-y;}); return b[Math.floor(b.length/2)]; };
    var bodySize = med(sizes);
    var leftMargin = Math.min.apply(null, minXs.length > 20 ? minXs.slice().sort(function(a,b){return a-b;}).slice(0, Math.ceil(minXs.length*0.1)) : minXs);
    var rightEdge = med(maxXs.slice().sort(function(a,b){return b-a;}).slice(0, Math.max(1, Math.ceil(maxXs.length*0.3))));
    var fullW = Math.max(1, rightEdge - leftMargin);

    var html = [], para = null;
    function flush(){
      if (!para) return;
      var t = para.text.trim();
      if (t) {
        if (para.kind === 'h') html.push('<h3 class="pdf-h">' + linkifyHtml(t) + '</h3>');
        else if (para.kind === 'li') html.push('<p class="pdf-li">' + linkifyHtml(t) + '</p>');
        else html.push('<p' + (para.center ? ' class="pdf-center"' : '') + '>' + linkifyHtml(t) + '</p>');
      }
      para = null;
    }
    allPages.forEach(function(lines, pi){
      // bỏ số trang đơn lẻ ở đầu/cuối trang
      var textOnly = lines.filter(function(l){ return !l.fig; });
      if (textOnly.length && /^\d{1,3}$/.test(textOnly[0].text)) lines = lines.filter(function(l){ return l !== textOnly[0]; });
      if (textOnly.length > 1 && /^\d{1,3}$/.test(textOnly[textOnly.length-1].text)) lines = lines.filter(function(l){ return l !== textOnly[textOnly.length-1]; });
      var prev = null;
      lines.forEach(function(l){
        if (l.fig) { flush(); html.push('<img class="pdf-fig" alt="Hình trong bài viết" src="' + l.fig + '">'); prev = null; return; }
        var isHeading = l.size >= bodySize * 1.18 && l.text.length < 140;
        var isBullet = /^([•\-–—*▪●○]|\d{1,2}[.)]|[a-z][.)])\s+/.test(l.text) && l.text.length > 2;
        var lineW = l.maxX - l.minX;
        var centered = Math.abs(((l.minX + l.maxX)/2) - (leftMargin + fullW/2)) < fullW*0.04 && l.minX - leftMargin > fullW*0.08;
        var gap = prev ? (prev.y - l.y) : 0;
        var bigGap = prev && gap > Math.max(prev.size, l.size) * 1.75;
        var indent = l.minX - leftMargin > bodySize * 1.2 && !centered;
        var prevShort = prev && (prev.maxX - leftMargin) < fullW * 0.82;
        var prevEnds = prev && /[.!?:;…”"»)]$/.test(prev.text);
        var newPara = !para || isHeading || para.kind === 'h' || isBullet || bigGap || (indent && prevEnds) || (prevShort && prevEnds) || centered !== !!(para && para.center);
        if (newPara) {
          flush();
          para = { text: l.text, kind: isHeading ? 'h' : (isBullet ? 'li' : 'p'), center: centered && !isHeading };
        } else {
          // ghép dòng; nối từ bị ngắt bằng dấu gạch nối cuối dòng
          var lastTok = para.text.split(' ').pop();
          if (/https?:|\//.test(lastTok)) para.text += l.text; // link bị ngắt dòng: nối liền, giữ nguyên dấu gạch
          else if (/[A-Za-zÀ-ỹ]-$/.test(para.text) && /^[a-zà-ỹ]/.test(l.text)) para.text = para.text.slice(0,-1) + l.text;
          else para.text += ' ' + l.text;
        }
        prev = l;
      });
      // cuối trang: nếu đoạn kết thúc bằng dấu câu thì tách đoạn, không thì cho nối sang trang sau
      if (para && /[.!?:;…”"»)]$/.test(para.text)) flush();
    });
    flush();
    return html.join('\n');
  }

  // Tìm vị trí các ảnh trên trang PDF, rồi vẽ lại CHỈ vùng ảnh đó ở độ phân giải bằng (hoặc hơn) ảnh gốc
  function pdfPageFigures(lib, page){
    var OPS = lib.OPS;
    return page.getOperatorList().then(function(opList){
      var ctm = [1,0,0,1,0,0], stack = [], boxes = [];
      function comp(a, m){
        return [a[0]*m[0]+a[2]*m[1], a[1]*m[0]+a[3]*m[1], a[0]*m[2]+a[2]*m[3], a[1]*m[2]+a[3]*m[3],
                a[0]*m[4]+a[2]*m[5]+a[4], a[1]*m[4]+a[3]*m[5]+a[5]];
      }
      function nativeWidth(fn, args){
        // độ rộng (pixel) thật của ảnh nhúng trong PDF, để chọn độ phân giải vẽ lại
        try {
          if (fn === OPS.paintInlineImageXObject && args && args[0]) return args[0].width || 0;
          var name = args && args[0];
          if (typeof name !== 'string') return 0;
          var store = name.indexOf('g_') === 0 ? page.commonObjs : page.objs;
          if (store.has(name)) { var o = store.get(name); return (o && o.width) || 0; }
        } catch (e) {}
        return 0;
      }
      for (var i = 0; i < opList.fnArray.length; i++) {
        var fn = opList.fnArray[i], args = opList.argsArray[i];
        if (fn === OPS.save) stack.push(ctm.slice());
        else if (fn === OPS.restore) { if (stack.length) ctm = stack.pop(); }
        else if (fn === OPS.transform) ctm = comp(ctm, args);
        else if (fn === OPS.paintFormXObjectBegin) { stack.push(ctm.slice()); if (args && args[0]) ctm = comp(ctm, args[0]); }
        else if (fn === OPS.paintFormXObjectEnd) { if (stack.length) ctm = stack.pop(); }
        else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject ||
                 fn === OPS.paintImageMaskXObject || fn === OPS.paintJpegXObject) {
          var pts = [[0,0],[1,0],[0,1],[1,1]].map(function(q){
            return [ctm[0]*q[0]+ctm[2]*q[1]+ctm[4], ctm[1]*q[0]+ctm[3]*q[1]+ctm[5]];
          });
          var xs = pts.map(function(q){return q[0];}), ys = pts.map(function(q){return q[1];});
          boxes.push({ b: [Math.min.apply(null,xs), Math.min.apply(null,ys), Math.max.apply(null,xs), Math.max.apply(null,ys)],
                       nw: nativeWidth(fn, args) });
        }
      }
      var view = page.view, pw = view[2]-view[0], ph = view[3]-view[1];
      boxes = boxes.filter(function(o){
        var w = o.b[2]-o.b[0], h = o.b[3]-o.b[1];
        if (w < 40 || h < 40) return false;                    // bỏ icon / đường kẻ nhỏ
        if (w*h > pw*ph*0.85) return false;                    // bỏ ảnh phủ kín trang (PDF quét)
        return true;
      });
      var chain = Promise.resolve(), out = [];
      boxes.forEach(function(o){
        chain = chain.then(function(){
          var w = o.b[2]-o.b[0], h = o.b[3]-o.b[1];
          // độ phân giải: ít nhất 3x, đủ để bằng ảnh gốc, tối đa 5x và 4096px cạnh dài
          var scale = Math.max(3, Math.min(5, o.nw ? (o.nw / w) * 1.05 : 3));
          scale = Math.min(scale, 4096 / Math.max(w, h));
          var viewport = page.getViewport({ scale: scale });
          var T = viewport.transform;
          function tp(px, py){ return [T[0]*px + T[2]*py + T[4], T[1]*px + T[3]*py + T[5]]; }
          var p1 = tp(o.b[0], o.b[1]), p2 = tp(o.b[2], o.b[3]);
          var x = Math.min(p1[0], p2[0]), y = Math.min(p1[1], p2[1]);
          var cw = Math.max(1, Math.round(Math.abs(p2[0]-p1[0]))), ch = Math.max(1, Math.round(Math.abs(p2[1]-p1[1])));
          var canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0,0,cw,ch);
          // chỉ vẽ vùng ảnh (dịch gốc toạ độ), không dựng cả trang -> nhẹ và nét
          return page.render({ canvasContext: ctx, viewport: viewport, transform: [1,0,0,1,-x,-y] }).promise.then(function(){
            var url = '';
            try { url = canvas.toDataURL('image/jpeg', 0.95); } catch(e) {}
            if (url) out.push({ fig: url, y: o.b[3], minX: o.b[0], maxX: o.b[2], size: 0, text: '' });
          });
        });
      });
      return chain.then(function(){ return out; });
    }).catch(function(e){ console.warn('[pdf] không tách được ảnh trang', e); return []; });
  }

  function extractPdfArticleHtml(url){
    return loadPdfJs().then(function(lib){
      return lib.getDocument({ url: url }).promise.then(function(pdf){
        var pages = [], chain = Promise.resolve();
        for (var n = 1; n <= pdf.numPages; n++) {
          (function(n){
            chain = chain.then(function(){
              return pdf.getPage(n).then(function(pg){
                return pg.getTextContent().then(function(tc){
                  var lines = pdfPageToBlocks(tc.items);
                  return pdfPageFigures(lib, pg).then(function(figs){
                    var all = lines.concat(figs);
                    all.sort(function(a,b){ return b.y - a.y; });
                    pages.push(all);
                  });
                });
              });
            });
          })(n);
        }
        return chain.then(function(){
          var charCount = pages.reduce(function(a,l){ return a + l.reduce(function(b,x){ return b + (x.text ? x.text.length : 0); }, 0); }, 0);
          var figCount = pages.reduce(function(a,l){ return a + l.filter(function(x){ return x.fig; }).length; }, 0);
          if (charCount < 40 && !figCount) throw new Error('no-text'); // PDF dạng ảnh quét -> dùng khung xem dự phòng
          return pdfLinesToHtml(pages);
        });
      });
    });
  }
  var LIB_SECTIONS = [
    { key:'slide',   label:'Slide bài giảng' },
    { key:'noidung', label:'Tài liệu ôn tập', alias:['yeucau'] } // gộp cả file/ghi chú cũ của mục "Yêu cầu"
  ];
  // Bài Thư viện có 2 mục -> hiện accordion. Trả về true nếu đã xử lý.
  function renderLibSections(it){
    var host = document.getElementById('apLibSections');
    if (!host) return false;
    host.innerHTML = '';
    if (!it || String(it.category || '').trim() !== 'Thư viện') return false;
    var files = (it.pdfs || []).filter(function(p){ return p && p.url; });
    var notes = it.sectionNotes || {};
    var tagged = files.some(function(p){ return p.section; }) || Object.keys(notes).length > 0;
    if (!tagged) return false; // bài cũ (chưa chia mục) -> dùng khung xem PDF như trước
    var isMobile = window.matchMedia && window.matchMedia('(max-width:900px)').matches;
    LIB_SECTIONS.forEach(function(sec, i){
      var keys = [sec.key].concat(sec.alias || []);
      var list = files.filter(function(p){ return keys.indexOf(p.section || 'noidung') !== -1; });
      var note = keys.map(function(k){ return notes[k] || ''; }).filter(Boolean).join('\n\n');
      var d = document.createElement('details');
      d.className = 'ls-item';
      var sum = document.createElement('summary');
      sum.innerHTML = '<span class="ls-chev" aria-hidden="true"></span><span></span>' +
        (list.length ? '<span class="ls-cnt">' + list.length + '</span>' : '');
      sum.children[1].textContent = sec.label;
      d.appendChild(sum);
      var body = document.createElement('div');
      body.className = 'ls-body';
      if (note) { var n = document.createElement('div'); n.className = 'ls-note'; n.textContent = note; body.appendChild(n); }
      if (!list.length && !note) { var e = document.createElement('div'); e.className = 'ls-empty'; e.textContent = 'Chưa có tài liệu trong mục này.'; body.appendChild(e); }
      list.forEach(function(p, idx){
        var nm = p.name || ('tai-lieu-' + (idx + 1) + '.pdf');
        var box = document.createElement('div'); box.className = 'ls-file';
        box.innerHTML =
          '<div class="ls-file-row"><div class="ls-file-ic">PDF</div><div class="ls-file-name"></div>' +
          '<button type="button" class="ls-btn ls-view">Xem</button>' +
          '<a class="ls-btn ls-dl">Tải về</a></div><iframe class="ls-frame" title="Xem PDF"></iframe>';
        box.querySelector('.ls-file-name').textContent = nm;
        var dl = box.querySelector('.ls-dl'); dl.href = p.url; dl.setAttribute('download', nm);
        box.querySelector('.ls-view').addEventListener('click', function(){
          if (isMobile) { var w = window.open(p.url, '_blank'); if (!w) location.href = p.url; return; }
          var fr = box.querySelector('.ls-frame');
          if (box.classList.toggle('open')) { if (!fr.getAttribute('src')) fr.src = p.url; }
        });
        body.appendChild(box);
      });
      d.appendChild(body);
      if (i === 0) d.open = true;
      host.appendChild(d);
    });
    return true;
  }
  function renderArticlePdf(it){
    if (renderLibSections(it)) {
      var pb = document.getElementById('apPdfBox');
      if (pb) { pb.classList.remove('show', 'as-article'); }
      return;
    }
    // Hiển thị PDF dạng file (danh sách file + khung xem trước + nút tải), không đọc thành chữ
    var box0 = document.getElementById('apPdfBox'), out0 = document.getElementById('apPdfRendered');
    if (box0) box0.classList.remove('as-article');
    if (out0) out0.innerHTML = '';
    return renderArticlePdfFrame(it);
  }
  function renderArticlePdfAsText(it){
    var box = document.getElementById('apPdfBox');
    var out = document.getElementById('apPdfRendered');
    if (!box || !out) return renderArticlePdfFrame(it);
    var pdfs = extractPdfsFromItem(it);
    if (!pdfs.length) {
      box.classList.remove('as-article');
      out.innerHTML = '';
      return renderArticlePdfFrame(it);
    }
    var token = String(Date.now()) + Math.random();
    box.setAttribute('data-render-token', token);
    box.classList.add('show', 'as-article');
    out.innerHTML = '<div class="pdf-status">Đang đọc nội dung bài viết…</div>';

    var results = [];
    var chain = Promise.resolve();
    pdfs.forEach(function(pdf, idx){
      chain = chain.then(function(){
        return extractPdfArticleHtml(pdf.url).then(function(h){ results[idx] = h; });
      });
    });
    chain.then(function(){
      if (box.getAttribute('data-render-token') !== token) return;
      var html = '<div class="pdf-doc">' + results.join('<hr style="border:0;border-top:1px solid var(--line);margin:2em 0">') + '</div>';
      var actions = '<div class="pdf-actions">';
      pdfs.forEach(function(pdf, idx){
        var fileId = driveFileIdFromUrl(pdf.url);
        var dl = fileId ? ('https://drive.google.com/uc?export=download&id=' + fileId) : pdf.url;
        var nm = pdf.name || ('tai-lieu-' + (idx + 1) + '.pdf');
        actions += '<a href="' + escHtml(dl) + '" target="_blank" rel="noopener noreferrer" download="' + escHtml(nm) + '">Tải file PDF gốc' + (pdfs.length > 1 ? ' (' + (idx+1) + ')' : '') + '</a>';
      });
      actions += '</div>';
      out.innerHTML = sanitizeHtml(html + actions);
    }).catch(function(err){
      if (box.getAttribute('data-render-token') !== token) return;
      console.warn('[pdf] Không dựng được bài từ PDF, dùng khung xem PDF:', err);
      box.classList.remove('as-article');
      out.innerHTML = '';
      renderArticlePdfFrame(it);
    });
  }

  // giữ hàm cũ nếu còn chỗ gọi (không dùng)
  function extractPdfUrlFromItem(it){
    var list = extractPdfsFromItem(it);
    return list.length ? list[0].url : '';
  }

  function extractWordFromItem(it){
    if (!it) return null;
    var url = (it.word && String(it.word).trim()) ? String(it.word).trim() : '';
    var gdoc = (it.gdoc && String(it.gdoc).trim()) ? String(it.gdoc).trim() : '';
    var gdocId = (it.gdocId && String(it.gdocId).trim()) ? String(it.gdocId).trim() : '';
    var name = it.wordName || '';
    if (!url && !gdoc) {
      var blob = String(it.detail || '');
      var m = blob.match(/data-word-url="([^"]+)"/i);
      if (m) url = m[1];
      var nm = blob.match(/data-word-name="([^"]+)"/i);
      if (nm) name = nm[1];
      var mg = blob.match(/data-gdoc-url="([^"]+)"/i);
      if (mg) gdoc = mg[1];
    }
    if (!url && !gdoc) return null;
    if (!gdocId && gdoc) {
      var m2 = String(gdoc).match(/\/d\/([-\w]{25,})/);
      if (m2) gdocId = m2[1];
    }
    return { url: url, gdoc: gdoc, gdocId: gdocId, name: name };
  }
  function extractWordsFromItem(it){
    var w = extractWordFromItem(it);
    return w ? [w] : [];
  }
  function renderArticleWordFrame(it){
    var box = document.getElementById('apWordBox');
    var frame = document.getElementById('apWordFrame');
    var frameWrap = document.getElementById('apWordFrameWrap');
    var renderedEl = document.getElementById('apWordRendered');
    var listEl = document.getElementById('apWordFileList');
    var titleEl = document.getElementById('apWordTitle');
    var subEl = document.getElementById('apWordSub');
    if (!box) return;

    var words = extractWordsFromItem(it);
    if (!words.length) {
      box.classList.remove('show');
      if (frame) { frame.removeAttribute('src'); frame.removeAttribute('data-word-id'); }
      if (renderedEl) { renderedEl.classList.remove('show'); renderedEl.innerHTML = ''; }
      if (listEl) listEl.innerHTML = '';
      return;
    }

    box.classList.add('show');
    if (titleEl) {
      titleEl.textContent = words.length > 1
        ? ('Tài liệu Word đính kèm (' + words.length + ' file)')
        : (words[0].name || (it.title ? (String(it.title) + ' — Word') : 'Tài liệu Word đính kèm'));
    }
    var isMobile = window.matchMedia && window.matchMedia('(max-width:900px)').matches;
    if (subEl) {
      subEl.textContent = isMobile
        ? 'Bấm Xem trên từng file để mở trên điện thoại'
        : (words.length > 1 ? 'Chọn file để xem bên dưới' : 'Xem trực tiếp bên dưới · hoặc tải về');
    }

    // Suy ra các đường link xem/tải cho 1 file Word
    function buildLinks(w){
      var fileId = driveFileIdFromUrl(w.url);
      var viewUrl = w.gdoc
        ? w.gdoc
        : (fileId ? ('https://drive.google.com/file/d/' + fileId + '/view?usp=drivesdk') : w.url);
      var downloadUrl = fileId
        ? ('https://drive.google.com/uc?export=download&id=' + fileId)
        : (w.url || viewUrl);
      // Ưu tiên Google Doc đã convert để xem trong iframe
      var previewUrl = '';
      if (w.gdocId) {
        previewUrl = 'https://docs.google.com/document/d/' + w.gdocId + '/preview';
      } else if (w.gdoc) {
        var gid = driveFileIdFromUrl(w.gdoc);
        previewUrl = gid
          ? ('https://docs.google.com/document/d/' + gid + '/preview')
          : w.gdoc;
      } else if (fileId) {
        // Office Online với link tải Drive (đôi khi chạy được với docx)
        var direct = 'https://drive.google.com/uc?export=download&id=' + fileId;
        previewUrl = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(direct);
      } else if (/^https?:\/\//i.test(w.url || '')) {
        // File .docx công khai (vd Cloudflare R2): xem bằng Office Online với đúng URL gốc
        previewUrl = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(w.url);
      } else {
        previewUrl = viewUrl;
      }
      var isRawUpload = !fileId && !w.gdocId && !w.gdoc && !/^https?:\/\//i.test(w.url || ''); // file Word tải thẳng lên Supabase (base64), không có link xem online
      return { fileId: fileId, viewUrl: viewUrl, downloadUrl: downloadUrl, previewUrl: previewUrl, isRawUpload: isRawUpload };
    }

    function openWord(w){
      var L = buildLinks(w);
      if (L.isRawUpload) {
        // Không có link công khai để dùng Google/Office Viewer -> tự chuyển .docx sang HTML bằng mammoth.js
        if (frame) { frame.removeAttribute('src'); }
        if (frameWrap) frameWrap.style.display = 'none';
        if (renderedEl) {
          renderedEl.classList.add('show');
          renderedEl.innerHTML = '<p style="color:#888;">Đang tải nội dung file Word…</p>';
          wordArrayBuffer(it, w).then(function(buf){
            return DocxView.convert(buf).then(function(res){
              DocxView.mount(renderedEl, res);
            }, function(err){
              console.warn('[word] Bộ chuyển đổi riêng lỗi, thử mammoth:', err);
              return loadMammoth().then(function(){ return mammoth.convertToHtml({ arrayBuffer: buf }); })
                .then(function(r){ renderedEl.innerHTML = sanitizeHtml(r.value) || uxWordFailHtml(); uxBindWordFail(renderedEl); });
            });
          }).catch(function(err){
            console.error('[word] Lỗi chuyển đổi Word:', err);
            renderedEl.innerHTML = uxWordFailHtml(); uxBindWordFail(renderedEl);
          });
        }
        return;
      }
      // Trường hợp có link Google Drive / Google Doc -> xem qua iframe, giống PDF
      if (renderedEl) { renderedEl.classList.remove('show'); renderedEl.innerHTML = ''; }
      if (frame && !isMobile) {
        var key = L.previewUrl;
        if (frame.getAttribute('data-word-id') !== key) {
          frame.setAttribute('data-word-id', key);
          frame.src = L.previewUrl;
        }
        if (frameWrap) frameWrap.style.display = 'block';
      } else if (frame) {
        frame.removeAttribute('src');
        if (frameWrap) frameWrap.style.display = 'none';
      }
    }

    if (listEl) {
      listEl.innerHTML = '';
      words.forEach(function(w, idx){
        var L = buildLinks(w);
        var row = document.createElement('div');
        row.className = 'ap-word-file-row' + (idx === 0 ? ' active' : '');
        row.innerHTML =
          '<div class="ap-word-file-icon">W</div>' +
          '<div class="name"></div>' +
          '<div class="ap-word-file-actions">' +
            '<button type="button" class="ap-word-open">Xem</button>' +
            (L.isRawUpload ? '' : '<a class="ap-word-btn-view" target="_blank" rel="noopener noreferrer">Mở tab</a>') +
            '<a class="ap-word-btn-dl">Tải file Word (.docx)</a>' +
          '</div>';
        row.querySelector('.name').textContent = w.name || (it.title ? (String(it.title) + ' — Word') : ('File Word ' + (idx + 1)));
        var viewLink = row.querySelector('.ap-word-btn-view');
        if (viewLink) viewLink.href = L.viewUrl;
        var dlLink = row.querySelector('.ap-word-btn-dl');
        var dlFileName = (w.name || (it.title ? (String(it.title) + '.docx') : 'tai-lieu.docx'));
        if (!/\.docx?$/i.test(dlFileName)) dlFileName += '.docx';
        if (L.isRawUpload) {
          // File Word gốc (base64 -> blob) đang nằm ngay trên trình duyệt:
          // ép trình duyệt LƯU FILE THẬT (.docx) thay vì chỉ mở/đọc dữ liệu.
          dlLink.href = 'javascript:void(0)';
          dlLink.addEventListener('click', function(ev){
            ev.preventDefault();
            var a = document.createElement('a');
            a.href = L.downloadUrl; // blob: URL chứa đúng bytes file .docx gốc
            a.download = dlFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          });
        } else {
          dlLink.href = L.downloadUrl;
          dlLink.setAttribute('target', '_blank');
          dlLink.setAttribute('rel', 'noopener noreferrer');
          dlLink.setAttribute('download', dlFileName);
        }
        row.querySelector('.ap-word-open').addEventListener('click', function(){
          listEl.querySelectorAll('.ap-word-file-row').forEach(function(r){ r.classList.remove('active'); });
          row.classList.add('active');
          if (isMobile && !L.isRawUpload) {
            try {
              var win = window.open(L.viewUrl, '_blank');
              if (!win) location.href = L.viewUrl;
            } catch (e) { location.href = L.viewUrl; }
          } else {
            openWord(w);
          }
        });
        listEl.appendChild(row);
      });
    }

    // Mặc định mở file đầu
    openWord(words[0]);
  }

  // ===== Word -> hiện thành bài viết ngay trên trang (giống PDF) =====
  function wordArrayBuffer(it, w){
    if (it && it.wordRawBase64) {
      var raw = String(it.wordRawBase64), c = raw.indexOf(',');
      if (raw.indexOf('data:') === 0 && c !== -1) raw = raw.slice(c + 1);
      var bin = atob(raw), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return Promise.resolve(bytes.buffer);
    }
    if (w && w.url) return fetch(w.url).then(function(r){ return r.arrayBuffer(); });
    return Promise.reject(new Error('no-word-data'));
  }
  function renderArticleWord(it){
    var box = document.getElementById('apWordBox');
    var out = document.getElementById('apWordArticle');
    var cat = String((it && it.category) || '').trim();
    var w = extractWordsFromItem(it)[0];
    var isRaw = w && !w.gdoc && !w.gdocId && !driveFileIdFromUrl(w.url); // gồm cả link R2 -> in thẳng nội dung lên trang
    // Mục "Thư viện" giữ dạng file để tải; các mục khác (Hội thảo - Tọa đàm, Tin tức...)
    // hiện THẲNG nội dung Word thành văn bản trên trang, không còn khung file Word.
    if (!box || !out || !w || !isRaw || cat === 'Thư viện') {
      if (box) box.classList.remove('as-article');
      if (out) out.innerHTML = '';
      return renderArticleWordFrame(it);
    }
    var token = String(Date.now()) + Math.random();
    box.setAttribute('data-render-token', token);
    box.classList.add('show', 'as-article');
    out.innerHTML = '<div class="pdf-status">Đang đọc nội dung bài viết…</div>';
    function stale(){ return box.getAttribute('data-render-token') !== token; }
    wordArrayBuffer(it, w).then(function(buf){
      return DocxView.convert(buf).catch(function(err){
        console.warn('[word] Bộ chuyển đổi riêng lỗi, thử mammoth:', err);
        return loadMammoth().then(function(){ return mammoth.convertToHtml({ arrayBuffer: buf }); })
          .then(function(r){ return { fallbackHtml: sanitizeHtml((r && r.value) || '') }; });
      });
    }).then(function(res){
      if (stale()) return;
      var card = document.createElement('div');
      card.className = 'dx-card';
      out.innerHTML = '';
      out.appendChild(card);
      if (res.fallbackHtml !== undefined) card.innerHTML = '<div class="dx-doc dx-fallback">' + res.fallbackHtml + '</div>';
      else DocxView.mount(card, res);
      if (!card.textContent.trim() && !card.querySelector('img')) throw new Error('empty');
    }).catch(function(err){
      if (stale()) return;
      console.warn('[word] Không dựng được bài từ Word, dùng khung xem:', err);
      box.classList.remove('as-article');
      out.innerHTML = '';
      renderArticleWordFrame(it);
    });
  }

  window.__renderArticleWord = renderArticleWord;

  window.__renderArticlePdf = renderArticlePdf;

  // ===== Trang bài viết (khi mở ở tab mới dạng ?post=..., vẫn cùng 1 file html) =====
  (function initArticlePage(){
    const params = new URLSearchParams(location.search);
    const postId = params.get('post');
    if (!postId) return; // không có ?post= thì hiển thị trang chủ như bình thường

    document.body.classList.add('article-mode');
    const homeHref = location.pathname.split('?')[0] || './';
    document.getElementById('apBack').href = homeHref;
    document.getElementById('apSectionBack').href = homeHref + '#tin-tuc';
    // Xóa sạch active trên thanh menu ngay (tránh Trang chủ + Giới thiệu + Tin tức cùng sáng)
    document.querySelectorAll('.navlinks a, .navlinks .nav-parent').forEach(el => el.classList.remove('active'));
    document.getElementById('apState').style.display = 'block';
    document.getElementById('apState').innerHTML = window.__apSkeletonHtml();
    // Hiện khung nội dung sớm (tránh trắng trang)
    document.getElementById('apContent').style.display = 'block';

    const escapeHtml = (str) => String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

    const feedLoader = (typeof window.__loadNewsFeed === 'function')
      ? window.__loadArticleFull(postId)
      : fetch(NEWS_FEED_URL).then(r => r.json());

    feedLoader
      .then(items => (window.__purifyP || Promise.resolve()).then(() => items))
      .then(items => {
        if (!Array.isArray(items)) throw new Error('bad data');
        const it = items.find(x => String(x.id || x.time || '') === postId);
        if (!it) throw new Error('not found');

        if (typeof window.__seoPost === 'function') window.__seoPost(it, postId); else document.title = (it.title || 'Bài viết') + ' — Ngành Toán Kinh Tế';
        document.getElementById('apCategory').textContent = it.category || '';
        document.getElementById('apSectionBack').textContent = it.category || 'Quay lại';
        if (typeof window.__renderRelated === 'function') window.__renderRelated(items, it, postId);

        const postCat = (it.category || '').trim();
        let backHash = 'thong-bao', tabGroup = 'tin-tuc', subId = 'thong-bao';
        if (postCat === 'Tin ngành Toán kinh tế') {
          backHash = 'tin-nganh'; tabGroup = 'tin-tuc'; subId = 'tin-nganh';
        } else if (postCat === 'Tuyển sinh') {
          backHash = 'tuyen-sinh'; tabGroup = 'tuyen-sinh'; subId = undefined;
        } else if (postCat === 'Hội thảo - Tọa đàm') {
          backHash = 'hoi-thao'; tabGroup = 'hoi-thao'; subId = undefined;
        } else if (postCat === 'Thư viện') {
          backHash = 'thu-vien'; tabGroup = 'thu-vien'; subId = undefined;
        }
        const homePath = location.pathname.split('?')[0] || './';
        document.getElementById('apBack').href = homePath; // Trang chủ
        document.getElementById('apSectionBack').href = homePath + '#' + backHash; // Quay lại mục
        if (typeof window.__switchTab === 'function') window.__switchTab(tabGroup, subId, { keepArticle: true });
        // Khóa nav đúng 1 lần nữa sau khi DOM ổn định (chống scroll-spy / race)
        requestAnimationFrame(() => {
          if (typeof window.__switchTab === 'function') {
            window.__switchTab(tabGroup, subId, { keepArticle: true });
          }
        });

        let d = null;
        const val = it.time;
        if (val instanceof Date) d = val;
        else if (typeof val === 'number') d = new Date(val);
        else if (typeof val === 'string' && val.trim()){
          d = new Date(val);
          if (isNaN(d.getTime())){
            const m = val.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (m) d = new Date(+m[3], +m[2]-1, +m[1]);
          }
        }
        const dateStr = (d && !isNaN(d.getTime()))
          ? String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear()
          : '';

        let metaHtml = '';
        if (dateStr) metaHtml += '<span class="ap-date">Ngày phát hành: ' + dateStr + '</span>';
        if (it.badge){
          if (dateStr) metaHtml += '<span class="dot"></span>';
          metaHtml += '<span class="badge">' + escapeHtml(it.badge) + '</span>';
        }
        document.getElementById('apMeta').innerHTML = metaHtml;

        document.getElementById('apTitle').textContent = it.title || '';
        (function(){
          const sm = document.getElementById('apSummary'); if (!sm) return;
          const clean = (h) => String(h || '').replace(/<div class="tkt-(?:pdf|word)-embed"[^>]*>[\s\S]*?<\/div>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
          const sum = String(it.content || '').trim();
          const hasBody = !!clean(it.detail) || !!(it.word || it.wordName || it.gdoc || it.gdocId || it.pdf);
          // Chỉ hiện tóm tắt khi bài còn nội dung khác bên dưới (tránh lặp lại)
          if (sum && hasBody && clean(sum) !== clean(it.detail)) { sm.textContent = sum; sm.style.display = 'block'; }
          else { sm.textContent = ''; sm.style.display = 'none'; }
        })();

        // Ảnh chỉ dùng thẻ tin ngoài — không gắn vào trang bài
        const img = document.getElementById('apImg');
        if (img) { img.removeAttribute('src'); img.style.display = 'none'; }
        // Bài không có ảnh → dải đầu bài dùng ảnh phong bì mặc định
        (function(){ var h = document.getElementById('apHero'); if (h) h.classList.toggle('ap-noimg', !it.image); })();
        // Word + nội dung gõ tay chạy song song
        var hasWord = !!(it.word || it.wordName || it.gdoc || it.gdocId ||
          (it.detail && /data-word-url=/i.test(String(it.detail))));
        // Chữ hiện trước; Word/PDF tải nền rồi mới hiển thị
        (function(){ var __pid = postId;
          window.__loadArticleFiles(it, __pid).then(function(){
            if (new URLSearchParams(location.search).get('post') !== String(__pid)) return; // đã chuyển sang bài khác
            if (typeof window.__renderArticleWord === 'function') window.__renderArticleWord(it);
            if (typeof window.__renderArticlePdf === 'function') window.__renderArticlePdf(it);
          });
        })();

        // Nội dung chữ: lấy detail (gỡ marker PDF/Word), không dùng bản convert Word
        let fullText = (it.detail && String(it.detail).trim()) ? String(it.detail) : '';
        fullText = fullText.replace(/<div class="tkt-pdf-embed"[^>]*>[\s\S]*?<\/div>/gi, '');
        fullText = fullText.replace(/<div class="tkt-word-embed"[^>]*>[\s\S]*?<\/div>/gi, '');
        fullText = fullText.replace(/<p[^>]*>\s*<em>Đã đính kèm file Word[\s\S]*?<\/em>\s*<\/p>/gi, '');
        fullText = fullText.replace(/<p[^>]*>\s*<em>Nội dung Word đã được đính kèm[\s\S]*?<\/em>\s*<\/p>/gi, '');
        fullText = fullText.trim();
        // Chỉ fallback tóm tắt khi không có Word và không có detail
        if (!fullText && !hasWord) {
          fullText = it.content || '';
        }
        // Nếu nội dung là HTML (từ Google Doc, có chứa thẻ <p>, <span>...) thì hiển thị bằng innerHTML
        // để giữ định dạng (in đậm, xuống dòng...). Nếu là text thường (gõ tay) thì vẫn giữ textContent
        // để an toàn (tránh lỗi nếu người dùng gõ ký tự < > trong bài).
        const looksLikeHtml = /<\/?(p|span|div|br|b|strong|i|em|ul|ol|li|a|img|h[1-6]|table|tr|td|th)[\s>]/i.test(fullText);
        const apBodyEl = document.getElementById('apBody');
        if (looksLikeHtml) {
          apBodyEl.classList.remove('ap-plain');
          apBodyEl.classList.add('ap-html');
          apBodyEl.innerHTML = sanitizeHtml(fullText);
          // Chuẩn hoá ảnh Docs: bỏ width/height cố định để CSS max-width:100% hoạt động
          apBodyEl.querySelectorAll('img').forEach(im => {
            im.removeAttribute('width');
            im.removeAttribute('height');
            if (im.style) {
              im.style.width = '';
              im.style.height = '';
              im.style.maxWidth = '100%';
            }
          });
        } else {
          apBodyEl.classList.remove('ap-html');
          apBodyEl.classList.add('ap-plain');
          apBodyEl.textContent = fullText;
        }

        document.getElementById('apState').style.display = 'none';
        document.getElementById('apContent').style.display = 'block';
      })
      .catch((err) => { uxShowArticleError(err); });

    // Nút Trang chủ / Quay lại: thoát article-mode ngay, không kẹt lại bài viết
    function exitArticleTo(href){
      document.body.classList.remove('article-mode');
      const apState = document.getElementById('apState');
      const apContent = document.getElementById('apContent');
      if (apState) apState.style.display = 'none';
      if (apContent) apContent.style.display = 'none';
      // Điều hướng sạch (bỏ ?post=) — ưu tiên không reload full file
      if (href) {
        try {
          const u = new URL(href, location.href);
          if (u.origin === location.origin) {
            if (history.pushState) {
              history.pushState({}, '', u.pathname + u.search + u.hash);
              // Chuyển tab theo hash nếu có
              const hash = (u.hash || '').replace(/^#/, '');
              if (hash && typeof window.__switchTab === 'function') {
                const map = {
                  'gioi-thieu':'gioi-thieu','lich-su':'gioi-thieu','nhan-dien':'gioi-thieu','chung':'gioi-thieu',
                  'tuyen-sinh':'tuyen-sinh','tin-tuc':'tin-tuc','hoi-thao':'hoi-thao','thu-vien':'thu-vien',
                  'ctdt-toan-tc':'ctdt-toan-tc','ctdt-thong-ke':'ctdt-thong-ke','ctdt':'ctdt-toan-tc',
                  'thong-bao':'tin-tuc','tin-nganh':'tin-tuc','tat-ca-tin':'tat-ca-tin','hero':'trang-chu','trang-chu':'trang-chu'
                };
                const tab = map[hash] || (['trang-chu','gioi-thieu','tin-tuc','tat-ca-tin','tuyen-sinh','hoi-thao','thu-vien','ctdt-toan-tc','ctdt-thong-ke'].includes(hash) ? hash : 'trang-chu');
                window.__switchTab(tab, map[hash] ? hash : null);
              } else if (typeof window.__switchTab === 'function') {
                window.__switchTab('trang-chu', null);
              }
              window.scrollTo({ top: 0, behavior: 'auto' });
              return;
            }
          }
        } catch (e) {}
        location.href = href;
      }
    }
    const btnHome = document.getElementById('apBack');
    const btnSec = document.getElementById('apSectionBack');
    if (btnHome) {
      btnHome.addEventListener('click', (e) => {
        e.preventDefault();
        const href = btnHome.getAttribute('href') || (location.pathname.split('?')[0] || './');
        exitArticleTo(href);
      });
    }
    if (btnSec) {
      btnSec.addEventListener('click', (e) => {
        e.preventDefault();
        if (history.state && history.state.fromApp) { history.back(); return; }
        const href = btnSec.getAttribute('href') || (location.pathname.split('?')[0] || './');
        exitArticleTo(href);
      });
    }
  })();

  // ===== Mở bài không reload trang (tránh load lại file HTML ~4MB) =====
  (function spaArticleOpen(){
    function openPost(postId){
      if (!postId) return;
      const url = (location.pathname.split('?')[0] || './') + '?post=' + encodeURIComponent(postId);
      // Lưu lại trang đang xem (tab + vị trí cuộn) để nút Quay lại trả về đúng chỗ cũ
      try {
        if (!document.body.classList.contains('article-mode')) {
          const prev = window.__captureView();
          if (history.replaceState) history.replaceState(prev, '', location.href);
        }
      } catch (e) {}
      // Đổi URL không reload
      if (history.pushState) history.pushState({ post: postId, fromApp: true }, '', url);
      // Kích hoạt lại logic trang bài bằng cách reload nhẹ chỉ phần article
      // (tái sử dụng cache — gần như tức thì)
      document.body.classList.add('article-mode');
      document.querySelectorAll('#navLinks a').forEach(el => el.classList.remove('active'));
      const apState = document.getElementById('apState');
      const apContent = document.getElementById('apContent');
      if (apState) { apState.style.display = 'block'; apState.innerHTML = window.__apSkeletonHtml(); }
      if (apContent) apContent.style.display = 'block';

      const escapeHtml = (str) => String(str || '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

      const loader = (typeof window.__loadArticleFull === 'function')
        ? window.__loadArticleFull(postId)
        : fetch(NEWS_FEED_URL).then(r => r.json());

      loader.then(items => (window.__purifyP || Promise.resolve()).then(() => items)).then(items => {
        if (!Array.isArray(items)) throw new Error('bad data');
        const it = items.find(x => String(x.id || x.time || '') === String(postId));
        if (!it) throw new Error('not found');

        if (typeof window.__seoPost === 'function') window.__seoPost(it, postId); else document.title = (it.title || 'Bài viết') + ' — Ngành Toán Kinh Tế';
        document.getElementById('apCategory').textContent = it.category || '';
        document.getElementById('apSectionBack').textContent = it.category || 'Quay lại';
        if (typeof window.__renderRelated === 'function') window.__renderRelated(items, it, postId);

        const postCat = (it.category || '').trim();
        let backHash = 'thong-bao', tabGroup = 'tin-tuc', subId = 'thong-bao';
        if (postCat === 'Tin ngành Toán kinh tế') {
          backHash = 'tin-nganh'; tabGroup = 'tin-tuc'; subId = 'tin-nganh';
        } else if (postCat === 'Tuyển sinh') {
          backHash = 'tuyen-sinh'; tabGroup = 'tuyen-sinh'; subId = undefined;
        } else if (postCat === 'Hội thảo - Tọa đàm') {
          backHash = 'hoi-thao'; tabGroup = 'hoi-thao'; subId = undefined;
        } else if (postCat === 'Thư viện') {
          backHash = 'thu-vien'; tabGroup = 'thu-vien'; subId = undefined;
        }
        const homePath = location.pathname.split('?')[0] || './';
        document.getElementById('apBack').href = homePath;
        document.getElementById('apSectionBack').href = homePath + '#' + backHash;
        if (typeof window.__switchTab === 'function') {
          window.__switchTab(tabGroup, subId, { keepArticle: true });
        }

        let d = null;
        const val = it.time;
        if (val instanceof Date) d = val;
        else if (typeof val === 'number') d = new Date(val);
        else if (typeof val === 'string' && val.trim()){
          d = new Date(val);
          if (isNaN(d.getTime())){
            const m = val.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (m) d = new Date(+m[3], +m[2]-1, +m[1]);
          }
        }
        const dateStr = (d && !isNaN(d.getTime()))
          ? String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear()
          : '';

        let metaHtml = '';
        if (dateStr) metaHtml += '<span class="ap-date">Ngày phát hành: ' + dateStr + '</span>';
        if (it.badge){
          if (dateStr) metaHtml += '<span class="dot"></span>';
          metaHtml += '<span class="badge">' + escapeHtml(it.badge) + '</span>';
        }
        document.getElementById('apMeta').innerHTML = metaHtml;
        document.getElementById('apTitle').textContent = it.title || '';
        (function(){
          const sm = document.getElementById('apSummary'); if (!sm) return;
          const clean = (h) => String(h || '').replace(/<div class="tkt-(?:pdf|word)-embed"[^>]*>[\s\S]*?<\/div>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
          const sum = String(it.content || '').trim();
          const hasBody = !!clean(it.detail) || !!(it.word || it.wordName || it.gdoc || it.gdocId || it.pdf);
          // Chỉ hiện tóm tắt khi bài còn nội dung khác bên dưới (tránh lặp lại)
          if (sum && hasBody && clean(sum) !== clean(it.detail)) { sm.textContent = sum; sm.style.display = 'block'; }
          else { sm.textContent = ''; sm.style.display = 'none'; }
        })();

        // Ảnh chỉ dùng thẻ tin ngoài — không gắn vào trang bài
        const img = document.getElementById('apImg');
        if (img) { img.removeAttribute('src'); img.style.display = 'none'; }
        // Bài không có ảnh → dải đầu bài dùng ảnh phong bì mặc định
        (function(){ var h = document.getElementById('apHero'); if (h) h.classList.toggle('ap-noimg', !it.image); })();
        // Word + nội dung gõ tay chạy song song
        var hasWord = !!(it.word || it.wordName || it.gdoc || it.gdocId ||
          (it.detail && /data-word-url=/i.test(String(it.detail))));
        // Chữ hiện trước; Word/PDF tải nền rồi mới hiển thị
        (function(){ var __pid = postId;
          window.__loadArticleFiles(it, __pid).then(function(){
            if (new URLSearchParams(location.search).get('post') !== String(__pid)) return; // đã chuyển sang bài khác
            if (typeof window.__renderArticleWord === 'function') window.__renderArticleWord(it);
            if (typeof window.__renderArticlePdf === 'function') window.__renderArticlePdf(it);
          });
        })();

        // Nội dung chữ: lấy detail (gỡ marker PDF/Word), không dùng bản convert Word
        let fullText = (it.detail && String(it.detail).trim()) ? String(it.detail) : '';
        fullText = fullText.replace(/<div class="tkt-pdf-embed"[^>]*>[\s\S]*?<\/div>/gi, '');
        fullText = fullText.replace(/<div class="tkt-word-embed"[^>]*>[\s\S]*?<\/div>/gi, '');
        fullText = fullText.replace(/<p[^>]*>\s*<em>Đã đính kèm file Word[\s\S]*?<\/em>\s*<\/p>/gi, '');
        fullText = fullText.replace(/<p[^>]*>\s*<em>Nội dung Word đã được đính kèm[\s\S]*?<\/em>\s*<\/p>/gi, '');
        fullText = fullText.trim();
        // Chỉ fallback tóm tắt khi không có Word và không có detail
        if (!fullText && !hasWord) {
          fullText = it.content || '';
        }
        const looksLikeHtml = /<\/?(p|span|div|br|b|strong|i|em|ul|ol|li|a|img|h[1-6]|table|tr|td|th)[\s>]/i.test(fullText);
        const apBodyEl = document.getElementById('apBody');
        if (looksLikeHtml) {
          apBodyEl.classList.remove('ap-plain');
          apBodyEl.classList.add('ap-html');
          apBodyEl.innerHTML = sanitizeHtml(fullText);
          apBodyEl.querySelectorAll('img').forEach(im => {
            im.removeAttribute('width');
            im.removeAttribute('height');
            if (im.style) { im.style.width = ''; im.style.height = ''; im.style.maxWidth = '100%'; }
          });
        } else {
          apBodyEl.classList.remove('ap-html');
          apBodyEl.classList.add('ap-plain');
          apBodyEl.textContent = fullText;
        }

        if (apState) apState.style.display = 'none';
        if (apContent) apContent.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      }).catch((err) => { uxShowArticleError(err); });
    }

    // Tải trước bài khi rê chuột (sau 120ms) hoặc chạm vào thẻ tin
    (function prefetchOnIntent(){
      var timer = null, lastId = '';
      function idOf(target){
        var a = target && target.closest && target.closest('a[href*="?post="]');
        if (!a) return '';
        try { var u = new URL(a.href, location.href); return u.origin === location.origin ? (u.searchParams.get('post') || '') : ''; } catch (e) { return ''; }
      }
      function fire(id){ if (id && id !== lastId && typeof window.__prefetchArticle === 'function') { lastId = id; window.__prefetchArticle(id); } }
      document.addEventListener('mouseover', function(e){
        var id = idOf(e.target); if (!id) return;
        clearTimeout(timer); timer = setTimeout(function(){ fire(id); }, 120);
      }, { passive: true });
      document.addEventListener('mouseout', function(){ clearTimeout(timer); }, { passive: true });
      document.addEventListener('touchstart', function(e){ fire(idOf(e.target)); }, { passive: true });
    })();

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="?post="]');
      if (!a) return;
      // Chỉ bắt link nội bộ
      try {
        const u = new URL(a.href, location.href);
        if (u.origin !== location.origin) return;
        const pid = u.searchParams.get('post');
        if (!pid) return;
        e.preventDefault();
        e.stopPropagation();
        openPost(pid);
      } catch (err) {}
    }, true);

    window.addEventListener('popstate', (ev) => {
      const pid = new URLSearchParams(location.search).get('post');
      if (pid) { openPost(pid); return; }
      // Chặn hashchange (bắn ngay sau popstate) làm nhảy sang mục lưu trữ
      window.__restoringView = true;
      setTimeout(() => { window.__restoringView = false; }, 400);
      document.body.classList.remove('article-mode');
      const apState = document.getElementById('apState');
      const apContent = document.getElementById('apContent');
      if (apState) apState.style.display = 'none';
      if (apContent) apContent.style.display = 'none';
      const st = ev.state;
      if (st && st.view && typeof window.__switchTab === 'function') {
        window.__switchTab(st.tab, st.hash || null, { noScroll: true });
        requestAnimationFrame(() => window.scrollTo({ top: st.scrollY || 0, behavior: 'auto' }));
      } else if (typeof window.__switchTab === 'function') {
        // Không có trạng thái lưu (vd. mở thẳng link bài): về mục theo hash
        window.__restoringView = false;
        if (typeof window.__initFromHash === 'function') window.__initFromHash();
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    });

    window.__openPost = openPost;
  })();
