# DevTube API

> Backend API for DevTube application, which is a "Learn to code" courses directory website.

## Usage
Rename "config/config.env.env" to "config/config.env and update the values/settings to your own

## Install Dependencies
```
npm install
```

## Run App
```
# Run in dev mode
npm run dev

# Run in prod mode
npm start
```

## Database Seeder

To seed the database with courses, users, and reviews with data from "\_data" folder, rund:
```
# Destroy all data
node seeder -d

# Import all data
node seeder -i
```

- Version: 1.0.0
- License: MIT
