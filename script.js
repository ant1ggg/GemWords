document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  //  СЛАЙДЕР 1: exercises ======================================

  (function exercisesCarusel() {
    'use strict';

    const wrapper = document.querySelector('.exercises__wrapper');
    if (!wrapper) return;

    const slidesContainer = wrapper.querySelector('.exercises__slides');
    if (!slidesContainer) return;

    const prevBtn = wrapper.querySelector('.exercises__nav--prev');
    const nextBtn = wrapper.querySelector('.exercises__nav--next');
    const slides = slidesContainer.querySelectorAll('.exercises__slide');

    const SPAM_DELAY = 150;
    const SWIPE_MIN_DISTANCE = 3;
    const SNAP_DURATION = 300;
    const MOUSE_SWIPE_BREAKPOINT = 1280;

    let currentIndex = 0;
    let cardWidth = 0;
    let gap = 0;
    let maxIndex = 0;
    let isAnimating = false;

    let startX = null;
    let startY = null;
    let startOffset = 0;
    let currentOffset = 0;
    let isDragging = false;
    let isHorizontal = false;

    slidesContainer.style.willChange = 'transform';
    wrapper.style.cursor = 'pointer';
    slidesContainer.style.userSelect = 'none';
    slidesContainer.addEventListener('dragstart', e => e.preventDefault());

    function isMouseSwipeEnabled() {
      return window.innerWidth < MOUSE_SWIPE_BREAKPOINT;
    }

    function updateDimensions() {
      if (slides.length === 0) return;

      slidesContainer.style.transition = 'none';
      cardWidth = slides[0].getBoundingClientRect().width;

      if (slides.length >= 2) {
        gap = Math.max(0, slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().right);
      } else {
        const style = getComputedStyle(slidesContainer);
        gap = parseFloat(style.gap) || parseFloat(style.columnGap) || 0;
      }

      const containerWidth = slidesContainer.parentElement.clientWidth;
      if (!cardWidth || cardWidth <= 0) return;

      const step = cardWidth + gap;
      const visibleSlides = Math.floor((containerWidth + gap) / step);
      maxIndex = Math.max(0, slides.length - visibleSlides);

      clampIndex();
      render(false);
    }

    function clampIndex() {
      currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));
    }

    function getStep() {
      return cardWidth + gap;
    }

    function getMaxOffset() {
      return Math.max(0, slidesContainer.scrollWidth - slidesContainer.parentElement.clientWidth);
    }

    function render(animated = true) {
      const step = getStep();
      const targetOffset = currentIndex * step;
      const maxOffset = getMaxOffset();

      currentOffset = Math.min(targetOffset, maxOffset);

      slidesContainer.style.transition = animated ? `transform ${SNAP_DURATION}ms ease` : 'none';
      slidesContainer.style.transform = `translateX(-${currentOffset}px)`;
    }

    function renderDrag(offset) {
      const maxOffset = getMaxOffset();
      const clampedOffset = Math.max(0, Math.min(offset, maxOffset));

      slidesContainer.style.transition = 'none';
      slidesContainer.style.transform = `translateX(-${clampedOffset}px)`;
    }

    function triggerLock() {
      isAnimating = true;
      setTimeout(() => isAnimating = false, SPAM_DELAY);
    }

    function resetState() {
      startX = startY = null;
      startOffset = 0;
      isDragging = isHorizontal = false;
      wrapper.style.cursor = 'pointer';
    }

    function startDrag(x, y) {
      startX = x;
      startY = y;
      startOffset = currentOffset;
      isDragging = true;
      isHorizontal = false;
      wrapper.style.cursor = 'pointer';
    }

    function moveDrag(x, y) {
      if (!isDragging || startX === null) return;

      const diffX = x - startX;
      const diffY = y - startY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_MIN_DISTANCE) {
        isHorizontal = true;
        const newOffset = startOffset - diffX;
        renderDrag(newOffset);
      } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > SWIPE_MIN_DISTANCE) {
        resetState();
        render(true);
      }
    }

    function endDrag(endX) {
      if (!isDragging || !isHorizontal) {
        resetState();
        render(true);
        return;
      }

      const diff = startX - endX;
      const step = getStep();
      const absDiff = Math.abs(diff);

      const minThreshold = Math.max(cardWidth * 0.08, 15);

      if (absDiff >= minThreshold) {

        let slidesToMove = Math.round(absDiff / step);

        slidesToMove = Math.max(1, slidesToMove);

        if (diff > 0) {

          currentIndex = Math.min(currentIndex + slidesToMove, maxIndex);
        } else {

          currentIndex = Math.max(currentIndex - slidesToMove, 0);
        }

        triggerLock();
        render(true);
      } else {
        render(true);
      }

      resetState();
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (isAnimating || currentIndex >= maxIndex) return;
        triggerLock();
        currentIndex++;
        render(true);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (isAnimating || currentIndex <= 0) return;
        triggerLock();
        currentIndex--;
        render(true);
      });
    }

    // --- TOUCH EVENTS (всегда активны) ---
    wrapper.addEventListener('touchstart', e => {
      if (isAnimating) return;
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    wrapper.addEventListener('touchmove', e => {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    wrapper.addEventListener('touchend', e => {
      endDrag(e.changedTouches[0].clientX);
    }, { passive: true });

    wrapper.addEventListener('touchcancel', () => {
      resetState();
      render(true);
    }, { passive: true });

    function handleMouseDown(e) {
      if (!isMouseSwipeEnabled()) return;
      if (e.button !== 0 || isAnimating) return;
      startDrag(e.clientX, e.clientY);
      e.preventDefault();
    }

    function handleMouseMove(e) {
      if (!isMouseSwipeEnabled()) return;
      moveDrag(e.clientX, e.clientY);
    }

    function handleMouseUp(e) {
      if (!isMouseSwipeEnabled()) return;
      if (isDragging) endDrag(e.clientX);
    }

    wrapper.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    function updateMouseListeners() { }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateDimensions();
        updateMouseListeners();
      }, 100);
    });

    window.addEventListener('blur', () => {
      if (isDragging) {
        resetState();
        render(true);
      }
    });

    window.addEventListener('load', () => {
      setTimeout(() => {
        updateDimensions();
        updateMouseListeners();
      }, 50);
    });

    updateDimensions();
    updateMouseListeners();
  })();







  //  СЛАЙДЕР 2: interests ======================================







  (function interestsCarusel() {
    'use strict';

    const slidesContainer = document.querySelector('.interests__slides');
    if (!slidesContainer) return;

    const slides = [...slidesContainer.children];
    const prevBtn = document.querySelector('.interests__nav-btn--prev');
    const nextBtn = document.querySelector('.interests__nav-btn--next');

    const AUTO_DELAY = 5000;
    const SPAM_DELAY = 150;
    const SWIPE_MIN_DISTANCE = 5;
    const MOUSE_SWIPE_BREAKPOINT = 1280;

    let autoplay;
    let currentIndex = 2;
    let isAnimating = false;
    let isPageVisible = true;

    let startX = null;
    let startY = null;
    let isDragging = false;
    let isHorizontal = false;

    slidesContainer.style.cursor = 'pointer';
    slidesContainer.style.userSelect = 'none';
    slidesContainer.addEventListener('dragstart', e => e.preventDefault());


    function isMouseSwipeEnabled() {
      return window.innerWidth < MOUSE_SWIPE_BREAKPOINT;
    }

    function render() {
      const total = slides.length;

      slides.forEach((slide, index) => {
        let offset = (index - currentIndex + total) % total;
        if (offset > total / 2) offset -= total;

        const pos = Math.max(-4, Math.min(4, offset));

        slide.className = slide.className
          .split(' ')
          .filter(cls => !cls.startsWith('interests__slide--pos'))
          .join(' ');

        slide.classList.add(`interests__slide--pos${pos}`);
      });
    }

    function next() {
      if (isAnimating || !isPageVisible) return;
      triggerLock();
      currentIndex = (currentIndex + 1) % slides.length;
      render();
    }

    function prev() {
      if (isAnimating || !isPageVisible) return;
      triggerLock();
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      render();
    }

    function triggerLock() {
      isAnimating = true;
      setTimeout(() => isAnimating = false, SPAM_DELAY);
    }

    function resetState() {
      startX = startY = null;
      isDragging = isHorizontal = false;
      slidesContainer.style.cursor = isMouseSwipeEnabled() ? 'pointer' : 'default';
    }

    function startDrag(x, y) {
      startX = x;
      startY = y;
      isDragging = true;
      isHorizontal = false;
      slidesContainer.style.cursor = 'pointer';
    }

    function moveDrag(x, y) {
      if (!isDragging || startX === null) return;

      const diffX = x - startX;
      const diffY = y - startY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_MIN_DISTANCE) {
        isHorizontal = true;
      } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > SWIPE_MIN_DISTANCE) {
        resetState();
      }
    }

    function endDrag(endX) {
      if (!isDragging || !isHorizontal || isAnimating || !isPageVisible) {
        resetState();
        return;
      }

      const diff = startX - endX;
      const threshold = slidesContainer.clientWidth * 0.01;

      if (Math.abs(diff) >= threshold) {
        if (diff > 0) next();
        else prev();
      }

      resetState();
    }

    function startAutoplay() {
      stopAutoplay();
      if (!isPageVisible) return;
      autoplay = setInterval(next, AUTO_DELAY);
    }

    function stopAutoplay() {
      clearInterval(autoplay);
    }

    function handleVisibilityChange() {
      isPageVisible = !document.hidden;
      if (isPageVisible) startAutoplay();
      else stopAutoplay();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        next();
        startAutoplay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prev();
        startAutoplay();
      });
    }

    slidesContainer.addEventListener('touchstart', e => {
      if (isAnimating) return;
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
      stopAutoplay();
    }, { passive: true });

    slidesContainer.addEventListener('touchmove', e => {
      if (isAnimating) return;
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    slidesContainer.addEventListener('touchend', e => {
      endDrag(e.changedTouches[0].clientX);
      startAutoplay();
    }, { passive: true });

    slidesContainer.addEventListener('touchcancel', () => {
      resetState();
      startAutoplay();
    }, { passive: true });

    function handleMouseDown(e) {
      if (!isMouseSwipeEnabled()) return;
      if (e.button !== 0 || isAnimating) return;
      startDrag(e.clientX, e.clientY);
      stopAutoplay();
      e.preventDefault();
    }

    function handleMouseMove(e) {
      if (!isMouseSwipeEnabled()) return;
      moveDrag(e.clientX, e.clientY);
    }

    function handleMouseUp(e) {
      if (!isMouseSwipeEnabled()) return;
      if (isDragging) {
        endDrag(e.clientX);
        startAutoplay();
      }
    }

    slidesContainer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    slidesContainer.addEventListener('mouseenter', stopAutoplay);
    slidesContainer.addEventListener('mouseleave', () => {
      if (!isDragging) startAutoplay();
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        slidesContainer.style.cursor = isMouseSwipeEnabled() ? 'pointer' : 'default';

        if (isDragging) {
          resetState();
          startAutoplay();
        }
      }, 100);
    });

    window.addEventListener('blur', () => {
      if (isDragging) {
        resetState();
        startAutoplay();
      }
    });

    render();
    startAutoplay();
  })();





  //  СЛАЙДЕР 3: promo ======================================





  (function promoCarusel() {
    'use strict';

    const screensContainer = document.querySelector('.promo__screens');
    const slides = Array.from(document.querySelectorAll('.promo__screen'));
    const steps = document.querySelectorAll('.promo__step');
    const dots = document.querySelectorAll('.promo__dot');

    if (!screensContainer || slides.length === 0) {
      console.warn('Элементы слайдера не найдены');
      return;
    }

    let currentIndex = 0;
    const totalSlides = slides.length;
    let startX = 0;
    let dragOffset = 0;
    let isDragging = false;

    function getGapValue() {
      const gapStyle = getComputedStyle(screensContainer).getPropertyValue('--gap') || '0px';
      return parseFloat(gapStyle) || 0;
    }

    function updateSlider(animated = true, dragShiftInPx = 0) {
      const gap = getGapValue();

      slides.forEach((slide, index) => {
        if (!animated) {
          slide.style.transition = 'none';
        } else {
          slide.style.transition = 'transform 0.3s ease-out';
        }

        let offset = index - currentIndex;


        const percentMove = offset * 100;

        const gapMoveInPx = offset * gap;

        const totalPxMove = gapMoveInPx + dragShiftInPx;

        if (totalPxMove !== 0) {
          slide.style.transform = `translateX(calc(${percentMove}% + ${totalPxMove}px))`;
        } else {
          slide.style.transform = `translateX(${percentMove}%)`;
        }
      });

      steps.forEach((step, idx) => {
        if (idx === currentIndex) {
          step.classList.add('promo__step--active');
        } else {
          step.classList.remove('promo__step--active');
        }
      });

      dots.forEach((dot, idx) => {
        if (idx === currentIndex) {
          dot.classList.add('promo__dot--active');
        } else {
          dot.classList.remove('promo__dot--active');
        }
      });
    }

    function changeSlide(targetIndex) {
      currentIndex = Math.max(0, Math.min(targetIndex, totalSlides - 1));
      updateSlider(true);
    }

    function getPositionX(event) {
      return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    function dragStart(event) {
      isDragging = true;
      startX = getPositionX(event);
      dragOffset = 0;
    }

    function dragMove(event) {
      if (!isDragging) return;
      const currentX = getPositionX(event);
      dragOffset = currentX - startX;

      if ((currentIndex === 0 && dragOffset > 0) || (currentIndex === totalSlides - 1 && dragOffset < 0)) {
        dragOffset *= 0.3;
      }

      updateSlider(false, dragOffset);
    }

    function dragEnd() {
      if (!isDragging) return;
      isDragging = false;

      const threshold = screensContainer.offsetWidth * 0.15;

      if (dragOffset < -threshold && currentIndex < totalSlides - 1) {
        changeSlide(currentIndex + 1);
      } else if (dragOffset > threshold && currentIndex > 0) {
        changeSlide(currentIndex - 1);
      } else {
        changeSlide(currentIndex);
      }
    }

    steps.forEach((step, index) => {
      step.addEventListener('click', function () {
        changeSlide(index);
      });
    });

    screensContainer.addEventListener('mousedown', dragStart);
    window.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', dragEnd);

    screensContainer.addEventListener('touchstart', dragStart, { passive: true });
    window.addEventListener('touchmove', dragMove, { passive: false });
    window.addEventListener('touchend', dragEnd);

    screensContainer.addEventListener('dragstart', (e) => e.preventDefault());

    updateSlider(false);
  })();







});



