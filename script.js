(() => {
  const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = prefersReducedMotionQuery.matches;
  const menuButton = document.querySelector('.nav__toggle');
  const menu = document.querySelector('.nav__items');

  const closeMenu = () => {
    menu?.classList.remove('open');
    menu?.querySelectorAll('.nav__item.is-open').forEach((item) => item.classList.remove('is-open'));
    menuButton?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menu?.classList.toggle('open') ?? false;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-open', isOpen);
    if (!isOpen) {
      menu?.querySelectorAll('.nav__item.is-open').forEach((item) => item.classList.remove('is-open'));
    }
  });

  const isMobileNav = () => window.matchMedia('(max-width: 1200px)').matches;

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (!isMobileNav()) closeMenu();
  }, { passive: true });

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

  const dragScrollMediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const dragScrollThreshold = 8;

  const getGap = (element) => {
    const gap = parseFloat(getComputedStyle(element).columnGap || getComputedStyle(element).gap || '16');
    return Number.isFinite(gap) ? gap : 16;
  };

  const canScrollX = (element) => element.scrollWidth > element.clientWidth + 4;
  // Shared DOM-based distance calculation so every horizontal scene uses the same overflow width.
  const getHorizontalDistance = (track) => Math.max(0, track.scrollWidth - track.clientWidth);

  const isEditableTarget = (target) => target instanceof HTMLElement
    && Boolean(target.closest('input, textarea, select, option, [contenteditable="true"]'));

  // Mouse drag is opt-in per track and only activates after horizontal intent is confirmed.
  const initDragScroll = (track, options = {}) => {
    const isLocked = options.isLocked ?? (() => track.classList.contains('is-horizontal-scroll-active'));
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startScroll = 0;
    let dragActivated = false;
    let suppressClick = false;
    let pointerCaptured = false;

    const resetState = () => {
      if (pointerCaptured && pointerId !== null && track.hasPointerCapture?.(pointerId)) {
        track.releasePointerCapture(pointerId);
      }

      pointerId = null;
      dragActivated = false;
      pointerCaptured = false;
      track.classList.remove('is-dragging');
    };

    const cancelPendingDrag = () => {
      if (!dragActivated) {
        pointerId = null;
      }
    };

    const onPointerDown = (event) => {
      if (!dragScrollMediaQuery.matches || isLocked() || !canScrollX(track)) return;
      if (!event.isPrimary || event.pointerType !== 'mouse' || event.button !== 0) return;
      if (isEditableTarget(event.target)) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startScroll = track.scrollLeft;
      dragActivated = false;
      suppressClick = false;
    };

    const onPointerMove = (event) => {
      if (pointerId !== event.pointerId) return;

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!dragActivated) {
        if (absX < dragScrollThreshold && absY < dragScrollThreshold) return;

        if (absX >= dragScrollThreshold && absX > absY * 1.15) {
          dragActivated = true;
          track.classList.add('is-dragging');
          track.setPointerCapture?.(event.pointerId);
          pointerCaptured = true;
        } else if (absY >= dragScrollThreshold && absY >= absX) {
          cancelPendingDrag();
        }

        if (!dragActivated) return;
      }

      event.preventDefault();
      track.scrollLeft = startScroll - deltaX;
      suppressClick = true;
    };

    const endDrag = (event) => {
      if (pointerId !== event.pointerId) return;
      resetState();
    };

    const onLostPointerCapture = (event) => {
      if (pointerId !== event.pointerId) return;
      resetState();
    };

    const onClick = (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    };

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('lostpointercapture', onLostPointerCapture);
    track.addEventListener('click', onClick, true);

    return () => {
      resetState();
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointermove', onPointerMove);
      track.removeEventListener('pointerup', endDrag);
      track.removeEventListener('pointercancel', endDrag);
      track.removeEventListener('lostpointercapture', onLostPointerCapture);
      track.removeEventListener('click', onClick, true);
    };
  };

  const scrollableTracks = Array.from(document.querySelectorAll('[data-drag-scroll]'));
  scrollableTracks.forEach((track) => initDragScroll(track));

  // Large-desktop layouts absolutely position `main > section`, so the pinned scene needs manual spacing compensation.
  const isAbsoluteDesktopLayout = (section) => {
    const main = section.closest('main');
    if (!main) return false;

    return getComputedStyle(main).position === 'relative' && getComputedStyle(section).position === 'absolute';
  };

  const createAbsoluteLayoutCompensation = (section) => {
    const main = section.closest('main');
    if (!main) return null;

    const sections = Array.from(main.children).filter((node) => node instanceof HTMLElement && node.matches('section'));
    const sectionIndex = sections.indexOf(section);
    if (sectionIndex < 0) return null;

    const affectedSections = sections
      .slice(sectionIndex + 1)
      .filter((node) => getComputedStyle(node).position === 'absolute');

    if (!affectedSections.length) return null;

    const baseMainHeight = parseFloat(getComputedStyle(main).height) || main.offsetHeight || 0;
    const baseTops = new Map(
      affectedSections.map((node) => [node, parseFloat(getComputedStyle(node).top) || 0]),
    );

    return {
      apply(offset) {
        affectedSections.forEach((node) => {
          const baseTop = baseTops.get(node) || 0;
          node.style.top = `${baseTop + offset}px`;
        });

        if (baseMainHeight > 0) {
          main.style.height = `${baseMainHeight + offset}px`;
        }
      },
      clear() {
        affectedSections.forEach((node) => {
          node.style.top = '';
        });
        main.style.height = '';
      },
    };
  };

  // Restore the track to its normal scrollable state when the media query or ScrollTrigger scene is torn down.
  const clearProcessHorizontalState = (section, track, rail, gsap) => {
    section.classList.remove('is-horizontal-scroll-active');
    track.classList.remove('is-horizontal-scroll-active');
    track.scrollLeft = 0;
    gsap.set(rail, { clearProps: 'transform' });
  };

  // Pin `.process` and translate the rail horizontally so vertical page progress drives the desktop timeline.
  const createProcessHorizontalScroll = (section, track, rail, gsap) => {
    const horizontalDistance = () => getHorizontalDistance(track);
    // Absolute-positioned sections below `.process` need an explicit offset because pin spacing is unreliable here.
    const usesAbsoluteDesktopLayout = isAbsoluteDesktopLayout(section);
    const absoluteCompensation = usesAbsoluteDesktopLayout
      ? createAbsoluteLayoutCompensation(section)
      : null;

    section.classList.add('is-horizontal-scroll-active');
    track.classList.add('is-horizontal-scroll-active');
    track.scrollLeft = 0;

    const syncAbsoluteLayout = () => {
      track.scrollLeft = 0;
      if (!absoluteCompensation) return;
      absoluteCompensation.apply(horizontalDistance());
    };

    let tween;
    const context = gsap.context(() => {
      tween = gsap.to(rail, {
        x: () => -horizontalDistance(),
        ease: 'none',
        overwrite: 'auto',
        scrollTrigger: {
          id: 'process-horizontal-scroll',
          trigger: section,
          start: 'bottom bottom',
          end: () => `+=${horizontalDistance()}`,
          pin: true,
          pinSpacing: !usesAbsoluteDesktopLayout,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: syncAbsoluteLayout,
          onRefresh: syncAbsoluteLayout,
        },
      });
    }, section);

    syncAbsoluteLayout();

    return () => {
      tween?.scrollTrigger?.kill();
      tween?.kill();
      absoluteCompensation?.clear();
      clearProcessHorizontalState(section, track, rail, gsap);
      context.revert();
    };
  };

  // MatchMedia keeps the pinned desktop version opt-in, with a no-pin fallback for reduced motion and smaller screens.
  const initProcessScroll = (gsap, ScrollTrigger) => {
    const section = document.querySelector('.process');
    const track = section?.querySelector('.process__track');
    const rail = track?.querySelector('.process__rail');

    if (!section || !track || !rail || !ScrollTrigger) return () => {};

    const media = gsap.matchMedia();
    media.add('(min-width: 1025px) and (prefers-reduced-motion: no-preference)', () => {
      if (getHorizontalDistance(track) <= 0) {
        clearProcessHorizontalState(section, track, rail, gsap);
        return () => {};
      }

      return createProcessHorizontalScroll(section, track, rail, gsap);
    });

    return () => {
      media.revert();
      clearProcessHorizontalState(section, track, rail, gsap);
    };
  };

  const projectsSection = document.querySelector('#projects');
  const projectsTrack = projectsSection?.querySelector('.projects__track');
  const sliderUi = projectsSection?.querySelector('.slider-ui');
  const sliderDotsContainer = sliderUi?.querySelector('.slider-ui__dots');
  const sliderButtons = sliderUi ? Array.from(sliderUi.querySelectorAll('.slider-ui__actions button')) : [];
  const projectSliderState = {
    dotButtons: [],
    positions: [],
    scrollFrame: 0,
    resizeFrame: 0,
  };

  const roundProjectPosition = (value) => Math.round(value * 100) / 100;

  const getProjectCards = () => (
    projectsTrack ? Array.from(projectsTrack.querySelectorAll('.project-card')) : []
  );

  const getProjectCardScrollLeft = (card) => {
    if (!projectsTrack || !card) return 0;
    const trackStyles = getComputedStyle(projectsTrack);
    const paddingLeft = Number.parseFloat(trackStyles.paddingLeft) || 0;
    return Math.max(0, card.offsetLeft - paddingLeft);
  };

  const scrollProjectCardIntoView = (card) => {
    if (!projectsTrack || !card) return;

    card.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  };

  const getClosestProjectCardIndex = () => {
    const cards = getProjectCards();
    if (!projectsTrack || !cards.length) return 0;

    const trackRect = projectsTrack.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;

    return cards.reduce((closestIndex, card, index, list) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const closestRect = list[closestIndex].getBoundingClientRect();
      const closestCenter = closestRect.left + closestRect.width / 2;
      return Math.abs(cardCenter - trackCenter) < Math.abs(closestCenter - trackCenter)
        ? index
        : closestIndex;
    }, 0);
  };

  const scrollProjectsByDirection = (direction) => {
    if (!projectsTrack) return;

    const cards = getProjectCards();
    if (!cards.length) return;

    const activeIndex = getClosestProjectCardIndex();
    const nextIndex = direction > 0
      ? Math.min(cards.length - 1, activeIndex + 1)
      : Math.max(0, activeIndex - 1);

    scrollProjectCardIntoView(cards[nextIndex]);
  };

  const getProjectScrollPositions = () => {
    if (!projectsTrack) return [];

    const cards = getProjectCards();
    const maxScrollLeft = Math.max(0, projectsTrack.scrollWidth - projectsTrack.clientWidth);
    if (!cards.length || maxScrollLeft <= 1) return [0];

    const positions = cards
      .map((card) => roundProjectPosition(getProjectCardScrollLeft(card)))
      .filter((position, index, list) => position <= maxScrollLeft + 1 && (index === 0 || position > list[index - 1] + 0.5));

    if (!positions.length) return [0];

    const lastPosition = roundProjectPosition(maxScrollLeft);
    if (Math.abs(positions[positions.length - 1] - lastPosition) > 0.5) {
      positions.push(lastPosition);
    }

    return positions;
  };

  const getClosestProjectPositionIndex = () => {
    if (!projectsTrack || !projectSliderState.positions.length) return 0;

    return projectSliderState.positions.reduce((closestIndex, position, index, positions) => {
      const currentDistance = Math.abs(position - projectsTrack.scrollLeft);
      const closestDistance = Math.abs(positions[closestIndex] - projectsTrack.scrollLeft);
      return currentDistance < closestDistance ? index : closestIndex;
    }, 0);
  };

  const updateProjectPagination = () => {
    if (!sliderUi || !projectSliderState.dotButtons.length) return;

    const activeIndex = getClosestProjectPositionIndex();
    projectSliderState.dotButtons.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle('slider-ui__dot--active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    sliderButtons.forEach((button, index) => {
      const isPreviousButton = index === 0;
      button.disabled = isPreviousButton
        ? activeIndex === 0
        : activeIndex === projectSliderState.positions.length - 1;
    });
  };

  const scrollProjectsToIndex = (index) => {
    if (!projectsTrack || !projectSliderState.positions.length) return;

    const targetIndex = Math.max(0, Math.min(projectSliderState.positions.length - 1, index));
    const targetLeft = projectSliderState.positions[targetIndex];

    if (typeof projectsTrack.scrollTo === 'function') {
      projectsTrack.scrollTo({
        left: targetLeft,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
      return;
    }

    projectsTrack.scrollLeft = targetLeft;
  };

  const rebuildProjectPagination = () => {
    if (!projectsTrack || !sliderDotsContainer || !sliderUi) return;

    projectSliderState.positions = getProjectScrollPositions();
    projectSliderState.dotButtons = projectSliderState.positions.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-ui__dot';
      dot.setAttribute('aria-label', `Перейти к позиции ${index + 1}`);
      dot.addEventListener('click', () => {
        scrollProjectsToIndex(index);
      });
      return dot;
    });

    sliderDotsContainer.replaceChildren(...projectSliderState.dotButtons);
    sliderUi.classList.toggle('slider-ui--single', projectSliderState.positions.length <= 1);
    updateProjectPagination();
  };

  const queueProjectPaginationUpdate = () => {
    if (projectSliderState.scrollFrame) return;

    projectSliderState.scrollFrame = window.requestAnimationFrame(() => {
      projectSliderState.scrollFrame = 0;
      updateProjectPagination();
    });
  };

  const queueProjectPaginationRebuild = () => {
    if (projectSliderState.resizeFrame) {
      window.cancelAnimationFrame(projectSliderState.resizeFrame);
    }

    projectSliderState.resizeFrame = window.requestAnimationFrame(() => {
      projectSliderState.resizeFrame = 0;
      rebuildProjectPagination();
    });
  };

  sliderButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      scrollProjectsByDirection(index === 0 ? -1 : 1);
    });
  });

  projectsTrack?.addEventListener('scroll', queueProjectPaginationUpdate, { passive: true });
  window.addEventListener('resize', queueProjectPaginationRebuild, { passive: true });
  window.addEventListener('load', () => {
    queueProjectPaginationRebuild();
    updateNavTheme();
  }, { once: true });
  rebuildProjectPagination();

  const nav = document.querySelector('.nav');
  const darkNavSelectors = '.hero, .image-cta';

  const updateNavTheme = () => {
    if (!nav) return;

    const probeY = Math.min(window.innerHeight - 1, Math.max(1, (nav.getBoundingClientRect().bottom || 80) - 8));
    const probeX = Math.min(window.innerWidth - 1, Math.max(1, window.innerWidth / 2));
    const sample = document.elementFromPoint(probeX, probeY);
    const onDark = Boolean(sample?.closest(darkNavSelectors));

    nav.classList.toggle('nav--dark', onDark);
    nav.classList.toggle('nav--light', !onDark);
  };

  updateNavTheme();
  window.addEventListener('scroll', updateNavTheme, { passive: true });
  window.addEventListener('resize', updateNavTheme, { passive: true });
  window.addEventListener('load', updateNavTheme, { once: true });

  const rollFillResizeCallbacks = new Set();
  let hasRollFillResizeFallback = false;
  const registerRollFillResizeFallback = (callback) => {
    rollFillResizeCallbacks.add(callback);
    if (hasRollFillResizeFallback) {
      return;
    }

    hasRollFillResizeFallback = true;
    window.addEventListener('resize', () => {
      rollFillResizeCallbacks.forEach((resizeCallback) => {
        resizeCallback();
      });
    }, { passive: true });
  };

  const initRollFillButton = (button, gsap) => {
    if (button.dataset.rollFillInitialized === 'true') {
      return;
    }

    const label = button.querySelector('[data-roll-fill-label]');
    if (!label) {
      return;
    }

    const icon = button.querySelector('[data-roll-fill-icon]');
    const labelMarkup = label.innerHTML.trim();
    const labelText = label.textContent?.trim() ?? '';
    if (!labelMarkup && !labelText) {
      return;
    }

    const fill = document.createElement('span');
    fill.className = 'roll-fill-button__fill';
    fill.dataset.rollFillBackground = '';
    fill.setAttribute('aria-hidden', 'true');

    const viewport = document.createElement('span');
    viewport.className = 'roll-fill-button__viewport';

    const buildLabel = (sourceLabel) => {
      const rowLabel = sourceLabel ?? document.createElement('span');
      rowLabel.classList.add('roll-fill-button__label');
      if (!sourceLabel) {
        rowLabel.innerHTML = labelMarkup || labelText;
      }
      return rowLabel;
    };

    const buildIcon = (sourceIcon) => {
      if (sourceIcon) {
        sourceIcon.classList.add('roll-fill-button__icon');
        return sourceIcon;
      }

      if (!icon) {
        return null;
      }

      const clonedIcon = icon.cloneNode(true);
      clonedIcon.removeAttribute('data-roll-fill-icon');
      clonedIcon.classList.add('roll-fill-button__icon');
      clonedIcon.setAttribute('aria-hidden', 'true');
      return clonedIcon;
    };

    const buildRow = ({ labelNode, iconNode, className, isHidden }) => {
      const row = document.createElement('span');
      row.className = className;
      if (isHidden) {
        row.setAttribute('aria-hidden', 'true');
      }

      row.append(buildLabel(labelNode));

      const rowIcon = buildIcon(iconNode);
      if (rowIcon) {
        row.append(rowIcon);
      }

      return row;
    };

    const currentRow = buildRow({
      labelNode: label,
      iconNode: icon,
      className: 'roll-fill-button__row roll-fill-button__row--current',
      isHidden: false,
    });
    const nextRow = buildRow({
      labelNode: null,
      iconNode: null,
      className: 'roll-fill-button__row roll-fill-button__row--next',
      isHidden: true,
    });
    const sizingRow = buildRow({
      labelNode: null,
      iconNode: null,
      className: 'roll-fill-button__track',
      isHidden: true,
    });

    viewport.append(sizingRow, currentRow, nextRow);
    button.replaceChildren(fill, viewport);
    button.dataset.rollFillInitialized = 'true';

    let travelDistance = 0;
    let timeline;
    let currentTextColor = '';
    let targetTextColor = '';
    let textDuration = 0;
    let textDelay = 0;

    const getStyles = () => window.getComputedStyle(button);
    const getCssNumber = (styles, name, fallback) => {
      const value = Number.parseFloat(styles.getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    };
    const getCssValue = (styles, name, fallback) => {
      const value = styles.getPropertyValue(name).trim();
      return value || fallback;
    };
    const getGapValue = (styles) => {
      const gap = styles.columnGap || styles.gap;
      return gap && gap !== 'normal' ? gap : '0px';
    };
    const syncRowLayout = (styles) => {
      const justifyContent = styles.justifyContent || 'center';
      const alignItems = styles.alignItems || 'center';
      const gap = getGapValue(styles);
      [sizingRow, currentRow, nextRow].forEach((row) => {
        row.style.justifyContent = justifyContent;
        row.style.alignItems = alignItems;
        row.style.gap = gap;
      });
    };
    const getTextProgress = (time) => {
      if (textDuration <= 0) {
        return time >= textDelay ? 1 : 0;
      }

      return Math.max(0, Math.min(1, (time - textDelay) / textDuration));
    };
    const applyRowPositions = (time = 0) => {
      const textProgress = getTextProgress(time);
      gsap.set([currentRow, nextRow], {
        top: '50%',
        yPercent: -50,
      });
      gsap.set(currentRow, {
        y: -travelDistance * textProgress,
      });
      gsap.set(nextRow, {
        y: travelDistance * (1 - textProgress),
      });
    };
    const syncButtonMetrics = () => {
      const styles = getStyles();
      syncRowLayout(styles);
      currentTextColor = styles.color;
      targetTextColor = getCssValue(styles, '--roll-fill-foreground', styles.color);
      textDuration = getCssNumber(styles, '--roll-fill-text-duration', 0.5);
      textDelay = getCssNumber(styles, '--roll-fill-text-delay', 0.04);

      const viewportHeight = viewport.getBoundingClientRect().height;
      const rowHeight = currentRow.getBoundingClientRect().height;
      if (!viewportHeight || !rowHeight) {
        return;
      }

      const exitOffset = getCssNumber(styles, '--roll-fill-exit-offset', 4);
      travelDistance = viewportHeight / 2 + rowHeight / 2 + exitOffset;

      if (!timeline) {
        gsap.set([currentRow, nextRow], { color: currentTextColor });
        gsap.set(nextRow, { autoAlpha: 0 });
        applyRowPositions(0);
        return;
      }

      const currentTime = timeline.time();
      applyRowPositions(currentTime);
      timeline.invalidate();
      timeline.time(currentTime, false);
    };

    syncButtonMetrics();

    const styles = getStyles();
    const revealOrigin = getCssValue(styles, '--roll-fill-reveal-origin', '50% 120%');
    const revealEnd = getCssValue(styles, '--roll-fill-reveal-end', '160%');
    const fillDuration = getCssNumber(styles, '--roll-fill-duration', 0.65);

    gsap.set(fill, { clipPath: `circle(0% at ${revealOrigin})` });
    gsap.set([currentRow, nextRow], { color: currentTextColor });
    gsap.set(nextRow, { autoAlpha: 0 });
    applyRowPositions(0);

    timeline = gsap.timeline({
      paused: true,
      defaults: {
        ease: 'power3.inOut',
      },
    });

    timeline
      .to(fill, {
        clipPath: `circle(${revealEnd} at ${revealOrigin})`,
        duration: fillDuration,
      }, 0)
      .to(currentRow, {
        y: () => -travelDistance,
        duration: textDuration,
      }, textDelay)
      .to(nextRow, {
        y: 0,
        duration: textDuration,
      }, textDelay)
      .to([currentRow, nextRow], {
        color: () => targetTextColor,
        duration: textDuration,
      }, textDelay);

    timeline.eventCallback('onReverseComplete', () => {
      gsap.set(nextRow, { autoAlpha: 0 });
      applyRowPositions(0);
    });

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        syncButtonMetrics();
      });
      resizeObserver.observe(button);
    } else {
      registerRollFillResizeFallback(syncButtonMetrics);
    }

    const hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
    let isHovered = false;
    let isFocused = false;
    const syncState = () => {
      if (isHovered || isFocused) {
        gsap.set(nextRow, { autoAlpha: 1 });
        timeline.play();
        return;
      }

      timeline.reverse();
    };

    if (hoverMedia.matches) {
      button.addEventListener('pointerenter', () => {
        isHovered = true;
        syncState();
      });

      button.addEventListener('pointerleave', () => {
        isHovered = false;
        syncState();
      });
    }

    button.addEventListener('focusin', () => {
      isFocused = true;
      syncState();
    });

    button.addEventListener('focusout', (event) => {
      if (event.relatedTarget instanceof Node && button.contains(event.relatedTarget)) {
        return;
      }

      isFocused = false;
      syncState();
    });
  };

  const initRollFillButtons = (gsap) => {
    document
      .querySelectorAll('[data-roll-fill-button]')
      .forEach((button) => {
        initRollFillButton(button, gsap);
      });
  };

  const rotatorInstances = new WeakMap();

  const buildBackgroundImageValue = (url) => {
    if (!url) return '';
    return `url("${String(url).replace(/"/g, '\\"')}")`;
  };

  const clearAnimatedProps = (gsap, element) => {
    if (!element) return;
    gsap.set(element, {
      clearProps: 'y,opacity,visibility,filter,willChange',
    });
  };

  const clearButtonAnimatedProps = (gsap, element) => {
    if (!element) return;
    gsap.set(element, {
      clearProps: 'transform,opacity,visibility,filter,willChange',
    });
  };

  const setStackedState = (gsap, state, isActive) => {
    clearAnimatedProps(gsap, state.element);
    state.items.forEach((item) => {
      clearAnimatedProps(gsap, item);
    });

    if (isActive) {
      state.element.removeAttribute('aria-hidden');
      gsap.set(state.element, { autoAlpha: 1 });
      return;
    }

    state.element.setAttribute('aria-hidden', 'true');
    gsap.set(state.element, { autoAlpha: 0 });
  };

  const createTextSetTransition = ({
    gsap,
    settings,
    activeState,
    nextState,
    timeline,
    prefersReducedMotion,
  }) => {
    if (prefersReducedMotion) {
      gsap.set(nextState.element, {
        autoAlpha: 0,
        willChange: 'opacity',
      });
      gsap.set(activeState.element, {
        willChange: 'opacity',
      });

      timeline
        .to(activeState.element, {
          autoAlpha: 0,
          duration: settings.reducedFadeDuration,
          ease: 'none',
        }, 0)
        .to(nextState.element, {
          autoAlpha: 1,
          duration: settings.reducedFadeDuration,
          ease: 'none',
        }, 0);

      return;
    }

    const nextItemBlur = Math.max(settings.blurAmount - 2, 2);

    gsap.set(activeState.element, {
      willChange: 'transform,opacity,filter',
    });
    gsap.set(nextState.element, {
      autoAlpha: 1,
    });
    gsap.set(nextState.items, {
      y: settings.yOffset,
      autoAlpha: 0,
      filter: `blur(${nextItemBlur}px)`,
      willChange: 'transform,opacity,filter',
    });

    timeline
      .to(activeState.element, {
        y: -settings.yOffset,
        autoAlpha: 0,
        filter: `blur(${settings.blurAmount}px)`,
        duration: settings.exitDuration,
        ease: 'power2.inOut',
      }, 0)
      .to(nextState.items, {
        y: 0,
        autoAlpha: 1,
        filter: 'blur(0px)',
        duration: settings.itemDuration,
        stagger: settings.itemStagger,
        ease: 'power3.out',
      }, settings.enterDelay + 0.06);
  };

  const initAutoRotator = (root, gsap, config) => {
    rotatorInstances.get(root)?.destroy();

    const states = config.getStates(root);
    if (!states.length) return;

    const settings = {
      cycleDelay: 5000,
      reducedFadeDuration: 0.18,
      intersectionThreshold: 0.35,
      ...config.settings,
    };

    let activeIndex = config.getActiveIndex?.(states) ?? states.findIndex((state) => state.element.getAttribute('aria-hidden') !== 'true');
    let rotationTimer = 0;
    let isHovered = false;
    let isIntersecting = !('IntersectionObserver' in window);
    let isAnimating = false;
    let activeTimeline = null;
    let intersectionObserver;

    if (activeIndex < 0) activeIndex = 0;

    const clearRotationTimer = () => {
      if (!rotationTimer) return;
      window.clearTimeout(rotationTimer);
      rotationTimer = 0;
    };

    const shouldAutoRotate = () => states.length > 1
      && !isAnimating
      && !isHovered
      && isIntersecting
      && document.visibilityState === 'visible';

    const scheduleNextRotation = () => {
      clearRotationTimer();
      if (!shouldAutoRotate()) return;

      rotationTimer = window.setTimeout(() => {
        rotationTimer = 0;
        rotateToNextState();
      }, settings.cycleDelay);
    };

    const syncStates = () => {
      config.syncStates({
        root,
        states,
        activeIndex,
        gsap,
        settings,
      });
    };

    const finalizeRotation = (nextIndex) => {
      activeIndex = nextIndex;
      syncStates();
      isAnimating = false;
      activeTimeline = null;
      scheduleNextRotation();
    };

    const finishTransitionImmediately = () => {
      if (!activeTimeline) return;
      activeTimeline.progress(1);
    };

    const rotateToNextState = () => {
      if (!shouldAutoRotate()) return;

      const nextIndex = (activeIndex + 1) % states.length;
      if (nextIndex === activeIndex) {
        scheduleNextRotation();
        return;
      }

      clearRotationTimer();
      isAnimating = true;

      const activeState = states[activeIndex];
      const nextState = states[nextIndex];

      activeTimeline = config.createTransition({
        root,
        states,
        activeIndex,
        nextIndex,
        activeState,
        nextState,
        gsap,
        settings,
        prefersReducedMotion: prefersReducedMotionQuery.matches,
        onComplete: () => {
          finalizeRotation(nextIndex);
        },
      });

      if (!activeTimeline) {
        finalizeRotation(nextIndex);
      }
    };

    const syncRotationAvailability = () => {
      clearRotationTimer();

      if (document.visibilityState !== 'visible' || !isIntersecting) {
        finishTransitionImmediately();
      }

      scheduleNextRotation();
    };

    const handleVisibilityChange = () => {
      syncRotationAvailability();
    };

    const handlePointerEnter = () => {
      isHovered = true;
      clearRotationTimer();
    };

    const handlePointerLeave = () => {
      isHovered = false;
      scheduleNextRotation();
    };

    const handleReducedMotionChange = () => {
      clearRotationTimer();
      finishTransitionImmediately();
      scheduleNextRotation();
    };

    syncStates();
    config.onInit?.({
      root,
      states,
      activeIndex,
      gsap,
      settings,
    });

    const intersectionTarget = config.getIntersectionTarget?.(root) ?? root;
    const hoverTarget = config.getHoverTarget?.(root) ?? root;

    if ('IntersectionObserver' in window && intersectionTarget) {
      intersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries.find((observerEntry) => observerEntry.target === intersectionTarget);
        if (!entry) return;

        isIntersecting = entry.isIntersecting;
        syncRotationAvailability();
      }, {
        threshold: settings.intersectionThreshold,
      });
      intersectionObserver.observe(intersectionTarget);
    }

    hoverTarget?.addEventListener('pointerenter', handlePointerEnter);
    hoverTarget?.addEventListener('pointerleave', handlePointerLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    prefersReducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    if (!intersectionObserver) {
      scheduleNextRotation();
    }

    const destroy = () => {
      clearRotationTimer();
      isIntersecting = false;
      finishTransitionImmediately();
      clearRotationTimer();
      activeTimeline?.kill();
      activeTimeline = null;
      isAnimating = false;

      intersectionObserver?.disconnect();

      hoverTarget?.removeEventListener('pointerenter', handlePointerEnter);
      hoverTarget?.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      prefersReducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      config.onDestroy?.({ root, states, gsap });
      rotatorInstances.delete(root);
    };

    rotatorInstances.set(root, { destroy });
  };

  const initHeroFactsRotator = (card, gsap) => {
    initAutoRotator(card, gsap, {
      settings: {
        yOffset: 22,
        blurAmount: 10,
        exitDuration: 0.34,
        enterDelay: 0.24,
        itemDuration: 0.42,
        itemStagger: 0.08,
      },
      getStates: () => {
        const viewport = card.querySelector('[data-hero-facts-viewport]');
        return Array.from(viewport?.querySelectorAll(':scope > [data-hero-facts-set]') ?? []).map((element) => ({
          element,
          items: Array.from(element.children),
        }));
      },
      syncStates: ({ states, activeIndex, gsap: activeGsap }) => {
        states.forEach((state, index) => {
          setStackedState(activeGsap, state, index === activeIndex);
        });
      },
      createTransition: ({
        gsap: activeGsap,
        settings,
        activeState,
        nextState,
        prefersReducedMotion,
        onComplete,
      }) => {
        activeState.element.removeAttribute('aria-hidden');
        nextState.element.setAttribute('aria-hidden', 'true');
        setStackedState(activeGsap, activeState, true);
        setStackedState(activeGsap, nextState, false);

        const timeline = activeGsap.timeline({
          defaults: {
            ease: prefersReducedMotion ? 'none' : 'power2.out',
          },
          onComplete,
        });

        createTextSetTransition({
          gsap: activeGsap,
          settings,
          activeState,
          nextState,
          timeline,
          prefersReducedMotion,
        });

        return timeline;
      },
    });
  };

  const initTurnkeyRotator = (section, gsap) => {
    const media = section.querySelector('[data-turnkey-rotator-media]');
    const mediaLayers = Array.from(section.querySelectorAll('[data-turnkey-rotator-media-layer]'));

    if (!media || mediaLayers.length < 2) return;

    let visibleLayerIndex = 0;

    const applyLayerState = (layer, { image, isVisible, clearProps: clearLayerProps = false }) => {
      if (image) {
        layer.style.backgroundImage = buildBackgroundImageValue(image);
      }

      if (clearLayerProps) {
        clearAnimatedProps(gsap, layer);
      }

      layer.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
      gsap.set(layer, { autoAlpha: isVisible ? 1 : 0 });
    };

    initAutoRotator(section, gsap, {
      settings: {
        yOffset: 22,
        blurAmount: 10,
        exitDuration: 0.34,
        enterDelay: 0.24,
        itemDuration: 0.42,
        itemStagger: 0.08,
        mediaFadeDuration: 0.5,
      },
      getHoverTarget: () => section.querySelector('[data-turnkey-rotator-hover]'),
      getIntersectionTarget: () => section,
      getStates: () => {
        const viewport = section.querySelector('[data-turnkey-rotator-viewport]');
        return Array.from(viewport?.querySelectorAll(':scope > [data-turnkey-rotator-set]') ?? []).map((element) => ({
          element,
          items: Array.from(element.children),
          image: element.dataset.rotatorBgImage ?? '',
        }));
      },
      syncStates: ({ root, states, activeIndex, gsap: activeGsap }) => {
        states.forEach((state, index) => {
          setStackedState(activeGsap, state, index === activeIndex);
        });

        visibleLayerIndex = visibleLayerIndex % mediaLayers.length;
        mediaLayers.forEach((layer, index) => {
          applyLayerState(layer, {
            image: index === visibleLayerIndex ? states[activeIndex].image : '',
            isVisible: index === visibleLayerIndex,
            clearProps: true,
          });
        });

        root.setAttribute('data-turnkey-rotator-ready', 'true');
        media.style.backgroundImage = 'none';
      },
      createTransition: ({
        gsap: activeGsap,
        settings,
        activeState,
        nextState,
        prefersReducedMotion,
        onComplete,
      }) => {
        activeState.element.removeAttribute('aria-hidden');
        nextState.element.setAttribute('aria-hidden', 'true');
        setStackedState(activeGsap, activeState, true);
        setStackedState(activeGsap, nextState, false);

        const incomingLayerIndex = (visibleLayerIndex + 1) % mediaLayers.length;
        const activeLayer = mediaLayers[visibleLayerIndex];
        const nextLayer = mediaLayers[incomingLayerIndex];

        applyLayerState(nextLayer, {
          image: nextState.image,
          isVisible: false,
          clearProps: true,
        });
        activeGsap.set(activeLayer, {
          willChange: 'opacity',
        });
        activeGsap.set(nextLayer, {
          willChange: 'opacity',
        });

        const timeline = activeGsap.timeline({
          defaults: {
            ease: prefersReducedMotion ? 'none' : 'power2.out',
          },
          onComplete: () => {
            visibleLayerIndex = incomingLayerIndex;
            onComplete();
          },
        });

        createTextSetTransition({
          gsap: activeGsap,
          settings,
          activeState,
          nextState,
          timeline,
          prefersReducedMotion,
        });

        timeline
          .to(activeLayer, {
            autoAlpha: 0,
            duration: prefersReducedMotion ? settings.reducedFadeDuration : settings.mediaFadeDuration,
            ease: prefersReducedMotion ? 'none' : 'power2.inOut',
          }, 0)
          .to(nextLayer, {
            autoAlpha: 1,
            duration: prefersReducedMotion ? settings.reducedFadeDuration : settings.mediaFadeDuration,
            ease: prefersReducedMotion ? 'none' : 'power2.inOut',
          }, 0);

        return timeline;
      },
      onDestroy: ({ root, gsap: activeGsap }) => {
        root.removeAttribute('data-turnkey-rotator-ready');
        media.style.backgroundImage = '';
        mediaLayers.forEach((layer) => {
          clearAnimatedProps(activeGsap, layer);
          layer.style.backgroundImage = '';
          layer.setAttribute('aria-hidden', 'true');
        });
      },
    });
  };

  const initHeroFactsRotators = (gsap) => {
    document
      .querySelectorAll('[data-hero-facts-rotator]')
      .forEach((card) => {
        initHeroFactsRotator(card, gsap);
      });
  };

  const initTurnkeyRotators = (gsap) => {
    document
      .querySelectorAll('[data-turnkey-rotator]')
      .forEach((section) => {
        initTurnkeyRotator(section, gsap);
      });
  };

  // Recompute ScrollTrigger measurements after the final page and font metrics settle.
  const refreshScrollTriggers = () => {
    window.ScrollTrigger?.refresh();
  };

  const SECTION_CARD_SELECTOR = [
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
    '.directions__content > a',
    '.line-list li',
  ].join(',');

  const getSectionContentRoot = (section) => (
    section.querySelector(':scope > .shell, :scope > .image-cta__inner, :scope > .team__inner')
  );

  const initSectionButtonReveal = (section, gsap) => {
    section.querySelectorAll('.button:not([data-roll-fill-button])').forEach((button) => {
      const finalizeButtonReveal = () => {
        clearButtonAnimatedProps(gsap, button);
      };

      gsap.fromTo(button, {
        autoAlpha: 0,
        y: 28,
        willChange: 'transform, opacity',
      }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.62,
        ease: 'power3.out',
        immediateRender: false,
        overwrite: 'auto',
        onComplete: finalizeButtonReveal,
        onInterrupt: finalizeButtonReveal,
        scrollTrigger: {
          trigger: button,
          start: 'top 88%',
          once: true,
        },
      });
    });
  };

  const initContentSectionScroll = (gsap) => {
    const mobileMedia = gsap.matchMedia();
    mobileMedia.add('(max-width: 767px)', () => () => {});

    mobileMedia.add('(min-width: 768px)', () => {
    gsap.utils.toArray('main > section.section').forEach((section) => {
      const isProcessSection = section.classList.contains('process');
      const contentRoot = getSectionContentRoot(section);
      const eyebrow = section.querySelector('.section-head .eyebrow, .production__content > .eyebrow, .expert__content > .eyebrow, .directions__side > .eyebrow, .faq__side > .eyebrow, .request__side > .eyebrow');
      const headline = section.querySelector('.section-head h2, .section-intro h2, .production__content h2, .expert__content h2, .directions__side h2, .faq__content h2, .request__side h2');
      const intro = section.querySelector('.section-intro > p, .production__content > p:not(.eyebrow), .expert__content > p:not(.eyebrow), .directions__content > p, .faq__content > p, .request__content > p');
      const cards = section.querySelectorAll(SECTION_CARD_SELECTOR);
      const requestForm = section.querySelector('.request-form');
      const containedMedia = section.querySelector('.production__media, .expert__media, .directions__media');

      if (contentRoot && !isProcessSection) {
        gsap.fromTo(contentRoot, {
          y: 56,
        }, {
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top 58%',
            scrub: 0.85,
          },
        });
      }

      const revealTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          once: true,
        },
      });

      if (eyebrow) {
        revealTimeline.from(eyebrow, {
          x: -32,
          autoAlpha: 0,
          clipPath: 'inset(0 100% 0 0)',
          duration: 0.68,
          ease: 'power3.out',
          clearProps: 'clipPath',
        }, 0);
      }

      if (headline) {
        revealTimeline.from(headline, {
          y: 48,
          autoAlpha: 0,
          clipPath: 'inset(100% 0 0 0)',
          duration: 0.82,
          ease: 'power3.out',
          clearProps: 'clipPath',
        }, eyebrow ? 0.1 : 0);
      }

      if (intro) {
        revealTimeline.from(intro, {
          y: 28,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power2.out',
        }, headline ? 0.18 : 0.08);
      }

      if (cards.length) {
        revealTimeline.from(cards, {
          y: 56,
          autoAlpha: 0,
          scale: 0.96,
          duration: 0.74,
          stagger: 0.06,
          ease: 'power3.out',
        }, headline ? 0.24 : 0.12);
      }

      if (requestForm) {
        revealTimeline.from(requestForm, {
          y: 40,
          autoAlpha: 0,
          scale: 0.98,
          duration: 0.72,
          ease: 'power3.out',
        }, 0.28);
      }

      if (containedMedia) {
        gsap.fromTo(containedMedia, {
          scale: 0.94,
          clipPath: 'inset(14% 10% 14% 10% round 40px)',
        }, {
          scale: 1,
          clipPath: 'inset(0% 0% 0% 0% round 40px)',
          duration: 1,
          ease: 'power3.inOut',
          clearProps: 'clipPath',
          scrollTrigger: {
            trigger: containedMedia,
            start: 'top 82%',
            once: true,
          },
        });

        gsap.fromTo(containedMedia, {
          y: -18,
        }, {
          y: 18,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      initSectionButtonReveal(section, gsap);
    });
    });
  };

  const initImageCtaScroll = (gsap) => {
    const mobileMedia = gsap.matchMedia();
    mobileMedia.add('(max-width: 767px)', () => () => {});

    mobileMedia.add('(min-width: 768px)', () => {
    gsap.utils.toArray('.hero, .image-cta').forEach((section) => {
      const media = section.querySelector('.hero__media, .image-cta__media');
      const content = section.querySelectorAll([
        '.hero__copy > *',
        '.hero__facts',
        '.image-cta__copy > *',
        '.image-cta__note',
        '.team__stats',
        '.team__copy > *',
        '.team__quote',
      ].join(','));

      if (!media) return;

      const isHero = section.classList.contains('hero');

      gsap.fromTo(media, {
        backgroundPosition: '50% 40%',
      }, {
        backgroundPosition: '50% 60%',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      if (!isHero) {
        gsap.fromTo(media, {
          scale: 1.18,
          autoAlpha: 0.4,
          clipPath: 'inset(100% 0 0 0)',
        }, {
          scale: 1,
          autoAlpha: 1,
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.15,
          ease: 'power3.inOut',
          clearProps: 'clipPath,opacity,visibility,transform',
          scrollTrigger: {
            trigger: section,
            start: 'top 88%',
            once: true,
          },
        });
      }

      const contentRoot = getSectionContentRoot(section);
      if (contentRoot && !isHero) {
        gsap.fromTo(contentRoot, {
          y: 72,
        }, {
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top 52%',
            scrub: 0.9,
          },
        });
      }

      if (content.length && !isHero) {
        gsap.from(content, {
          y: 42,
          autoAlpha: 0,
          duration: 0.88,
          stagger: 0.09,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 72%',
            once: true,
          },
        });
      }

      initSectionButtonReveal(section, gsap);
    });
    });
  };

  const initGsap = () => {
    if (!window.gsap) {
      document.documentElement.dataset.gsap = 'missing';
      return;
    }

    const { gsap } = window;
    initHeroFactsRotators(gsap);
    initTurnkeyRotators(gsap);

    if (prefersReducedMotion) {
      document.documentElement.dataset.gsap = 'reduced-motion';
      return;
    }

    document.documentElement.dataset.gsap = 'ready';
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    initRollFillButtons(gsap);
    initProcessScroll(gsap, window.ScrollTrigger);

    const heroIntroMedia = gsap.matchMedia();
    heroIntroMedia.add('(min-width: 768px)', () => {
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

      return () => {};
    });

    if (window.ScrollTrigger) {
      initContentSectionScroll(gsap);
      initImageCtaScroll(gsap);
    }

    document.querySelectorAll('.button:not([data-roll-fill-button])').forEach((button) => {
      button.addEventListener('mouseenter', () => {
        gsap.to(button, {
          scale: 1.015,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      });
      button.addEventListener('mouseleave', () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: 'auto',
          onComplete: () => {
            gsap.set(button, { clearProps: 'transform' });
          },
        });
      });
    });
  };

  const refreshScrollTriggersAfterFonts = () => {
    refreshScrollTriggers();
    queueProjectPaginationRebuild();
    if (typeof updateNavTheme === 'function') updateNavTheme();
  };

  window.addEventListener('load', refreshScrollTriggers, { once: true });
  document.fonts?.ready?.then(refreshScrollTriggersAfterFonts);
  initGsap();
  document.documentElement.dataset.interactive = 'ready';
})();
