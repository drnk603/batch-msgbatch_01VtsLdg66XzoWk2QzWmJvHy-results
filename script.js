/**
 * ============================================================================
 * UNIVERSAL WEBSITE ANIMATIONS & INTERACTIONS
 * Современный JS с плавными анимациями для всех страниц
 * ============================================================================
 */

(function() {
  'use strict';

  // Проверка существования глобального объекта приложения
  if (!window.__app) {
    window.__app = {};
  }

  const app = window.__app;

  // Предотвращение повторной инициализации
  if (app.__initialized) {
    return;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Debounce функция для оптимизации событий
   */
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  /**
   * Throttle функция для ограничения частоты вызовов
   */
  const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  /**
   * Проверка видимости элемента в viewport
   */
  const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  /**
   * Анимация чисел (для счетчиков)
   */
  const animateNumber = (element, start, end, duration) => {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current);
    }, 16);
  };

  // ============================================================================
  // VALIDATION UTILITIES
  // ============================================================================

  /**
   * Валидаторы для различных типов полей
   */
  const validators = {
    email: (value) => {
      const re = /^[^s@]+@[^s@]+.[^s@]+$/;
      return {
        valid: re.test(value),
        message: 'Voer een geldig e-mailadres in (bijv. naam@voorbeeld.nl)'
      };
    },
    
    phone: (value) => {
      const re = /^[ds-+()]+$/;
      return {
        valid: value === '' || re.test(value),
        message: 'Voer een geldig telefoonnummer in (alleen cijfers en symbolen)'
      };
    },
    
    name: (value) => {
      return {
        valid: value.trim().length >= 2,
        message: 'Naam moet minimaal 2 tekens bevatten'
      };
    },
    
    required: (value) => {
      return {
        valid: value.trim() !== '',
        message: 'Dit veld is verplicht'
      };
    },
    
    consent: (checked) => {
      return {
        valid: checked,
        message: 'U moet akkoord gaan met de privacyverklaring'
      };
    }
  };

  /**
   * Валидация поля формы
   */
  const validateField = (field) => {
    const fieldType = field.type;
    const fieldId = field.id;
    const fieldValue = fieldType === 'checkbox' ? field.checked : field.value;
    const isRequired = field.hasAttribute('aria-required') || field.required;
    
    let validation = { valid: true, message: '' };
    
    // Проверка обязательности
    if (isRequired) {
      if (fieldType === 'checkbox') {
        validation = validators.consent(fieldValue);
      } else {
        validation = validators.required(fieldValue);
      }
      
      if (!validation.valid) {
        return validation;
      }
    }
    
    // Специфичная валидация по ID или типу
    if (fieldValue && fieldValue !== '') {
      if (fieldId.includes('email') || fieldType === 'email') {
        validation = validators.email(fieldValue);
      } else if (fieldId.includes('phone') || fieldId.includes('tel')) {
        validation = validators.phone(fieldValue);
      } else if (fieldId.includes('name') || fieldId.includes('Name')) {
        validation = validators.name(fieldValue);
      }
    }
    
    return validation;
  };

  /**
   * Отображение ошибки валидации
   */
  const showFieldError = (field, message) => {
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    
    let errorElement = field.parentElement.querySelector('.invalid-feedback, .c-form__error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = field.classList.contains('c-form__input') ? 'c-form__error' : 'invalid-feedback';
      field.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  };

  /**
   * Скрытие ошибки валидации
   */
  const hideFieldError = (field) => {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
    
    const errorElement = field.parentElement.querySelector('.invalid-feedback, .c-form__error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  };

  // ============================================================================
  // ANIMATION MODULES
  // ============================================================================

  /**
   * Инициализация AOS (Animate On Scroll)
   */
  const initAOS = () => {
    if (app.__aosInit) return;
    app.__aosInit = true;

    if (typeof AOS === 'undefined') {
      console.warn('AOS library not loaded');
      return;
    }

    // Проверка предпочтений пользователя по анимациям
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    AOS.init({
      once: true,
      duration: 800,
      easing: 'ease-out-cubic',
      offset: 100,
      mirror: false,
      disable: prefersReducedMotion,
      anchorPlacement: 'top-bottom'
    });

    app.refreshAOS = () => {
      try {
        if (typeof AOS !== 'undefined' && AOS.refresh) {
          AOS.refresh();
        }
      } catch (e) {
        console.error('AOS refresh error:', e);
      }
    };
  };

  /**
   * Плавное появление изображений при загрузке
   */
  const initImageAnimations = () => {
    if (app.__imagesAnimInit) return;
    app.__imagesAnimInit = true;

    const images = document.querySelectorAll('img:not([data-no-animate])');
    
    images.forEach((img, index) => {
      // Начальное состояние
      img.style.opacity = '0';
      img.style.transform = 'translateY(20px) scale(0.95)';
      img.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
      
      // Функция для анимации появления
      const animateImage = () => {
        img.style.opacity = '1';
        img.style.transform = 'translateY(0) scale(1)';
      };
      
      // Если изображение уже загружено
      if (img.complete) {
        setTimeout(animateImage, index * 100);
      } else {
        // Ждем загрузки изображения
        img.addEventListener('load', () => {
          setTimeout(animateImage, index * 100);
        });
      }
      
      // Обработка ошибок загрузки
      img.addEventListener('error', function() {
        if (this.hasAttribute('data-error-handled')) return;
        this.setAttribute('data-error-handled', 'true');
        
        const placeholderSVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e0e0e0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="18"%3EAfbeelding niet beschikbaar%3C/text%3E%3C/svg%3E';
        
        this.src = placeholderSVG;
        this.style.objectFit = 'contain';
        animateImage();
      });
    });
  };

  /**
   * Анимация карточек при наведении
   */
  const initCardAnimations = () => {
    if (app.__cardsAnimInit) return;
    app.__cardsAnimInit = true;

    const cards = document.querySelectorAll('.c-card, .c-service-card, .c-team-card, .c-blog-card, .c-case-card');
    
    cards.forEach(card => {
      card.style.transition = 'transform 0.3s ease-out, box-shadow 0.3s ease-out';
      
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
  };

  /**
   * Анимация кнопок при наведении и клике
   */
  const initButtonAnimations = () => {
    if (app.__buttonsAnimInit) return;
    app.__buttonsAnimInit = true;

    const buttons = document.querySelectorAll('.c-button, button[class*="c-button"]');
    
    buttons.forEach(button => {
      button.style.transition = 'all 0.25s ease-out';
      
      // Анимация при клике (ripple effect)
      button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          top: ${y}px;
          left: ${x}px;
          pointer-events: none;
          animation: ripple 0.6s ease-out;
        `;
        
        // Добавляем анимацию ripple, если её нет
        if (!document.getElementById('ripple-animation')) {
          const style = document.createElement('style');
          style.id = 'ripple-animation';
          style.textContent = `
            @keyframes ripple {
              to {
                transform: scale(2);
                opacity: 0;
              }
            }
          `;
          document.head.appendChild(style);
        }
        
        // Убедимся, что кнопка имеет position: relative
        const position = window.getComputedStyle(this).position;
        if (position === 'static') {
          this.style.position = 'relative';
        }
        this.style.overflow = 'hidden';
        
        this.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });
  };

  /**
   * Анимация счетчиков (статистика)
   */
  const initCounterAnimations = () => {
    if (app.__countersAnimInit) return;
    app.__countersAnimInit = true;

    const counters = document.querySelectorAll('.c-stat__number, .c-stat-card__number');
    
    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.hasAttribute('data-animated')) {
          entry.target.setAttribute('data-animated', 'true');
          
          const text = entry.target.textContent;
          const number = parseInt(text.replace(/D/g, ''), 10);
          
          if (!isNaN(number)) {
            entry.target.textContent = '0';
            animateNumber(entry.target, 0, number, 2000);
          }
        }
      });
    }, observerOptions);
    
    counters.forEach(counter => observer.observe(counter));
  };

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Мобильное меню (бургер)
   */
  const initBurgerMenu = () => {
    if (app.__burgerInit) return;
    app.__burgerInit = true;

    const nav = document.querySelector('.c-nav#main-nav, .l-header__nav');
    const toggle = document.querySelector('.c-nav__toggle');
    const navList = document.querySelector('.c-nav__list, .c-nav');
    const body = document.body;

    if (!toggle) return;

    let isOpen = false;

    // Добавляем плавные переходы
    if (navList) {
      navList.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
    }

    const closeMenu = () => {
      if (!isOpen) return;
      isOpen = false;
      
      if (nav) nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
      
      // Анимация иконки закрытия
      const icons = toggle.querySelectorAll('.c-nav__toggle-icon');
      icons.forEach((icon, index) => {
        icon.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        icon.style.transform = '';
        icon.style.opacity = '1';
      });
    };

    const openMenu = () => {
      if (isOpen) return;
      isOpen = true;
      
      if (nav) nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
      
      // Анимация иконки открытия (крестик)
      const icons = toggle.querySelectorAll('.c-nav__toggle-icon');
      if (icons.length >= 3) {
        icons[0].style.transform = 'translateY(7px) rotate(45deg)';
        icons[1].style.opacity = '0';
        icons[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      }
    };

    const toggleMenu = () => {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    };

    // События
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMenu();
    });

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        toggle.focus();
      }
    });

    // Закрытие при клике вне меню
    document.addEventListener('click', (e) => {
      if (isOpen && nav && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    // Закрытие при клике на ссылку
    if (navList) {
      const navLinks = navList.querySelectorAll('.c-nav__link, a');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 1024) {
            closeMenu();
          }
        });
      });
    }

    // Закрытие при изменении размера окна
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth >= 1024 && isOpen) {
        closeMenu();
      }
    }, 200));
  };

  /**
   * Активное состояние пунктов меню
   */
  const initActiveMenuState = () => {
    if (app.__activeMenuInit) return;
    app.__activeMenuInit = true;

    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.c-nav__link');

    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      if (!linkPath) return;

      let isActive = false;

      if (linkPath === '/' || linkPath === '/index.html') {
        if (currentPath === '/' || currentPath.endsWith('/index.html')) {
          isActive = true;
        }
      } else if (!linkPath.includes('#')) {
        if (currentPath === linkPath || currentPath.endsWith(linkPath)) {
          isActive = true;
        }
      }

      if (isActive) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active', 'active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('is-active', 'active');
      }
    });
  };

  /**
   * Плавный скролл к якорям
   */
  const initSmoothScroll = () => {
    if (app.__smoothScrollInit) return;
    app.__smoothScrollInit = true;

    const isHomepage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === '#' || href === '#!') return;

      // Для страниц, отличных от главной, добавляем путь к главной
      if (!isHomepage && href.indexOf('#') === 0) {
        link.setAttribute('href', '/' + href);
      }

      link.addEventListener('click', function(e) {
        const targetHref = this.getAttribute('href');
        const hash = targetHref.includes('#') ? targetHref.substring(targetHref.indexOf('#')) : null;

        if (!hash || hash === '#' || hash === '#!') return;

        const currentPath = window.location.pathname;
        const linkPath = targetHref.split('#')[0];
        const isSamePage = !linkPath || linkPath === currentPath || 
                          (linkPath === '/' && (currentPath === '/' || currentPath.endsWith('/index.html')));

        if (isSamePage) {
          const targetId = hash.substring(1);
          const targetElement = document.getElementById(targetId);

          if (targetElement) {
            e.preventDefault();

            const header = document.querySelector('.l-header');
            const headerHeight = header ? header.offsetHeight : 80;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });

            history.pushState(null, null, hash);

            // Фокус на целевом элементе для доступности
            targetElement.setAttribute('tabindex', '-1');
            targetElement.focus();
          }
        }
      });
    });

    // Обработка якоря при загрузке страницы
    if (window.location.hash) {
      setTimeout(() => {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
          const header = document.querySelector('.l-header');
          const headerHeight = header ? header.offsetHeight : 80;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  /**
   * Sticky header с эффектом появления
   */
  const initStickyHeader = () => {
    if (app.__stickyHeaderInit) return;
    app.__stickyHeaderInit = true;

    const header = document.querySelector('.l-header');
    if (!header) return;

    let lastScroll = 0;
    const headerHeight = header.offsetHeight;

    const handleScroll = throttle(() => {
      const currentScroll = window.pageYOffset;

      if (currentScroll <= headerHeight) {
        header.classList.remove('is-scrolled', 'is-hidden');
        return;
      }

      if (currentScroll > lastScroll && currentScroll > headerHeight) {
        // Скролл вниз - скрываем header
        header.classList.add('is-hidden');
      } else {
        // Скролл вверх - показываем header
        header.classList.remove('is-hidden');
      }

      if (currentScroll > headerHeight) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }

      lastScroll = currentScroll;
    }, 100);

    window.addEventListener('scroll', handleScroll);

    // Добавляем стили для анимации
    if (!document.getElementById('sticky-header-styles')) {
      const style = document.createElement('style');
      style.id = 'sticky-header-styles';
      style.textContent = `
        .l-header {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .l-header.is-scrolled {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .l-header.is-hidden {
          transform: translateY(-100%);
        }
      `;
      document.head.appendChild(style);
    }
  };

  // ============================================================================
  // FORMS
  // ============================================================================

  /**
   * Валидация и отправка форм
   */
  const initForms = () => {
    if (app.__formsInit) return;
    app.__formsInit = true;

    const forms = document.querySelectorAll('.c-form, form.needs-validation, form[id*="form"], form[id*="Form"]');

    // Функция для показа уведомлений
    app.notify = (message, type = 'info') => {
      let container = document.getElementById('toast-container');
      
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-live', 'polite');
        container.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          max-width: 400px;
        `;
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `alert alert-${type} alert-dismissible fade show`;
      toast.setAttribute('role', 'alert');
      toast.style.cssText = `
        margin-bottom: 10px;
        animation: slideInRight 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      `;
      
      toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" aria-label="Sluiten"></button>
      `;

      // Добавляем анимацию, если её нет
      if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      container.appendChild(toast);

      // Обработка кнопки закрытия
      const closeBtn = toast.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          toast.style.animation = 'slideOutRight 0.3s ease-out';
          setTimeout(() => toast.remove(), 300);
        });
      }

      // Автоматическое закрытие через 5 секунд
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = 'slideOutRight 0.3s ease-out';
          setTimeout(() => {
            if (toast.parentNode) {
              toast.remove();
            }
          }, 300);
        }
      }, 5000);
    };

    forms.forEach(form => {
      // Валидация полей в реальном времени
      const fields = form.querySelectorAll('input, textarea, select');
      
      fields.forEach(field => {
        // Валидация при потере фокуса
        field.addEventListener('blur', function() {
          if (this.value || this.hasAttribute('aria-required') || this.required) {
            const validation = validateField(this);
            
            if (!validation.valid) {
              showFieldError(this, validation.message);
            } else {
              hideFieldError(this);
            }
          }
        });

        // Убираем ошибку при вводе
        field.addEventListener('input', function() {
          if (this.classList.contains('is-invalid')) {
            const validation = validateField(this);
            
            if (validation.valid) {
              hideFieldError(this);
            }
          }
        });

        // Для чекбоксов
        if (field.type === 'checkbox') {
          field.addEventListener('change', function() {
            const validation = validateField(this);
            
            if (!validation.valid) {
              showFieldError(this, validation.message);
            } else {
              hideFieldError(this);
            }
          });
        }
      });

      // Обработка отправки формы
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Валидация всех полей
        let isValid = true;
        const invalidFields = [];

        fields.forEach(field => {
          const validation = validateField(field);
          
          if (!validation.valid) {
            isValid = false;
            invalidFields.push({
              field: field,
              message: validation.message
            });
            showFieldError(field, validation.message);
          } else {
            hideFieldError(field);
          }
        });

        if (!isValid) {
          // Показываем общее сообщение об ошибке
          const firstInvalidField = invalidFields[0];
          app.notify(
            `Controleer de volgende velden: ${invalidFields.map(f => {
              const label = f.field.parentElement.querySelector('label');
              return label ? label.textContent.replace('*', '').trim() : f.field.id;
            }).join(', ')}`,
            'danger'
          );
          
          // Фокус на первом невалидном поле
          if (firstInvalidField) {
            firstInvalidField.field.focus();
            
            // Плавный скролл к полю с ошибкой
            const header = document.querySelector('.l-header');
            const headerHeight = header ? header.offsetHeight : 80;
            const fieldPosition = firstInvalidField.field.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            
            window.scrollTo({
              top: fieldPosition,
              behavior: 'smooth'
            });
          }
          
          form.classList.add('was-validated');
          return;
        }

        // Форма валидна - отправляем
        const submitBtn = this.querySelector('button[type="submit"]');
        
        if (submitBtn) {
          submitBtn.disabled = true;
          const originalText = submitBtn.innerHTML;
          submitBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Verzenden...
          `;
          submitBtn.style.pointerEvents = 'none';
        }

        // Собираем данные формы
        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => {
          data[key] = value;
        });

        // Отправка на сервер
        fetch('process.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(data)
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(result => {
            if (result.success) {
              app.notify('✓ Bedankt! Uw bericht is succesvol verzonden. We nemen zo spoedig mogelijk contact met u op.', 'success');
              form.reset();
              form.classList.remove('was-validated');
              
              // Скрываем все ошибки
              fields.forEach(field => hideFieldError(field));
              
              // Плавный скролл вверх
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            } else {
              app.notify('✕ ' + (result.message || 'Er is een fout opgetreden. Probeer het later opnieuw.'), 'danger');
            }
          })
          .catch(error => {
            console.error('Form submission error:', error);
            app.notify('✕ Er is een fout opgetreden bij het verzenden. Controleer uw internetverbinding en probeer het opnieuw.', 'danger');
          })
          .finally(() => {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
              submitBtn.style.pointerEvents = '';
            }
          });
      });
    });
  };

  // ============================================================================
  // BLOG & PORTFOLIO FILTERS
  // ============================================================================

  /**
   * Фильтрация блога по категориям
   */
  const initBlogFilters = () => {
    if (app.__blogFiltersInit) return;
    app.__blogFiltersInit = true;

    const filterButtons = document.querySelectorAll('.c-category-btn, .c-button--filter');
    const blogCards = document.querySelectorAll('[data-category]');

    if (filterButtons.length === 0 || blogCards.length === 0) return;

    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const filter = this.getAttribute('data-category') || this.getAttribute('data-filter');
        
        // Обновляем активную кнопку
        filterButtons.forEach(btn => btn.classList.remove('is-active'));
        this.classList.add('is-active');

        // Фильтруем карточки с анимацией
        blogCards.forEach((card, index) => {
          const cardCategory = card.getAttribute('data-category');
          
          if (filter === 'all' || cardCategory === filter) {
            card.style.display = '';
            card.style.animation = 'none';
            
            // Запускаем анимацию появления
            setTimeout(() => {
              card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s both`;
            }, 10);
          } else {
            card.style.animation = 'fadeOut 0.3s ease-out';
            
            setTimeout(() => {
              card.style.display = 'none';
            }, 300);
          }
        });

        // Добавляем анимации, если их нет
        if (!document.getElementById('filter-animations')) {
          const style = document.createElement('style');
          style.id = 'filter-animations';
          style.textContent = `
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes fadeOut {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }
          `;
          document.head.appendChild(style);
        }

        // Обновляем AOS
        if (app.refreshAOS) {
          setTimeout(() => app.refreshAOS(), 400);
        }
      });
    });
  };

  /**
   * Пагинация
   */
  const initPagination = () => {
    if (app.__paginationInit) return;
    app.__paginationInit = true;

    const paginationButtons = document.querySelectorAll('.c-pagination__number, .c-pagination__button');

    paginationButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Убираем активный класс со всех кнопок
        document.querySelectorAll('.c-pagination__number').forEach(btn => {
          btn.classList.remove('is-active');
          btn.removeAttribute('aria-current');
        });
        
        // Добавляем активный класс на текущую кнопку
        if (this.classList.contains('c-pagination__number')) {
          this.classList.add('is-active');
          this.setAttribute('aria-current', 'page');
        }
        
        // Плавный скролл к началу контента
        const mainContent = document.querySelector('main, .l-section');
        if (mainContent) {
          const header = document.querySelector('.l-header');
          const headerHeight = header ? header.offsetHeight : 80;
          const targetPosition = mainContent.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  };

  // ============================================================================
  // SLIDER
  // ============================================================================

  /**
   * Простой слайдер для главной страницы
   */
  const initSlider = () => {
    if (app.__sliderInit) return;
    app.__sliderInit = true;

    const slider = document.querySelector('.c-slider');
    if (!slider) return;

    const slides = slider.querySelectorAll('[class*="slide"], .c-card');
    if (slides.length === 0) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    // Создаем навигацию
    const nav = document.createElement('div');
    nav.className = 'c-slider__nav';
    nav.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
    `;

    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = 'c-slider__dot';
      dot.setAttribute('aria-label', `Ga naar slide ${i + 1}`);
      dot.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--color-primary);
        background: ${i === 0 ? 'var(--color-primary)' : 'transparent'};
        cursor: pointer;
        transition: all 0.3s ease;
      `;
      
      dot.addEventListener('click', () => goToSlide(i));
      nav.appendChild(dot);
    }

    slider.appendChild(nav);

    const dots = nav.querySelectorAll('.c-slider__dot');

    // Функция перехода к слайду
    const goToSlide = (index) => {
      slides[currentSlide].style.display = 'none';
      dots[currentSlide].style.background = 'transparent';
      
      currentSlide = index;
      
      slides[currentSlide].style.display = 'block';
      slides[currentSlide].style.animation = 'fadeInSlide 0.6s ease-out';
      dots[currentSlide].style.background = 'var(--color-primary)';
    };

    // Скрываем все слайды кроме первого
    slides.forEach((slide, index) => {
      slide.style.display = index === 0 ? 'block' : 'none';
    });

    // Автоматическая смена слайдов
    setInterval(() => {
      goToSlide((currentSlide + 1) % totalSlides);
    }, 5000);

    // Добавляем анимацию
    if (!document.getElementById('slider-animations')) {
      const style = document.createElement('style');
      style.id = 'slider-animations';
      style.textContent = `
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  // ============================================================================
  // PORTFOLIO
  // ============================================================================

  /**
   * Модальное окно для портфолио
   */
  const initPortfolioModal = () => {
    if (app.__portfolioModalInit) return;
    app.__portfolioModalInit = true;

    const projectButtons = document.querySelectorAll('[data-project]');
    if (projectButtons.length === 0) return;

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'c-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'c-modal__content';
    modalContent.style.cssText = `
      background: var(--color-bg);
      border-radius: var(--border-radius-xl);
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: var(--space-3xl);
      position: relative;
      transform: scale(0.9);
      transition: transform 0.3s ease;
    `;

    const closeButton = document.createElement('button');
    closeButton.className = 'c-modal__close';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Sluit modal');
    closeButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: transparent;
      border: none;
      font-size: 40px;
      cursor: pointer;
      color: var(--color-text);
      line-height: 1;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.3s ease;
    `;

    closeButton.addEventListener('mouseenter', function() {
      this.style.background = 'var(--color-bg-alt)';
      this.style.transform = 'rotate(90deg)';
    });

    closeButton.addEventListener('mouseleave', function() {
      this.style.background = 'transparent';
      this.style.transform = 'rotate(0)';
    });

    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Функции открытия/закрытия
    const openModal = (projectId) => {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
      }, 10);
      
      modal.setAttribute('aria-hidden', 'false');
      closeButton.focus();
      
      // Здесь можно загрузить контент проекта
      // Для примера просто добавим заголовок
      const existingContent = modalContent.querySelector('.project-content');
      if (existingContent) {
        existingContent.remove();
      }
      
      const content = document.createElement('div');
      content.className = 'project-content';
      content.innerHTML = `
        <h2 style="margin-bottom: var(--space-lg);">Project ${projectId}</h2>
        <p style="color: var(--color-text-light); line-height: 1.6;">
          Gedetailleerde informatie over project ${projectId} wordt hier geladen...
        </p>
      `;
      modalContent.appendChild(content);
    };

    const closeModal = () => {
      modal.style.opacity = '0';
      modalContent.style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }, 300);
      
      modal.setAttribute('aria-hidden', 'true');
    };

    // События
    projectButtons.forEach(button => {
      button.addEventListener('click', function() {
        const projectId = this.getAttribute('data-project');
        openModal(projectId);
      });
    });

    closeButton.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
      }
    });
  };

  // ============================================================================
  // UTILITY FEATURES
  // ============================================================================

  /**
   * Lazy loading для изображений
   */
  const initLazyLoading = () => {
    if (app.__lazyLoadInit) return;
    app.__lazyLoadInit = true;

    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            // Добавляем плавное появление
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.5s ease-out';
            
            img.addEventListener('load', () => {
              img.style.opacity = '1';
            });
            
            observer.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback для старых браузеров
      images.forEach(img => {
        if (!img.classList.contains('img-fluid')) {
          img.classList.add('img-fluid');
        }
      });
    }
  };

  /**
   * Параллакс эффект для hero секций
   */
  const initParallax = () => {
    if (app.__parallaxInit) return;
    app.__parallaxInit = true;

    const parallaxSections = document.querySelectorAll('.l-section--hero, .l-section--hero-about, .l-section--hero-services');
    
    if (parallaxSections.length === 0) return;

    const handleScroll = throttle(() => {
      const scrolled = window.pageYOffset;
      
      parallaxSections.forEach(section => {
        const speed = 0.5;
        const yPos = -(scrolled * speed);
        
        section.style.backgroundPosition = `center ${yPos}px`;
      });
    }, 10);

    window.addEventListener('scroll', handleScroll);
  };

  /**
   * Обработка focus states для доступности
   */
  const initAccessibility = () => {
    if (app.__a11yInit) return;
    app.__a11yInit = true;

    // Показываем focus только при навигации с клавиатуры
    let isKeyboardNavigation = false;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isKeyboardNavigation = true;
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      isKeyboardNavigation = false;
      document.body.classList.remove('keyboard-navigation');
    });

    // Добавляем стили
    if (!document.getElementById('a11y-styles')) {
      const style = document.createElement('style');
      style.id = 'a11y-styles';
      style.textContent = `
        body:not(.keyboard-navigation) *:focus {
          outline: none;
        }
        .keyboard-navigation *:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(style);
    }

    // Skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Ga direct naar de inhoud';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--color-primary);
      color: var(--color-bg);
      padding: 8px 16px;
      text-decoration: none;
      z-index: 10000;
      border-radius: 0 0 4px 0;
    `;
    
    skipLink.addEventListener('focus', function() {
      this.style.top = '0';
    });
    
    skipLink.addEventListener('blur', function() {
      this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Добавляем ID к main content если его нет
    const mainContent = document.querySelector('main');
    if (mainContent && !mainContent.id) {
      mainContent.id = 'main-content';
    }
  };

  /**
   * Прогресс бар чтения (для блога)
   */
  const initReadingProgress = () => {
    if (app.__readingProgressInit) return;
    app.__readingProgressInit = true;

    // Проверяем, находимся ли мы на странице блога/статьи
    const isBlogPage = document.querySelector('.l-section--hero-blog, [class*="blog"], [class*="article"]');
    if (!isBlogPage) return;

    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: var(--header-h);
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
      z-index: 9998;
      transition: width 0.1s ease-out;
    `;
    
    document.body.appendChild(progressBar);

    const updateProgress = throttle(() => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.pageYOffset;
      const progress = (scrolled / documentHeight) * 100;
      
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    }, 10);

    window.addEventListener('scroll', updateProgress);
    updateProgress();
  };

  // ============================================================================
  // MAIN INITIALIZATION
  // ============================================================================

  /**
   * Главная функция инициализации
   */
  app.init = () => {
    if (app.__initialized) return;
    app.__initialized = true;

    console.log('🚀 Initializing website animations...');

    // Core features (всегда)
    initAOS();
    initBurgerMenu();
    initSmoothScroll();
    initActiveMenuState();
    initStickyHeader();
    initAccessibility();

    // Animations
    initImageAnimations();
    initCardAnimations();
    initButtonAnimations();
    initCounterAnimations();

    // Forms
    initForms();

    // Page-specific features
    initBlogFilters();
    initPagination();
    initSlider();
    initPortfolioModal();

    // Performance optimizations
    initLazyLoading();
    initParallax();
    initReadingProgress();

    console.log('✅ Website animations initialized successfully');

    // Trigger resize event для корректной работы всех компонентов
    window.dispatchEvent(new Event('resize'));

    // Refresh AOS после загрузки
    if (app.refreshAOS) {
      setTimeout(() => app.refreshAOS(), 100);
    }
  };

  // Инициализация при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

  // Реинициализация при динамической загрузке контента
  app.reinit = () => {
    console.log('🔄 Reinitializing animations...');
    
    if (app.refreshAOS) {
      app.refreshAOS();
    }
    
    // Переинициализируем анимации изображений для новых элементов
    initImageAnimations();
    initCardAnimations();
    initButtonAnimations();
  };

  // Экспорт в глобальную область
  window.__app = app;

})();
## 🎨 Дополненный CSS с анимациями

Добавьте эти стили в конец вашего `style.css`:

/* ============================================================================
   ДОПОЛНИТЕЛЬНЫЕ АНИМАЦИИ
   ============================================================================ */

/* Плавные переходы для всех интерактивных элементов */
a, button, input, textarea, select, .c-card, .c-button {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover эффекты для ссылок */
a:not(.c-button):hover {
  transform: translateX(2px);
}

/* Пульсация для важных кнопок */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.c-button--primary:hover {
  animation: pulse 1s infinite;
}

/* Появление элементов снизу */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Появление элементов слева */
@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Появление элементов справа */
@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Масштабирование */
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Анимация загрузки */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 1.5px;
}

/* Эффект мерцания для placeholder изображений */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.c-image-loading {
  background: linear-gradient(
    90deg,
    var(--color-bg-alt) 0%,
    var(--color-bg-elevated) 50%,
    var(--color-bg-alt) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

/* Глянцевый эффект при наведении на карточки */
.c-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.c-card:hover::before {
  left: 100%;
}

/* Анимация фокуса для полей ввода */
.c-form__input:focus,
.c-form__textarea:focus,
.c-form__select:focus {
  transform: translateY(-2px);
}

/* Shake анимация для ошибок */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px);
  }
}

.is-invalid {
  animation: shake 0.5s;
}

/* Hover эффект для социальных иконок */
.c-social-link {
  position: relative;
  overflow: hidden;
}

.c-social-link::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.c-social-link:hover::after {
  width: 100%;
  height: 100%;
}

/* Красивый скроллбар */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-alt);
}

::-webkit-scrollbar-thumb {
  background: var(--color-neutral-400);
  border-radius: 6px;
  border: 2px solid var(--color-bg-alt);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}

/* Selection style */
::selection {
  background: var(--color-primary);
  color: var(--color-bg);
}

::-moz-selection {
  background: var(--color-primary);
  color: var(--color-bg);
}
