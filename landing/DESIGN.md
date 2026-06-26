# Design System & Patterns - NUX

This document outlines the visual language, design principles, and reusable patterns used across the NUX application to ensure consistency and a premium user experience.

---

## 🎨 Design Tokens

### Core Colors
NUX uses a bold, tech-forward color palette centered around high-contrast purple and yellow.
| Token | Hex | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `#3C004F` | `nux-purple` | Branding, Sidebars, Main Surfaces |
| **Accent** | `#FFC700` | `nux-yellow` | Active States, Highlights, CTAs |
| **Dark** | `#1a0b2e` | `nux-dark` | Dark Mode Surfaces |
| **Light** | `#f3f4f6` | `nux-light` | Light Mode Neutral bg |

### Typography
- **Headings (Display)**: `Montserrat`
  - *Hero*: Bold/Black (800-900), `tracking-tighter`.
  - *Section*: Semi-bold (600), `tracking-tight`.
- **Body & Interface**: `Inter`
  - *Standard*: Regular (400) to Medium (500).
- **Micro-labels**: `Inter`
  - *Style*: `uppercase`, `tracking-widest`, `text-[10px]` or `text-xs`. Used for category indicators and supplemental info.

---

## 📐 Layout & Structure

### Immersive Surfaces (Landing Page)
- **Snap Scrolling**: Section-based navigation via `snap-y snap-mandatory`.
- **Hero Video**: Full-screen or large aspect ratio video with `background: linear-gradient` masks to blend with page borders.
- **Fluid Grids**: Adaptive 1-to-3 column layouts for feature showcases.

### Administrative Workspace (Dashboard)
- **Fluid Sidebar**: Collapsible desktop navigation (w-72 to w-20) and mobile overlay.
- **Glassmorphism Header**: `bg-white/80` or `bg-gray-800/80` with `backdrop-blur-xl`.
- **Floating Navigation**: A specific mobile pattern for quick tool access at the bottom of the screen.

---

## ✨ Component Patterns

### 1. Interactive Cards
- **Selection Card**: Used in onboarding.
  - *Inactive*: Gray border, white background.
  - *Active*: Purple border, purple-50 background, checked indicator icon.
- **Perspective Card**: Advanced cards using `motion/react` to react to mouse cursor positioning via `rotateX` and `rotateY` transforms.
- **Simple Dashboard Card**: `bg-white` (Light) | `bg-gray-800` (Dark) with `rounded-xl` and subtle shadows.

### 2. Form System
- **InputField**: Unified input design with optional Lucide icons and error states.
  - *Default*: `border-gray-100`, `rounded-xl`.
  - *Focus*: `border-purple-500`, `ring-4 ring-purple-100`.
  - *Error*: `border-red-300`, `ring-red-100`.
- **TextareaField**: Same visual styling as InputField, optimized for long-form content.

### 3. Buttons
Buttons are defined with centralized variants:
- **Primary**: Purple background, white text.
- **Secondary**: Yellow background, purple text.
- **Danger**: Red background, white text.
- **Ghost**: Transparent with hover background shift.
- **Interaction**: Unified `whileTap={{ scale: 0.95 }}` and hover scales for tactile feedback.

---

## 🎬 Motion Mechanics

Animations are deliberate and reinforce hierarchy:
- **Parallax**: Background elements (numbers, shapes) shift speed relative to scroll.
- **Staggered Entrances**: Groups of cards or items animate in sequence rather than all at once.
- **System Feedback**: Using `AnimatePresence` for smooth mounting/unmounting of modals and notifications.

---

## 🌓 Dark Mode Strategy
NUX employs a high-focus Dark Mode strategy:
- Neutral grays transition to deep violets (`nux-dark`).
- Text contrast shifts from `gray-900` to `gray-100`.
- Components like the Rich Text Editor (Quill) and Popups (SweetAlert) are themed manually via CSS overrides to match the system palette.
