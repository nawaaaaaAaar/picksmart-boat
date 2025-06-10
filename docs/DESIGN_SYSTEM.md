# 🎨 Design System Documentation

## Table of Contents
- [Design Philosophy](#design-philosophy)
- [Brand Identity](#brand-identity)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Components](#components)
- [RTL Support](#rtl-support)
- [Icons & Illustrations](#icons--illustrations)
- [Responsive Design](#responsive-design)
- [Animations & Interactions](#animations--interactions)
- [Implementation Guide](#implementation-guide)

## Design Philosophy

### Modern E-commerce Excellence
Our design system draws inspiration from leading global e-commerce platforms, combining modern UI/UX principles with Qatar's cultural context:

- **Bold & Dynamic**: High-contrast visuals with energetic color schemes that catch attention
- **Product-Centric**: Hero imagery and clear product showcase inspired by top-tier retail platforms
- **Interactive Experience**: Hover effects, smooth transitions, and engaging animations that enhance usability
- **Qatar-First Mobile**: Optimized specifically for Qatar's mobile-dominant market and infrastructure
- **Cultural Integration**: Arabic typography, RTL layouts, and deep respect for local preferences

### Design Reference Inspiration
While we reference boat website's modern design patterns for UI inspiration, our vision is uniquely tailored for Qatar's smart shopping market with distinct brand identity and user experience goals focused on diverse product categories.

### Design Principles

1. **Accessibility First**: WCAG 2.1 AA compliance
2. **Performance Optimized**: Fast loading, smooth interactions
3. **Culturally Aware**: Qatar market understanding
4. **Scalable**: Consistent across all components
5. **User-Centric**: Intuitive navigation and clear hierarchy

## Brand Identity

### Brand Personality
- **Modern**: Contemporary design language
- **Trustworthy**: Professional and reliable
- **Local**: Qatar-focused with GCC expansion
- **Smart-Forward**: Modern shopping expertise
- **Customer-Centric**: User experience priority

### Brand Values
- Quality products and accessories
- Outstanding customer service
- Local market understanding
- Competitive pricing
- Fast and reliable delivery

## Color System

### Primary Colors
```css
:root {
  /* Primary Brand Colors (Modern Retail Theme) */
  --primary-charcoal: #2D2D2D;      /* Professional dark base */
  --primary-coral: #FF6B6B;         /* Dynamic accent for CTAs */
  --primary-turquoise: #4ECDC4;     /* Fresh highlight */
  
  /* Qatar Cultural Colors */
  --qatar-maroon: #8B1538;          /* Qatar flag maroon */
  --gold-accent: #FFD700;           /* Premium products accent */
  --desert-sand: #F4A460;           /* Warm cultural neutral */
  
  /* Semantic Colors */
  --success: #10B981;               /* Success states */
  --warning: #F59E0B;               /* Warning states */
  --error: #EF4444;                 /* Error states */
  --info: #3B82F6;                  /* Information */
  
  /* Neutral Colors */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
  
  /* Background Colors */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --bg-tertiary: #F3F4F6;
  --bg-dark: #1F2937;
  
  /* Text Colors */
  --text-primary: #111827;
  --text-secondary: #4B5563;
  --text-tertiary: #9CA3AF;
  --text-on-dark: #FFFFFF;
  --text-on-primary: #FFFFFF;
}
```

### Color Usage Guidelines

#### Primary Colors
- **Charcoal (#2D2D2D)**: Main navigation, headers, primary text
- **Coral (#FF6B6B)**: CTAs, highlights, sale badges
- **Turquoise (#4ECDC4)**: Secondary actions, links, accents

#### Cultural Colors
- **Qatar Maroon (#8B1538)**: Special occasions, national day promotions
- **Gold (#FFD700)**: Premium products, VIP indicators
- **Desert Sand (#F4A460)**: Warm backgrounds, subtle accents

#### Semantic Colors
```css
/* Success - Order confirmations, payment success */
.success {
  color: var(--success);
  background-color: rgba(16, 185, 129, 0.1);
}

/* Warning - Stock warnings, delivery delays */
.warning {
  color: var(--warning);
  background-color: rgba(245, 158, 11, 0.1);
}

/* Error - Validation errors, payment failures */
.error {
  color: var(--error);
  background-color: rgba(239, 68, 68, 0.1);
}

/* Info - General information, tips */
.info {
  color: var(--info);
  background-color: rgba(59, 130, 246, 0.1);
}
```

## Typography

### Font Stacks

#### Arabic Typography
```css
/* Primary Arabic Font Stack */
.font-arabic {
  font-family: 'Almarai', 'Noto Sans Arabic', 'IBM Plex Sans Arabic', 'Tahoma', Arial, sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1, 'kern' 1;
}

/* Alternative Arabic Fonts */
.font-arabic-alt {
  font-family: 'Tajawal', 'Cairo', 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;
}
```

#### English Typography
```css
/* Primary English Font Stack */
.font-english {
  font-family: 'Inter', 'Roboto', 'Helvetica Neue', 'Arial', system-ui, sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1, 'kern' 1;
}

/* Display Font for Headers */
.font-display {
  font-family: 'Poppins', 'Montserrat', 'Inter', sans-serif;
  font-weight: 600;
}
```

### Typography Scale
```css
/* Fluid Typography Scale */
:root {
  /* Display Sizes */
  --text-display-2xl: clamp(3.5rem, 4vw, 4.5rem);    /* 56px - 72px */
  --text-display-xl: clamp(2.75rem, 3.5vw, 3.75rem); /* 44px - 60px */
  --text-display-lg: clamp(2.25rem, 3vw, 3rem);      /* 36px - 48px */
  
  /* Heading Sizes */
  --text-h1: clamp(1.875rem, 2.5vw, 2.25rem);        /* 30px - 36px */
  --text-h2: clamp(1.5rem, 2vw, 1.875rem);           /* 24px - 30px */
  --text-h3: clamp(1.25rem, 1.5vw, 1.5rem);          /* 20px - 24px */
  --text-h4: clamp(1.125rem, 1.25vw, 1.25rem);       /* 18px - 20px */
  
  /* Body Sizes */
  --text-lg: 1.125rem;    /* 18px */
  --text-base: 1rem;      /* 16px */
  --text-sm: 0.875rem;    /* 14px */
  --text-xs: 0.75rem;     /* 12px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}
```

### Typography Components
```css
/* Heading Styles */
.heading-display {
  font-size: var(--text-display-xl);
  font-weight: 700;
  line-height: var(--leading-tight);
  letter-spacing: -0.025em;
}

.heading-primary {
  font-size: var(--text-h1);
  font-weight: 600;
  line-height: var(--leading-tight);
}

.heading-secondary {
  font-size: var(--text-h2);
  font-weight: 600;
  line-height: var(--leading-snug);
}

/* Body Text */
.body-large {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
}

.body-regular {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

.body-small {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

/* Caption Text */
.caption {
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## Spacing & Layout

### Spacing Scale
```css
:root {
  /* Spacing Scale (8px base) */
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */
  --space-40: 10rem;     /* 160px */
  --space-48: 12rem;     /* 192px */
  --space-56: 14rem;     /* 224px */
  --space-64: 16rem;     /* 256px */
}
```

### Layout Grid
```css
/* Container Sizes */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.container-sm { max-width: 640px; }
.container-md { max-width: 768px; }
.container-lg { max-width: 1024px; }
.container-xl { max-width: 1280px; }
.container-2xl { max-width: 1536px; }

/* Grid System */
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cols-6 { grid-template-columns: repeat(6, 1fr); }
.grid-cols-12 { grid-template-columns: repeat(12, 1fr); }

/* Responsive Grid */
@media (min-width: 640px) {
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .sm\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 768px) {
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .md\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  .lg\:grid-cols-6 { grid-template-columns: repeat(6, 1fr); }
}
```

## Components

### Button System
```css
/* Base Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: 1px solid transparent;
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  line-height: 1.25rem;
}

.btn-md {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  line-height: 1.5rem;
}

.btn-lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-lg);
  line-height: 1.75rem;
}

.btn-xl {
  padding: var(--space-5) var(--space-8);
  font-size: var(--text-xl);
  line-height: 1.75rem;
}

/* Button Variants */
.btn-primary {
  background-color: var(--primary-coral);
  color: var(--text-on-primary);
  border-color: var(--primary-coral);
}

.btn-primary:hover {
  background-color: #ff5555;
  border-color: #ff5555;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
}

.btn-secondary {
  background-color: var(--primary-turquoise);
  color: var(--text-on-primary);
  border-color: var(--primary-turquoise);
}

.btn-secondary:hover {
  background-color: #3bc9be;
  border-color: #3bc9be;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(78, 205, 196, 0.3);
}

.btn-outline {
  background-color: transparent;
  color: var(--primary-coral);
  border-color: var(--primary-coral);
}

.btn-outline:hover {
  background-color: var(--primary-coral);
  color: var(--text-on-primary);
}

.btn-ghost {
  background-color: transparent;
  color: var(--text-primary);
  border-color: transparent;
}

.btn-ghost:hover {
  background-color: var(--gray-100);
}
```

### Product Card Component
```css
/* Product Card */
.product-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease-out;
  cursor: pointer;
}

.product-card:hover {
  transform: scale(1.05);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.product-card__image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease-out;
}

.product-card:hover .product-card__image img {
  transform: scale(1.1);
}

.product-card__badge {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  background: var(--primary-coral);
  color: var(--text-on-primary);
  padding: var(--space-1) var(--space-2);
  border-radius: 0.25rem;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.product-card__content {
  padding: var(--space-4);
}

.product-card__title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
  line-height: var(--leading-tight);
}

.product-card__price {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.product-card__price-current {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--primary-coral);
}

.product-card__price-original {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  text-decoration: line-through;
}

.product-card__actions {
  display: flex;
  gap: var(--space-2);
}
```

### Navigation Component
```css
/* Main Navigation */
.navbar {
  background: var(--bg-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
}

.navbar__logo {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--primary-charcoal);
  text-decoration: none;
}

.navbar__menu {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.navbar__link {
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
  position: relative;
  transition: color 0.2s ease;
}

.navbar__link:hover {
  color: var(--primary-coral);
}

.navbar__link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-coral);
  transition: width 0.3s ease;
}

.navbar__link:hover::after {
  width: 100%;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* Mobile Navigation */
@media (max-width: 768px) {
  .navbar__menu {
    position: fixed;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-primary);
    flex-direction: column;
    padding: var(--space-4);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  
  .navbar__menu.is-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }
}
```

### Hero Carousel (boAt-style)
```css
/* Hero Carousel */
.hero-carousel {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  margin-bottom: var(--space-8);
}

.hero-carousel__container {
  display: flex;
  transition: transform 0.5s ease-out;
}

.hero-carousel__slide {
  min-width: 100%;
  position: relative;
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, var(--primary-charcoal), var(--primary-coral));
}

.hero-carousel__content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: var(--space-8);
  color: var(--text-on-dark);
}

.hero-carousel__text {
  max-width: 50%;
}

.hero-carousel__title {
  font-size: var(--text-display-lg);
  font-weight: 700;
  margin-bottom: var(--space-4);
  line-height: var(--leading-tight);
}

.hero-carousel__description {
  font-size: var(--text-lg);
  margin-bottom: var(--space-6);
  opacity: 0.9;
}

.hero-carousel__cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--primary-turquoise);
  color: var(--text-on-primary);
  padding: var(--space-4) var(--space-6);
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.hero-carousel__cta:hover {
  background: #3bc9be;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(78, 205, 196, 0.4);
}

.hero-carousel__indicators {
  position: absolute;
  bottom: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--space-2);
}

.hero-carousel__indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 0.3s ease;
}

.hero-carousel__indicator.is-active {
  background: var(--text-on-dark);
}
```

## RTL Support

### RTL Implementation Strategy
```css
/* RTL Base Styles */
[dir="rtl"] {
  text-align: right;
}

[dir="ltr"] {
  text-align: left;
}

/* RTL-aware margins and padding */
.me-4 {
  margin-inline-end: var(--space-4);
}

.ms-4 {
  margin-inline-start: var(--space-4);
}

.pe-4 {
  padding-inline-end: var(--space-4);
}

.ps-4 {
  padding-inline-start: var(--space-4);
}

/* RTL-aware positioning */
.start-0 {
  inset-inline-start: 0;
}

.end-0 {
  inset-inline-end: 0;
}

/* RTL-aware transforms */
[dir="rtl"] .transform-flip-x {
  transform: scaleX(-1);
}

/* RTL-aware flexbox */
.justify-start {
  justify-content: flex-start;
}

[dir="rtl"] .justify-start {
  justify-content: flex-end;
}

.justify-end {
  justify-content: flex-end;
}

[dir="rtl"] .justify-end {
  justify-content: flex-start;
}
```

### Arabic Typography Adjustments
```css
/* Arabic text enhancements */
.arabic-text {
  font-family: var(--font-arabic);
  line-height: 1.6;
  word-spacing: 0.1em;
}

/* Arabic number formatting */
.arabic-numerals {
  font-feature-settings: 'lnum' 1, 'tnum' 1;
}

/* Arabic date formatting */
.arabic-date {
  direction: ltr;
  unicode-bidi: embed;
}

/* Mixed content (Arabic + English) */
.mixed-content {
  direction: ltr;
  text-align: start;
}

.mixed-content .arabic {
  direction: rtl;
  unicode-bidi: embed;
}
```

### RTL Component Variations
```css
/* RTL Navigation */
[dir="rtl"] .navbar__menu {
  flex-direction: row-reverse;
}

[dir="rtl"] .navbar__link::after {
  right: 0;
  left: auto;
}

/* RTL Product Card */
[dir="rtl"] .product-card__badge {
  right: var(--space-3);
  left: auto;
}

[dir="rtl"] .product-card__price {
  flex-direction: row-reverse;
}

/* RTL Form Elements */
[dir="rtl"] .form-input {
  text-align: right;
  padding-right: var(--space-3);
  padding-left: var(--space-8);
}

[dir="rtl"] .form-input-icon {
  right: var(--space-3);
  left: auto;
}
```

## Icons & Illustrations

### Icon System
```css
/* Icon Base */
.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: middle;
}

/* Icon Sizes */
.icon-xs { width: 0.75rem; height: 0.75rem; }
.icon-sm { width: 1rem; height: 1rem; }
.icon-md { width: 1.25rem; height: 1.25rem; }
.icon-lg { width: 1.5rem; height: 1.5rem; }
.icon-xl { width: 2rem; height: 2rem; }
.icon-2xl { width: 2.5rem; height: 2.5rem; }

/* Icon States */
.icon-primary { color: var(--primary-coral); }
.icon-secondary { color: var(--primary-turquoise); }
.icon-muted { color: var(--text-tertiary); }
.icon-success { color: var(--success); }
.icon-warning { color: var(--warning); }
.icon-error { color: var(--error); }
```

### Required Icons
- Navigation: menu, close, search, user, cart, heart
- E-commerce: add-to-cart, wishlist, compare, share, filter
- Payment: credit-card, paypal, apple-pay, google-pay
- Shipping: truck, location, clock, check-circle
- Social: whatsapp, instagram, facebook, twitter
- General: star, arrow-right, arrow-left, chevron-down, info, warning

## Responsive Design

### Breakpoint System
```css
:root {
  --breakpoint-xs: 475px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Mobile First Media Queries */
@media (min-width: 475px) {
  /* Extra small screens */
}

@media (min-width: 640px) {
  /* Small screens */
}

@media (min-width: 768px) {
  /* Medium screens */
}

@media (min-width: 1024px) {
  /* Large screens */
}

@media (min-width: 1280px) {
  /* Extra large screens */
}

@media (min-width: 1536px) {
  /* 2X large screens */
}
```

### Responsive Typography
```css
/* Fluid typography examples */
.responsive-heading {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.responsive-body {
  font-size: clamp(0.875rem, 2vw, 1.125rem);
}

/* Responsive spacing */
.responsive-padding {
  padding: clamp(1rem, 4vw, 2rem);
}

.responsive-margin {
  margin: clamp(0.5rem, 2vw, 1.5rem);
}
```

## Animations & Interactions

### Hover Effects (boAt-inspired)
```css
/* Product hover effects */
.hover-lift {
  transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
}

.hover-lift:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* Button hover effects */
.hover-glow {
  transition: all 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
  transform: translateY(-2px);
}

/* Image hover effects */
.hover-zoom img {
  transition: transform 0.5s ease-out;
}

.hover-zoom:hover img {
  transform: scale(1.1);
}
```

### Loading Animations
```css
/* Loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-200);
  border-top-color: var(--primary-coral);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Skeleton loading */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

### Page Transitions
```css
/* Page fade transition */
.page-transition {
  transition: opacity 0.3s ease-in-out;
}

.page-transition.is-loading {
  opacity: 0;
}

/* Slide transitions */
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in-right {
  animation: slideInFromRight 0.5s ease-out;
}

.slide-in-left {
  animation: slideInFromLeft 0.5s ease-out;
}

/* RTL animation adjustments */
[dir="rtl"] .slide-in-right {
  animation: slideInFromLeft 0.5s ease-out;
}

[dir="rtl"] .slide-in-left {
  animation: slideInFromRight 0.5s ease-out;
}
```

## Implementation Guide

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          charcoal: '#2D2D2D',
          coral: '#FF6B6B',
          turquoise: '#4ECDC4',
        },
        qatar: {
          maroon: '#8B1538',
          gold: '#FFD700',
          sand: '#F4A460',
        }
      },
      fontFamily: {
        'arabic': ['Almarai', 'Noto Sans Arabic', 'Arial', 'sans-serif'],
        'english': ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'Montserrat', 'Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-rtl'),
  ],
}
```

### CSS Custom Properties Usage
```typescript
// Theme provider for dynamic theme switching
interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    arabic: string;
    english: string;
  };
  direction: 'ltr' | 'rtl';
}

const ThemeProvider: React.FC<{ children: React.ReactNode; theme: ThemeConfig }> = ({ 
  children, 
  theme 
}) => {
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Apply direction
    document.dir = theme.direction;
    
    // Apply font family
    root.style.setProperty('--font-primary', 
      theme.direction === 'ar' ? theme.fonts.arabic : theme.fonts.english
    );
  }, [theme]);

  return <>{children}</>;
};
```

### Component Implementation Example
```tsx
// Button component with design system integration
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  onClick,
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  
  return (
    <button
      className={cn(baseClasses, variantClasses, sizeClasses, className)}
      onClick={onClick}
      disabled={loading}
    >
      {loading && <LoadingSpinner className="icon-sm" />}
      {children}
    </button>
  );
};
```

This comprehensive design system provides the foundation for building a consistent, accessible, and culturally appropriate ecommerce platform for the Qatar market while maintaining the dynamic, modern aesthetic inspired by boAt Lifestyle. 