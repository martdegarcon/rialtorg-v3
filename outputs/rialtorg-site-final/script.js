(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menuButton = document.querySelector('.nav__toggle');
  const menu = document.querySelector('.nav__items');

  const closeMenu = () => {
    menu?.classList.remove('open');
    menu?.querySelectorAll('.nav__item.is-open').forEach((item) => item.classList.remove('is-open'));
    menuButton?.setAttribute('aria-expanded', 'false');
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menu?.classList.toggle('open') ?? false;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    if (!isOpen) {
      menu?.querySelectorAll('.nav__item.is-open').forEach((item) => item.classList.remove('is-open'));
    }
  });

  const isMobileNav = () => window.matchMedia('(max-width: 1024px)').matches;

  document.querySelectorAll('.nav__item > .nav__link').forEach((link) => {
    link.addEventListener('click', (event) => {
      const item = link.closest('.nav__item');

      if (!item || !menu?.classList.contains('open') || !isMobileNav()) return;

      event.preventDefault();
      event.stopPropagation();

      const shouldOpen = !item.classList.contains('is-open');
      menu.querySelectorAll('.nav__item.is-open').forEach((opened) => {
        if (opened !== item) opened.classList.remove('is-open');
      });
      item.classList.toggle('is-open', shouldOpen);
    }, true);
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');

      if (!hash || hash === '#') {
        event.preventDefault();
        closeMenu();
        return;
      }

      const target = document.querySelector(hash);

      if (!target) return;

      event.preventDefault();
      closeMenu();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      history.pushState(null, '', hash);
    });
  });

  document.querySelectorAll('.accordion article').forEach((item) => {
    const button = item.querySelector('button');
    button?.setAttribute('aria-expanded', 'false');
    button?.addEventListener('click', () => {
      item.closest('.accordion')?.querySelectorAll('article.open').forEach((opened) => {
        if (opened === item) return;
        opened.classList.remove('open');
        opened.querySelector('button')?.setAttribute('aria-expanded', 'false');
      });

      const isOpen = item.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  });

  document.querySelector('.request-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    const originalLabel = 'Отправить ';
    if (!button?.firstChild) return;

    button.firstChild.textContent = 'Заявка отправлена ';
    setTimeout(() => {
      button.firstChild.textContent = originalLabel;
    }, 2400);
  });

  const scrollableSelectors = [
    '.process__track',
    '.projects__track',
    '.news__grid',
    '.documents__grid',
    '.testimonials__grid',
    '.catalog__grid',
    '.rooms__grid',
  ];

  const getGap = (element) => {
    const gap = parseFloat(getComputedStyle(element).columnGap || getComputedStyle(element).gap || '16');
    return Number.isFinite(gap) ? gap : 16;
  };

  const canScrollX = (element) => element.scrollWidth > element.clientWidth + 4;

  const initDragScroll = (track) => {
    let pointerId = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;

    track.addEventListener('wheel', (event) => {
      if (event.defaultPrevented) return;
      if (!canScrollX(track)) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const before = track.scrollLeft;
      track.scrollLeft += event.deltaY;

      if (track.scrollLeft !== before) {
        event.preventDefault();
      }
    }, { passive: false });

    track.addEventListener('pointerdown', (event) => {
      if (!canScrollX(track) || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      dragged = false;
      track.classList.add('is-dragging');
      track.setPointerCapture?.(event.pointerId);
    });

    track.addEventListener('pointermove', (event) => {
      if (pointerId !== event.pointerId) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 3) dragged = true;
      track.scrollLeft = startScroll - delta;
    });

    const endDrag = (event) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      track.classList.remove('is-dragging');
      track.releasePointerCapture?.(event.pointerId);
    };

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('click', (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }, true);
  };

  const scrollableTracks = Array.from(document.querySelectorAll(scrollableSelectors.join(',')));
  scrollableTracks.forEach(initDragScroll);

  const isFormTarget = (target) => target instanceof Element && Boolean(target.closest('input, textarea, select, button, [contenteditable="true"], form'));

  const getActiveHorizontalTrack = () => {
    let activeTrack = null;
    let activeScore = 0;

    scrollableTracks.forEach((track) => {
      if (!canScrollX(track)) return;

      const section = track.closest('section') || track;
      const rect = section.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);

      if (visibleHeight <= 120) return;

      const centerBonus = rect.top < window.innerHeight * 0.62 && rect.bottom > window.innerHeight * 0.38 ? 1.4 : 1;
      const score = (visibleHeight / Math.max(1, Math.min(rect.height, window.innerHeight))) * centerBonus;

      if (score > activeScore) {
        activeScore = score;
        activeTrack = track;
      }
    });

    return activeTrack;
  };

  window.addEventListener('wheel', (event) => {
    if (event.defaultPrevented || isFormTarget(event.target)) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    const track = event.target instanceof Element && event.target.closest(scrollableSelectors.join(','))
      ? event.target.closest(scrollableSelectors.join(','))
      : getActiveHorizontalTrack();
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    const wantsForward = event.deltaY > 0;
    const canMove = wantsForward ? track.scrollLeft < maxScroll - 2 : track.scrollLeft > 2;

    event.preventDefault();
    if (canMove) {
      track.scrollLeft += event.deltaY;
      return;
    }

    const isAtStart = track.scrollLeft <= 2;
    const isAtEnd = track.scrollLeft >= maxScroll - 2;

    if ((wantsForward && isAtEnd) || (!wantsForward && isAtStart)) {
      window.scrollBy({
        top: wantsForward ? Math.min(event.deltaY, 120) : Math.max(event.deltaY, -120),
        behavior: 'auto',
      });
    }
  }, { passive: false, capture: true });

  const projectsTrack = document.querySelector('.projects__track');
  const sliderUi = document.querySelector('.slider-ui');
  const sliderButtons = sliderUi ? Array.from(sliderUi.querySelectorAll('button')) : [];
  const sliderDots = sliderUi ? Array.from(sliderUi.children).filter((child) => child.tagName === 'SPAN') : [];

  const updateProjectDots = () => {
    if (!projectsTrack || !sliderDots.length) return;
    const firstCard = projectsTrack.querySelector('.project-card');
    const step = firstCard ? firstCard.getBoundingClientRect().width + getGap(projectsTrack) : projectsTrack.clientWidth;
    const index = Math.min(sliderDots.length - 1, Math.max(0, Math.round(projectsTrack.scrollLeft / Math.max(step, 1))));

    sliderDots.forEach((dot, dotIndex) => {
      dot.classList.toggle('slider-ui__active', dotIndex === index);
    });
  };

  sliderButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      if (!projectsTrack) return;
      const firstCard = projectsTrack.querySelector('.project-card');
      const step = firstCard ? firstCard.getBoundingClientRect().width + getGap(projectsTrack) : projectsTrack.clientWidth;
      projectsTrack.scrollBy({
        left: (index === 0 ? -1 : 1) * step,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    });
  });

  projectsTrack?.addEventListener('scroll', () => window.requestAnimationFrame(updateProjectDots), { passive: true });
  updateProjectDots();

  const initGsap = () => {
    if (prefersReducedMotion || !window.gsap) {
      document.documentElement.dataset.gsap = prefersReducedMotion ? 'reduced-motion' : 'missing';
      return;
    }

    const { gsap } = window;
    document.documentElement.dataset.gsap = 'ready';
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    gsap.from('.nav', {
      autoAlpha: 0,
      y: -18,
      duration: 0.75,
      ease: 'power2.out',
    });

    gsap.from(['.hero__copy > *', '.hero__facts'], {
      autoAlpha: 0,
      y: 34,
      filter: 'blur(10px)',
      duration: 0.85,
      ease: 'power3.out',
      stagger: 0.08,
      delay: 0.12,
      clearProps: 'filter',
    });

    if (window.ScrollTrigger) {
      gsap.utils.toArray('main > section').forEach((section) => {
        const items = section.querySelectorAll([
          '.eyebrow',
          'h2',
          '.section-intro > p',
          '.button',
          '.feature-tile',
          '.process-card',
          '.product-card',
          '.room-card',
          '.project-card',
          '.news-card',
          '.documents__grid article',
          '.testimonials__grid article',
          '.benefit',
          '.accordion article',
          '.request-form',
        ].join(','));

        if (!items.length) return;

        gsap.from(items, {
          autoAlpha: 0,
          y: 36,
          filter: 'blur(8px)',
          duration: 0.72,
          ease: 'power2.out',
          stagger: 0.045,
          clearProps: 'filter',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            once: true,
          },
        });
      });

      gsap.utils.toArray('.hero__media, .image-cta__media').forEach((media) => {
        gsap.from(media, {
          autoAlpha: 0.72,
          filter: 'blur(14px)',
          scale: 1.025,
          duration: 0.9,
          ease: 'power2.out',
          clearProps: 'filter,opacity,visibility,transform',
          scrollTrigger: media.classList.contains('hero__media') ? undefined : {
            trigger: media.parentElement,
            start: 'top 80%',
            once: true,
          },
        });

        gsap.to(media, {
          backgroundPosition: '50% 56%',
          ease: 'none',
          scrollTrigger: {
            trigger: media.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }

    document.querySelectorAll('.button').forEach((button) => {
      button.addEventListener('mouseenter', () => {
        gsap.to(button, { scale: 1.015, duration: 0.2, ease: 'power2.out' });
      });
      button.addEventListener('mouseleave', () => {
        gsap.to(button, { scale: 1, duration: 0.2, ease: 'power2.out' });
      });
    });
  };

  initGsap();
  document.documentElement.dataset.interactive = 'ready';
})();
