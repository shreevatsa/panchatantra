(function () {
  if (typeof document === 'undefined') {
    return;
  }

  var root = document.documentElement;
  var slider = document.getElementById('dividerRange');
  var sliderLabel = document.getElementById('dividerValue');

  if (!slider) {
    return;
  }

  var updateSlider = function () {
    var value = slider.value;
    root.style.setProperty('--left-col', value);
    if (sliderLabel) {
      sliderLabel.textContent = value + '%';
    }
  };

  var initial = parseFloat(getComputedStyle(root).getPropertyValue('--left-col'));
  if (!isNaN(initial)) {
    slider.value = initial;
    if (sliderLabel) {
      sliderLabel.textContent = initial + '%';
    }
  }

  slider.addEventListener('input', updateSlider);
  updateSlider();
})();
