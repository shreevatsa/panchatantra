(function () {
  if (typeof document === 'undefined') {
    return;
  }

  var main = document.querySelector('main');
  if (!main || main.dataset.pairsInitialized === 'true') {
    return;
  }

  var markers = Array.from(main.querySelectorAll('span.pagenum'));
  if (!markers.length) {
    return;
  }

  main.dataset.pairsInitialized = 'true';
  main.classList.add('pairs-layout');

  var existingControls = main.querySelector('.controls');
  if (!existingControls) {
    existingControls = document.createElement('div');
    existingControls.className = 'controls';
    existingControls.innerHTML = [
      '<label>',
      '  <span>image width</span>',
      '  <input id="dividerRange" type="range" min="10" max="90" value="50">',
      '  <span id="dividerValue">50%</span>',
      '</label>'
    ].join('');
    main.insertBefore(existingControls, main.firstChild);
  }

  var root = document.documentElement;
  var slider = document.getElementById('dividerRange') || existingControls.querySelector('#dividerRange');
  var sliderLabel = document.getElementById('dividerValue') || existingControls.querySelector('#dividerValue');

  var updateSlider = function () {
    if (!slider || !sliderLabel) {
      return;
    }
    var value = slider.value;
    root.style.setProperty('--left-col', value);
    sliderLabel.textContent = value + '%';
  };

  if (slider && sliderLabel) {
    var initial = parseFloat(getComputedStyle(root).getPropertyValue('--left-col'));
    if (!isNaN(initial)) {
      slider.value = initial;
    }
    slider.addEventListener('input', updateSlider);
    updateSlider();
  }

  markers.forEach(function (marker, index) {
    var nextMarker = markers[index + 1] || null;

    var range = document.createRange();
    range.setStartBefore(marker);
    if (nextMarker) {
      range.setEndBefore(nextMarker);
    } else {
      var endNode = main.lastChild;
      while (endNode && endNode.nodeType === Node.TEXT_NODE && !endNode.textContent.trim()) {
        endNode = endNode.previousSibling;
      }
      if (!endNode) {
        endNode = marker;
      }
      range.setEndAfter(endNode);
    }

    var fragment = range.extractContents();
    var span = fragment.querySelector('span.pagenum');

    var pair = document.createElement('section');
    pair.className = 'pair';
    var left = document.createElement('div');
    left.className = 'pair-left';
    var right = document.createElement('div');
    right.className = 'pair-right';
    pair.appendChild(left);
    pair.appendChild(right);

    if (span) {
      var images = Array.from(span.querySelectorAll('img'));
      var link = span.querySelector('a');
      var appendedImage = false;

      var ensureLinkAttrs = function (anchor, fallbackSrc) {
        anchor.classList.add('scan-link');
        if (!anchor.getAttribute('href') && fallbackSrc) {
          anchor.setAttribute('href', fallbackSrc);
        }
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener');
        if (!anchor.getAttribute('aria-label')) {
          anchor.setAttribute('aria-label', 'Open full-page scan');
        }
        if (anchor.hasAttribute('title')) {
          anchor.removeAttribute('title');
        }
      };

      var registerScanImage = function (img, container) {
        if (!img || !container) {
          return;
        }

        container.classList.add('scan-image');

        var frac = img.style.getPropertyValue('--frac');
        if (frac) {
          container.style.setProperty('--frac', frac.trim());
        }
      };

      if (images.length === 1) {
        var img = images[0];
        var src = img.getAttribute('src');
        if (link) {
          ensureLinkAttrs(link, src);
          link.textContent = '';
          link.appendChild(img);
          left.appendChild(link);
          registerScanImage(img, link);
        } else {
          var wrapper = document.createElement('a');
          wrapper.appendChild(img);
          ensureLinkAttrs(wrapper, src);
          registerScanImage(img, wrapper);
          left.appendChild(wrapper);
        }
        appendedImage = true;
      } else if (images.length > 1) {
        images.forEach(function (img) {
          left.appendChild(img);
        });
        if (link) {
          ensureLinkAttrs(link, link.getAttribute('href'));
          if (!link.textContent.trim()) {
            link.textContent = 'Open full-page scan';
          }
          left.insertBefore(link, left.firstChild);
        }
        appendedImage = true;
      }

      if (!appendedImage && link) {
        ensureLinkAttrs(link, link.getAttribute('href'));
        left.appendChild(link);
      }

      if (!appendedImage && images.length) {
        images.forEach(function (img) {
          left.appendChild(img);
        });
      }

      span.remove();
    }

    Array.from(fragment.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
        return;
      }
      right.appendChild(node);
    });

    if (!right.childNodes.length) {
      right.appendChild(document.createElement('p'));
    }

    range.insertNode(pair);
    range.detach();
  });

  var hoverQuery = '(hover: hover) and (pointer: fine)';
  var mediaMatch = window.matchMedia ? window.matchMedia(hoverQuery) : null;

  var setupLoupe = function (img) {
    if (!img || img.dataset.loupeInitialized === 'true') {
      return;
    }

    var parent = img.parentElement;
    if (!parent) {
      return;
    }

    var wrapper = parent.classList.contains('loupe-wrapper') ? parent : null;
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'loupe-wrapper';
      parent.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    }

    img.dataset.loupeInitialized = 'true';

    var lens = document.createElement('div');
    lens.className = 'loupe-lens';
    wrapper.appendChild(lens);

    var zoom = 2.4;

    var updateBackgroundSize = function () {
      var rect = img.getBoundingClientRect();
      if (rect.width && rect.height) {
        lens.style.backgroundSize = (rect.width * zoom) + 'px ' + (rect.height * zoom) + 'px';
      }
    };

    var handleEnter = function () {
      wrapper.classList.add('is-active');
      lens.style.backgroundImage = 'url("' + (img.currentSrc || img.src || '') + '")';
      updateBackgroundSize();
    };

    var handleLeave = function () {
      wrapper.classList.remove('is-active');
      lens.style.transform = 'translate(-9999px, -9999px)';
    };

    var handleMove = function (event) {
      if (!wrapper.classList.contains('is-active')) {
        return;
      }

      var wrapperRect = wrapper.getBoundingClientRect();
      var rect = img.getBoundingClientRect();
      if (!wrapperRect.width || !wrapperRect.height || !rect.width || !rect.height) {
        return;
      }

      var lensWidth = lens.offsetWidth || 0;
      var lensHeight = lens.offsetHeight || 0;

      var visibleX = event.clientX - wrapperRect.left;
      var visibleY = event.clientY - wrapperRect.top;

      if (visibleX < 0) {
        visibleX = 0;
      } else if (visibleX > wrapperRect.width) {
        visibleX = wrapperRect.width;
      }

      if (visibleY < 0) {
        visibleY = 0;
      } else if (visibleY > wrapperRect.height) {
        visibleY = wrapperRect.height;
      }

      var halfW = lensWidth / 2;
      var halfH = lensHeight / 2;
      lens.style.transform = 'translate(' + (visibleX - halfW) + 'px, ' + (visibleY - halfH) + 'px)';

      var actualX = event.clientX - rect.left;
      var actualY = event.clientY - rect.top;

      if (actualX < 0) {
        actualX = 0;
      } else if (actualX > rect.width) {
        actualX = rect.width;
      }

      if (actualY < 0) {
        actualY = 0;
      } else if (actualY > rect.height) {
        actualY = rect.height;
      }

      lens.style.backgroundPosition = (-(actualX * zoom - halfW)) + 'px ' + (-(actualY * zoom - halfH)) + 'px';
    };

    wrapper.addEventListener('mouseenter', handleEnter);
    wrapper.addEventListener('mouseleave', handleLeave);
    wrapper.addEventListener('mousemove', handleMove);

    if (!img.complete) {
      img.addEventListener('load', updateBackgroundSize, { once: true });
    } else {
      updateBackgroundSize();
    }

    img._loupeData = {
      update: updateBackgroundSize
    };
  };

  var initializeLoupes = function () {
    var images = main.querySelectorAll('.pair-left img');
    if (!images.length) {
      return;
    }
    images.forEach(setupLoupe);
  };

  var activateLoupesIfNeeded = function () {
    if (mediaMatch && !mediaMatch.matches) {
      return;
    }
    initializeLoupes();
  };

  activateLoupesIfNeeded();

  if (mediaMatch && typeof mediaMatch.addEventListener === 'function') {
    mediaMatch.addEventListener('change', function (event) {
      if (event.matches) {
        activateLoupesIfNeeded();
      }
    });
  } else if (mediaMatch && typeof mediaMatch.addListener === 'function') {
    mediaMatch.addListener(function (event) {
      if (event.matches) {
        activateLoupesIfNeeded();
      }
    });
  }

  window.addEventListener('resize', function () {
    var images = main.querySelectorAll('.pair-left img');
    images.forEach(function (img) {
      if (img._loupeData && typeof img._loupeData.update === 'function') {
        img._loupeData.update();
      }
    });
  });
})();
