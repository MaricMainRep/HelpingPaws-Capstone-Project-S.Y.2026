# HelpingPaws Modern UI Styling Guide

## Color System

The application uses a modern, professional color palette with clean design tokens.

### Primary Colors
- **Primary (Blue)**: #0066cc - Used for primary actions, links, and interactive elements
- **Background**: #ffffff (light) / #0f172a (dark)
- **Foreground**: #0f172a (light) / #f1f5f9 (dark)

### Secondary Colors
- **Secondary**: #f0f4f8
- **Muted**: #e2e8f0
- **Border**: #e2e8f0
- **Card**: #ffffff (light) / #1e293b (dark)

### Accent Colors
- **Destructive (Red)**: #ef4444
- **Success (Green)**: #10b981
- **Warning (Orange)**: #f59e0b
- **Info (Cyan)**: #06b6d4

## Design Patterns

### Authentication Pages
- Clean, centered layout with card-based forms
- Rounded corners (rounded-2xl for containers)
- Semi-transparent backgrounds with subtle shadows
- Demo credentials displayed at the bottom
- Role selection with modern card-based radio buttons

### Dashboard
- Professional header with user menu dropdown
- Grid-based stat cards with colored icon backgrounds
- Hover states with smooth transitions
- Border-based cards instead of heavy shadows
- Consistent spacing using Tailwind's gap and padding scale

### Cards
- Thin border (border-border) instead of heavy shadows
- Rounded-xl corners for modern look
- Hover effects: border-primary/50, shadow-lg
- Icon backgrounds use semi-transparent colors (e.g., bg-primary/10)

### Buttons & Interactions
- Primary buttons use solid background with white text
- Outline buttons have border-based styling
- Hover states include smooth color transitions
- Rounded-lg (0.5rem) border radius for consistency

### Typography
- Headings: Bold weights (font-bold)
- Body text: Medium weights (font-medium)
- Helper text: Uses muted-foreground for secondary information
- Mono font for demo credentials

## Component Updates

### AuthForm Component
- Modern error states with warning icon
- Password visibility toggles with smooth interactions
- Semantic color tokens for error messages
- Improved field descriptions with proper sizing

### DashboardHeader Component
- User menu dropdown with settings icon
- Proper logout functionality
- Role-based navigation (not implemented in header, in content)
- Responsive design for mobile

### StatCard Component
- Large, readable numbers (text-4xl)
- Semi-transparent icon backgrounds
- Trend indicators with up/down arrows
- Hover state with border and shadow transitions

### Login/Register Pages
- Brand icon in header
- Demo credentials displayed prominently
- Modern card-based layout
- Proper spacing and typography hierarchy

## CSS Variables Used

All styling uses CSS custom properties defined in globals.css:
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--primary`, `--primary-foreground`
- `--muted`, `--muted-foreground`
- `--border`, `--input`
- `--destructive`, `--destructive-foreground`

## Responsive Design

All pages are mobile-first with:
- Hidden desktop navigation on mobile
- Touch-friendly button sizes
- Proper spacing adjustments
- Hamburger menu for mobile navigation (where applicable)

## Dark Mode

Dark mode colors are automatically applied via `.dark` class:
- Backgrounds: Darker shades (#0f172a, #1e293b)
- Foregrounds: Lighter shades (#f1f5f9)
- Borders: Medium grays (#334155)

Utilities like `hover:border-primary/50` automatically adjust in dark mode.
