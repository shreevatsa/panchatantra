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
      '  <span>Divider position (original column width)</span>',
      '  <input id="dividerRange" type="range" min="18" max="90" value="30">',
      '  <span id="dividerValue">30%</span>',
      '</label>',
      '<div style="font-size:0.8rem; max-width:260px; color:#555;">',
      '  Adjust the slider, then use your browser\'s zoom to fine-tune how big the scans vs. translation appear.',
      '</div>'
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
        if (!anchor.getAttribute('title')) {
          anchor.setAttribute('title', 'Open full-page scan');
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
        } else {
          var wrapper = document.createElement('a');
          wrapper.appendChild(img);
          ensureLinkAttrs(wrapper, src);
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
})();
