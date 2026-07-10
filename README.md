# My House

My House is a dark-mode shipping container home planner. It helps sketch a container layout, estimate practical build costs, and compare the projected build against buying an existing house.

## Features

- Drag-and-drop layout manager for 20 ft and 40 ft shipping containers
- Container condition, level, opening, reinforcement, and joining options
- Realistic cost categories for land, site prep, foundation, permits, electrical, plumbing, HVAC, insulation, water/sewer, and optional solar/battery
- Buy-vs-build comparison against an existing house purchase
- MongoDB-backed project saving when `mongoDB_URI` is configured
- CapRover-ready Docker deployment

## Environment

CapRover should define:

```bash
mongoDB_URI=mongodb+srv://...
```

The app listens on `process.env.PORT`, falling back to `28206` for local development. CapRover provides the container HTTP port.

## Local Development

```bash
npm install
npm start
```

Open `http://localhost:28206`.

Project saving is disabled locally unless `mongoDB_URI` is set in your shell.

## CapRover Deployment

This repo includes:

- `Dockerfile`
- `captain-definition`

The Docker image runs `npm install --omit=dev` during build as required, exposes port `28206`, and starts the Express server with `npm start`.