// ===== Testimonials =====

document.addEventListener('DOMContentLoaded', () => {

  const sc = document.querySelector('.testimonials__slides');
  const prev = document.querySelector('.testimonials__nav-btn--prev');
  const next = document.querySelector('.testimonials__nav-btn--next');
  const isMob = () => innerWidth < 768;

  if (sc) {
    const slides = () => Array.from(sc.querySelectorAll('.testimonials__slide'));

    (document.fonts?.ready || new Promise(r => addEventListener('load', r))).then(() => {
      initText();
      updateArrows();
    });

    const collapseAll = () =>
      document.querySelectorAll('.testimonials__text--expanded').forEach(el => toggle(el, false));

    const getNearestIdx = () => {
      const s = slides();
      if (!s.length) return 0;
      const curr = sc.scrollLeft;
      let idx = 0, min = Infinity;
      s.forEach((el, i) => {
        const d = Math.abs(curr - (el.offsetLeft - s[0].offsetLeft));
        if (d < min) { min = d; idx = i; }
      });
      return idx;
    };

    const navigate = dir => {
      collapseAll();
      const s = slides();
      if (!s.length) return;
      const currIdx = getNearestIdx();
      const targetIdx = Math.max(0, Math.min(s.length - 1, currIdx + dir));
      sc.scrollTo({
        left: s[targetIdx].offsetLeft - s[0].offsetLeft,
        behavior: 'smooth'
      });
    };

    next?.addEventListener('click', () => navigate(1));
    prev?.addEventListener('click', () => navigate(-1));

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let isDragging = false;

    sc.addEventListener('pointerdown', e => {
      if (window.innerWidth > 1279) return;
      if (e.target.closest('button') || e.target.closest('.text-violet-more')) return;
      if (e.pointerType !== 'mouse') return;

      isDown = true;
      isDragging = false;
      startX = e.pageX - sc.offsetLeft;
      scrollLeft = sc.scrollLeft;
      sc.style.scrollSnapType = 'none';
      sc.style.cursor = 'pointer';
      collapseAll();
      try { sc.setPointerCapture(e.pointerId); } catch (_) { }
    });

    sc.addEventListener('pointermove', e => {
      if (!isDown || window.innerWidth > 1279) return;
      e.preventDefault();
      const x = e.pageX - sc.offsetLeft;
      const walk = startX - x;
      if (Math.abs(walk) > 5) isDragging = true;
      sc.scrollLeft = scrollLeft + walk;
    });

    const snapToNearest = () => {
      const s = slides();
      if (!s.length) return;
      const nearestIdx = getNearestIdx();
      const targetPos = s[nearestIdx].offsetLeft - s[0].offsetLeft;
      sc.scrollTo({ left: targetPos, behavior: 'smooth' });
    };

    const stopDrag = e => {
      if (!isDown) return;
      isDown = false;
      try { if (e && e.pointerId) sc.releasePointerCapture(e.pointerId); } catch (_) { }
      sc.style.cursor = '';
      sc.style.scrollSnapType = 'none';
      snapToNearest();
      setTimeout(() => isDragging = false, 50);
    };

    sc.addEventListener('pointerup', stopDrag);
    sc.addEventListener('pointercancel', stopDrag);
    sc.addEventListener('pointerleave', stopDrag);

    window.addEventListener('click', e => {
      if (isDragging) {
        e.stopPropagation();
        e.preventDefault();
        isDragging = false;
      }
    }, true);

    let st;
    sc.addEventListener('scroll', () => {
      updateArrows();
      if (st || !document.querySelector('.testimonials__text--expanded')) return;
      st = setTimeout(() => { collapseAll(); st = null; }, 50);
    }, { passive: true });

    const updateArrows = () => {
      if (!prev || !next) return;
      if (!isMob()) {
        prev.style.top = next.style.top = '120px';
        prev.style.transform = 'translateY(-50%)';
        next.style.transform = 'translateY(-50%) rotate(180deg)';
      }
      const atStart = sc.scrollLeft <= 2;
      const atEnd = Math.ceil(sc.scrollLeft + sc.clientWidth) >= sc.scrollWidth - 2;
      prev.style.pointerEvents


        = atStart ? 'none' : '';
      next.style.pointerEvents = atEnd ? 'none' : '';
    };

    const trunc = el => {
      const card = el.closest('.testimonials__slide');
      const short = card?.classList.contains('testimonials__slide--short');
      const maxH = short ? (isMob() ? 144 : 96) : (isMob() ? 168 : 120);
      const w = el.dataset.fullText.split(/\s+/);
      let lo = 1, hi = w.length - 1;
      while (lo < hi) {
        const m = Math.ceil((lo + hi) / 2);
        el.innerHTML = w.slice(0, m).join(' ') + '… <span class="text-violet-more">ещё</span>';
        el.scrollHeight <= maxH ? lo = m : hi = m - 1;
      }
      el.innerHTML = w.slice(0, lo).join(' ') + '… <span class="text-violet-more">ещё</span>';
    };

    const toggle = (el, expand) => {
      const card = el.closest('.testimonials__slide');
      if (expand) {
        document.querySelectorAll('.testimonials__text--expanded').forEach(o => o !== el && toggle(o, false));
        el.innerHTML = el.dataset.fullText + ' <span class="text-violet-more">скрыть</span>';
        el.classList.add('testimonials__text--expanded');
        card?.classList.add('testimonials__slide--expanded');
      } else {
        if (!el.dataset.fullText) return;
        trunc(el);
        el.classList.remove('testimonials__text--expanded');
        card?.classList.remove('testimonials__slide--expanded');
      }
      el.dataset.expanded = expand ? 'true' : 'false';
      requestAnimationFrame(updateArrows);
    };

    const initText = () => {
      document.querySelectorAll('.testimonials__text').forEach(el => {
        if (el.dataset.processed) return;
        el.dataset.processed = '1';
        const full = el.textContent.trim();
        el.style.height = 'auto'; el.style.overflow = 'visible';
        const card = el.closest('.testimonials__slide');
        const short = card?.classList.contains('testimonials__slide--short');
        const maxH = short ? (isMob() ? 144 : 96) : (isMob() ? 168 : 120);
        if (el.scrollHeight <= maxH) { el.style.height = ''; el.style.overflow = ''; return; }
        el.dataset.fullText = full;
        trunc(el);
        el.style.height = ''; el.style.overflow = '';
        el.addEventListener('click', e => {
          if (!e.target.closest('.text-violet-more')) return;
          e.stopPropagation();
          toggle(el, el.dataset.expanded !== 'true');
        });
      });
    };

    let rt;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        updateArrows();
        if (window.innerWidth > 1279) {
          sc.style.scrollSnapType = '';
          sc.style.cursor = '';
        }
      }, 100);
    });
  }
});





