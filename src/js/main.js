document.addEventListener('DOMContentLoaded', function () {
    
    'use strict';
    
    //= third_party/jquery-3.2.0.min.js
    //= third_party/slick.min.js
    //= third_party/jquery.validate.min.js
  
  
//  Detect iOS device
  
  var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
  var body = $('body');
  
  function detectIOS() {
    if (iOS) {
      body.addClass('ios');
    } else {
      return;
    }
  };
  
  detectIOS();
  
//    Sliders
  
    $('.top_section__slider').slick({
      dots: false,
      arrows: false,
      responsive: [
        {
          breakpoint: 761,
          settings: {
            dots: true,
            appendDots: $('.top-section .dots_container'),
            dotsClass: 'dots'
          }
        }
      ]
    });
  
    $('.simple_section_slider').slick({
      dots: false,
      arrows: true,
      appendArrows: $('.simple .arrows'),
      prevArrow: '<div class="slick-prev slick-button"></div>',
      nextArrow: '<div class="slick-next slick-button"></div>',
      responsive: [
        {
          breakpoint: 760,
          settings: {
            arrows: false,
          }
        }
      ]
    });
  
    $('.simple_section_slider').on('afterChange', function(slick, currentSlide) {
      var index = currentSlide.currentSlide;
      selectItem(simpleOptions[index]);
    });
  
    $('.standard_section_slider').on('afterChange', function(slick, currentSlide) {
      var index = currentSlide.currentSlide;
      selectItem(standardOptions[index]);
    });
  
    $('.standard_section_slider').slick({
      dots: false,
      arrows: true,
      appendArrows: $('.standard .arrows'),
      prevArrow: '<div class="slick-prev slick-button"></div>',
      nextArrow: '<div class="slick-next slick-button"></div>',
      responsive: [
        {
          breakpoint: 760,
          settings: {
            arrows: false,
          }
        }
      ]
    });
  
//    Form validation
  
    $('#contactForm').validate({
      rules: {
        'email': {
          required: true,
          email: true
        },
        'name': {
          required: true,
          minlength: 3
        }
      }
    });
  
//    Custom selectors
  
  var customSelectors = $('.pseudo_selector__head');
  var customSelectorOptions = $('.pseudo_selector__body .item');
  var simpleOptions = $('.simple .pseudo_selector__body .item');
  var standardOptions = $('.standard .pseudo_selector__body .item');
  
  function makeActive(selector) {
    $(selector).addClass('active');
    setTimeout(function() {
      $(body).on('click', function() {
          makeNotActive(selector);
      });
    }, 10);
  };
  
  function makeNotActive(selector) {
    $(selector).removeClass('active');
    $(body).off('click');
  };
  
  function selectItem(option) {
    var selectorsPlaceholder = $(option).parent('.pseudo_selector__body').siblings('.pseudo_selector__head').find('p');
    var siblingsSelectors = $(option).parent('.pseudo_selector__body').find('.item');
    var currentIndex;
    var slider = $(option).parents('.pseudo_selector_container').siblings('.battery_slider');
    if (slider.length == 0) {
      slider = $(option).parents('.pseudo_selector_container').siblings('.slider_container_with_arrows').find('.battery_slider');
    }
    siblingsSelectors.each(function(index, item) {
      $(item).removeClass('selected');
      if (item == option) {
        currentIndex = index;
      }
    });
    var textValue = $(option).html();
    $(option).addClass('selected');
    selectorsPlaceholder.html(textValue);
    slider.slick('slickGoTo', currentIndex);
  };
  
  customSelectors.each(function(index, item) {
    $(item).on('click', function() {
      makeActive(item);
    })
  });
  
  customSelectorOptions.each(function(index, item) {
    $(item).on('click', function() {
      selectItem(item);
    })
  });
  
  
//  Textarea logic
  
  var textarea = $('#contactForm textarea');
  
  textarea.on('focus', function() {
    textarea.attr('rows', '6');
    textarea.addClass('selected');
  });
  
  textarea.on('blur', function() {
    if (!textarea.val()) {
      textarea.attr('rows', '1');
      textarea.removeClass('selected');
    };
  });
  
//  Send mail
  
  var submitButton = $('#submitButton');
  
  submitButton.on('click', function(e) {
    e.preventDefault();
    var contactForm = $('#contactForm');
    if (contactForm.valid()) {
      var datas = 'name=' + contactForm[0][0].value + '&email=' + contactForm[0][1].value + '&message=' + contactForm[0][2].value;
      var xmlRequest = new XMLHttpRequest();
      xmlRequest.open('POST', 'send.php', true);
      xmlRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xmlRequest.send(datas);

      xmlRequest.onreadystatechange = function() {
        if (xmlRequest.readyState != 4) return;

        if (xmlRequest.status != 200) {
          alert("Form has not been sent. Please check all the input fields and try again! " + xmlRequest.status + ': ' + xmlRequest.statusText);
        } else {
            alert("Thank you. Your request has been successfully sent. We'll contact you as soon as possible.");
            contactForm[0][0].value = '';
            contactForm[0][1].value = '';
            contactForm[0][2].value = '';
        }
      };
    }
  })
  
});