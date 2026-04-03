---
name: Web App Planning
description: A specialized skill for planning modern web applications with a focus on architecture, performance, SEO, and visual excellence.
---

# Web App Planning Skill

This skill provides a structured framework for planning web-based applications from scratch or when adding significant new features.

## When to Use This Skill

- When starting a new web application project.
- Before implementing a major new feature or user flow.
- When refactoring the core architecture or design system.
- To ensure best practices in SEO, performance, and accessibility are met.
- To enforce consistency in the **NodeJS, React, and MariaDB** stack.
- To ensure a **Docker-first** containerized approach.

## Planning Framework

### 1. Discovery & Requirements
- Define the primary objective of the application.
- Identify core user personas and their primary workflows.
- List essential features for the MVP (Minimum Viable Product).
- **Proactive Question**: Ask the user if **User Management** (Auth, Roles, etc.) is needed.

### 2. Technical Stack Selection
- **Frontend**: React (with Vite for development).
- **Backend**: NodeJS (Express or Fastify).
- **Database**: MariaDB.
- **Deployment**: Docker containerization for both development and production.
- **Styling**: Vanilla CSS, HSL color palettes, modern typography.

### 3. Testability & Quality
- **Testable Components**: Design React components with clear interfaces and minimal side effects to ensure they are easily testable.
- **Test Coverage**: Aim for at least **80% test coverage** for all components and backend logic.
- **Testing Tools**: Use Jest and React Testing Library (or Vitest).

### 4. Visual & UX Strategy
- **Aesthetic Direction**: Vibrant colors, glassmorphism, or sleek dark mode.
- **Typography**: Select modern Google Fonts (e.g., Inter, Outfit).
- **Interactions**: Identify key micro-animations and hover effects to "WOW" the user.
- **Mobile First**: **Every component must be mobile ready.** Design for responsiveness from the start using media queries and flexible layouts.

### 4. Architecture & Data Flow
- Map out the component hierarchy.
- Design the data schema (if applicable).
- Define API endpoints or data fetching strategies.

### 5. SEO & Performance Checklist
- Title tags and meta descriptions for every page.
- Semantic HTML structure (`main`, `section`, `article`, etc.).
- Performance optimization (lazy loading, image compression).

## Best Practices

- **Show, Don't Just Tell**: Use `generate_image` for UI mockups during planning.
- **Premium Design**: Avoid generic styles; aim for a high-end, modern look.
- **Responsive by Default**: Ensure every component is functional and beautiful on mobile, tablet, and desktop screens.
- **Accessibility**: Ensure high contrast and screen reader compatibility.

---
*Follow this skill whenever a planning phase is initiated for a web project.*