/* ============ Buttons - CSS ============ */
document.addEventListener('DOMContentLoaded', () => {
  const CONFIG = {
    spacing: 20,
    distance: 50,
    size: 4,
    duration: 1000,
    glow: true,
    throttle: 300,
    selector: '.common-btn, .footer__logo, .header__logo'
  };

  const RAINBOW_COLORS = [
    '#ff8c66', '#ffa080', '#ff6699', '#e666b3',
    '#b366ff', '#8c7aff', '#679aff', '#66c2ff', '#ffd166'
  ];

  let isCooldown = false;

  function spawnSymmetricFirework(el) {
    if (isCooldown) return;

    isCooldown = true;
    setTimeout(() => {
      isCooldown = false;
    }, CONFIG.throttle);

    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;

    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const W = rect.width;
    const H = rect.height;
    const R = el.tagName === 'IMG' ? 4 : 12;

    const container = document.createElement('div');
    container.className = 'rainbow-firework-container';
    container.style.left = (rect.left + scrollX) + 'px';
    container.style.top = (rect.top + scrollY) + 'px';
    container.style.width = W + 'px';
    container.style.height = H + 'px';
    document.body.appendChild(container);

    const pointsTL = [];
    const sp = CONFIG.spacing;

    for (let x = W / 2 - sp / 2; x >= R; x -= sp) {
      pointsTL.push({ x, y: 0, nx: 0, ny: -1 });
    }
    const cornerSteps = Math.max(2, Math.floor((R * Math.PI / 2) / sp));
    for (let i = 0; i < cornerSteps; i++) {
      const angle = Math.PI / 2 + ((i + 0.5) / cornerSteps) * (Math.PI / 2);
      pointsTL.push({
        x: R + R * Math.cos(angle),
        y: R - R * Math.sin(angle),
        nx: Math.cos(angle),
        ny: -Math.sin(angle)
      });
    }
    for (let y = R + sp / 2; y < H / 2; y += sp) {
      pointsTL.push({ x: 0, y, nx: -1, ny: 0 });
    }

    let activeCount = 0;

    pointsTL.forEach((pt) => {
      const variants = [
        { x: pt.x, y: pt.y, nx: pt.nx, ny: pt.ny },
        { x: W - pt.x, y: pt.y, nx: -pt.nx, ny: pt.ny },
        { x: pt.x, y: H - pt.y, nx: pt.nx, ny: -pt.ny },
        { x: W - pt.x, y: H - pt.y, nx: -pt.nx, ny: -pt.ny }
      ];

      variants.forEach((v) => {
        const randomScale = 0.4 + Math.random() * 1.3;
        const randomSpeed = 0.7 + Math.random() * 0.6;
        const color = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];

        const particle = document.createElement('div');
        particle.className = 'rainbow-firework-particle' + (CONFIG.glow ? ' glow-effect' : '');

        const pHeight = CONFIG.size * 2.5;
        const angle = Math.atan2(v.ny, v.nx) + Math.PI / 2;
        const dist = CONFIG.distance * randomScale;

        Object.assign(particle.style, {
          width: CONFIG.size + 'px',
          height: pHeight + 'px',
          backgroundColor: color,
          left: (v.x - CONFIG.size / 2) + 'px',
          top: (v.y - pHeight / 2) + 'px',
          boxShadow: `0 0 ${CONFIG.size * 2.5}px ${color}`,
          transform: `rotate(${angle}rad) scaleY(0)`
        });

        container.appendChild(particle);
        activeCount++;

        const anim = particle.animate([
          { transform: `translate(0,0) rotate(${angle}rad) scaleY(0)`, opacity: 0 },
          { transform: `translate(${v.nx * dist * 0.2}px, ${v.ny * dist * 0.2}px) rotate(${angle}rad) scaleY(1.8)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${v.nx * dist}px, ${v.ny * dist}px) rotate(${angle}rad) scaleY(0.1)`, opacity: 0, offset: 1 }
        ], {
          duration: CONFIG.duration * randomSpeed,
          easing: 'cubic-bezier(0.15, 0.85, 0.35, 1)',
          fill: 'forwards'
        });

        anim.onfinish = () => {
          particle.remove();
          activeCount--;
          if (activeCount === 0) container.remove();
        };
      });
    });
  }

  document.querySelectorAll(CONFIG.selector).forEach(item => {
    item.addEventListener('mouseenter', () => spawnSymmetricFirework(item));
  });
});




document.addEventListener('DOMContentLoaded', () => {
  const topicChips = document.querySelectorAll('.text-highlight');

  topicChips.forEach(chip => {
    const handleEnter = (e) => {
      const chipAngle = (Math.random() * 14 - 7).toFixed(2);
      e.currentTarget.style.transform = `scale(1.15) rotate(${chipAngle}deg)`;

    };

    const handleLeave = (e) => {
      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
    };

    chip.addEventListener('mouseenter', handleEnter);
    chip.addEventListener('mouseleave', handleLeave);

    chip.addEventListener('touchstart', (e) => {
      handleEnter(e);
    }, { passive: true });
    chip.addEventListener('touchend', (e) => {
      handleLeave(e);
    }, { passive: true });
  });

});
