# LabSentinel

A responsive laboratory monitoring dashboard based on the uploaded reference screens.

## Run locally
1. Install Node.js 18+.
2. Open this folder in VS Code.
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:10000`

## Deploy on Render
Create a new Web Service from this project/repository.
- Build Command: `npm install`
- Start Command: `npm start`
- Service name: `labsentinel-dashboard`

The generated Render address will be based on your chosen service name and will not contain an AI-tool brand name.

## Main pages
Dashboard, Live Monitoring, Active Alerts, Alert History, PC Management, Student Management, Monitoring Rules, Notifications, Settings.

The current version includes a working Express API with demo data so the UI is interactive. Replace the demo API state with your database/authentication when connecting your real monitoring agent.

## Student Management
Use **Student Management → + Add Student** to add a student with name, roll number, optional PC assignment, and status. The backend prevents duplicate roll numbers.

## Assigned PC Count
Student Management now calculates assigned and available PC counts dynamically from the current student assignments and registered PCs.
