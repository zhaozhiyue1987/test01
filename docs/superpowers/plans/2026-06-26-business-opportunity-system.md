# 商情管理系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally deployed PC web app for customer visits, business opportunity tracking, customer management, and dashboard analytics.

**Architecture:** Use a Vite React frontend and an Express backend with SQLite persistence. Backend owns validation, status transitions, seed data, and REST APIs; frontend consumes `/api` through Vite proxy and renders a desktop CRM-style interface.

**Tech Stack:** React, Vite, TypeScript, Express, better-sqlite3, Vitest, Supertest, Recharts, Lucide React.

## Global Constraints

- PC Web only; no mobile or mini-program implementation.
- Single role: customer manager can view and operate all local data.
- Theme primary color: `#2F88FF`.
- Status machine: `10 -> 20 -> 30 -> 40`, any active status can go to `90`, adjacent rollback is allowed, `90` can reactivate to `10`.
- Backend port: `3001`.
- Frontend port: `5173`.
- API responses use `{ success, data, message }`.
- Project is initialized as a local Git repository and should be ready to connect to a GitHub remote.
- Do not commit `node_modules`, `dist`, local SQLite files, environment files, or logs.

---

## File Structure

- Create `package.json`: workspace scripts and dependencies.
- Create `server/`: Express app, SQLite schema, seed data, repositories, routes, validation, and tests.
- Create `src/`: React app, API client, route-level pages, reusable UI components, styles.
- Create `index.html`, `vite.config.ts`, `tsconfig*.json`: Vite and TypeScript configuration.
- Create `README.md`: local install and run instructions.
- Create `.gitignore`: GitHub-ready ignore rules.

## Task 1: Backend Domain Core

**Files:**
- Create: `server/domain.js`
- Create: `server/domain.test.js`

**Interfaces:**
- Produces: `calculateProfitRate(income, cost)`, `transitionStatus(currentStatus, action)`, `validateOpportunityInput(input)`, `validateVisitInput(input)`, `validateCustomerInput(input)`.

- [ ] Write failing tests for profit rate, status transitions, and required validation.
- [ ] Run `npm test -- server/domain.test.js` and confirm failure because `server/domain.js` does not exist.
- [ ] Implement `server/domain.js` minimally.
- [ ] Run `npm test -- server/domain.test.js` and confirm pass.

## Task 2: Backend Database And API

**Files:**
- Create: `server/db.js`
- Create: `server/app.js`
- Create: `server/index.js`
- Create: `server/api.test.js`

**Interfaces:**
- Consumes: domain functions from Task 1.
- Produces: Express app with `/api/dashboard`, `/api/opportunities`, `/api/opportunities/:id/status`, `/api/visits`, `/api/customers`, `/api/dictionaries`.

- [ ] Write failing API tests for dictionaries, opportunity list/detail/create/status, visit create/list, customer create/list, dashboard summary.
- [ ] Run `npm test -- server/api.test.js` and confirm failure because app/database files do not exist.
- [ ] Implement SQLite schema, seed data, repositories, and Express routes.
- [ ] Run `npm test -- server/api.test.js` and confirm pass.

## Task 3: Frontend Shell And Shared UI

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/api.ts`
- Create: `src/components/*`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: backend REST API.
- Produces: app shell with sidebar navigation, page header, loading/error states, cards, tables, status tags, forms, modal, and toast helpers.

- [ ] Implement Vite/React scaffold.
- [ ] Implement semantic design tokens using the confirmed blue CRM palette.
- [ ] Implement shared layout and reusable UI components.
- [ ] Run `npm run build` and confirm frontend compiles.

## Task 4: Business Pages

**Files:**
- Create: `src/pages/DashboardPage.tsx`
- Create: `src/pages/OpportunitiesPage.tsx`
- Create: `src/pages/OpportunityDetailPage.tsx`
- Create: `src/pages/OpportunityFormPage.tsx`
- Create: `src/pages/VisitsPage.tsx`
- Create: `src/pages/VisitFormPage.tsx`
- Create: `src/pages/CustomersPage.tsx`
- Create: `src/pages/CustomerDetailPage.tsx`
- Create: `src/pages/CustomerFormPage.tsx`

**Interfaces:**
- Consumes: `api.ts` and shared UI components.
- Produces: all PRD pages and interactions.

- [ ] Implement dashboard cards and charts.
- [ ] Implement opportunity list, filters, detail tabs, create/edit form, and status actions.
- [ ] Implement visit aggregate list and create form with photo preview.
- [ ] Implement customer list, detail, and form.
- [ ] Run `npm run build` and confirm pass.

## Task 5: Local Deployment Verification

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Produces: working local app at `http://localhost:5173`.

- [ ] Run `npm install`.
- [ ] Run backend and frontend dev servers.
- [ ] Verify API health endpoint returns success.
- [ ] Open the app and check dashboard, opportunity list, detail, forms, visits, and customers render.
- [ ] Record local URL and commands in `README.md`.
- [ ] Commit the completed project locally.
- [ ] If a GitHub remote URL is provided, add it as `origin` and push the project.
