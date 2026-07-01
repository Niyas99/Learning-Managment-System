# Academia LMS - Student learning Portal

A full-stack LMS portal slice allowing students to manage enrolled courses, track study progress via optimistic checks, view live lecture timetables, and submit assignments.

## Project Structure
- `backend/`: Django REST Framework API with SQLite.
- `frontend/`: React + Vite + Tailwind CSS v4 + TanStack Query SPA.

---

## Local Setup & Installation

### Prerequisite Checklist
- **Python 3.10+** (System has Python 3.13)
- **Node.js 18+** (System has Node.js 24 LTS)
- **Git**

---

### 1. Backend Setup (Django API)

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **Mac/Linux**:
     ```bash
     source venv/bin/activate
     ```
3. Run database migrations to prepare tables:
   ```bash
   python manage.py migrate
   ```
4. Load mock students, faculty, classrooms, modules, and edge cases:
   ```bash
   python manage.py seed_lms
   ```
5. Launch the local API server (runs on `http://127.0.0.1:8000`):
   ```bash
   python manage.py runserver
   ```

*To verify database integrity, run the backend unit tests:*
```bash
python manage.py test
```

---

### 2. Frontend Setup (React + Vite SPA)

1. Open another terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite dev server (runs on `http://localhost:5173`):
   ```bash
   npm run dev
   ```

---

## 3. Version Control & GitHub Pushing Tutorial

If you want to upload this project to your own GitHub account, follow these simple steps:

1. **Sign in to GitHub** and create a new repository:
   - Go to [github.com/new](https://github.com/new).
   - Name your repository (e.g., `my-courses-lms-app`).
   - Do **NOT** check "Add a README", "Add .gitignore", or "Choose a license" (since we already created them locally).
   - Click **Create repository**.
2. **Link local git to GitHub** and push:
   - Copy the commands under the heading **"…or push an existing repository from the command line"**.
   - They will look like this:
     ```bash
     # Navigate to the root folder (my-courses-app)
     cd ..
     
     # Rename default branch to main
     git branch -M main
     
     # Add the link to your GitHub repository (replace with your repository url)
     git remote add origin https://github.com/YOUR_USERNAME/my-courses-lms-app.git
     
     # Push the code
     git push -u origin main
     ```
3. Refresh your GitHub repository page; your code is now live!

---

## 4. Production Cloud Deployment Guide

### Deploying the Backend (Render / Railway)
1. Commit all files in Git and push to GitHub.
2. Sign up on **Render.com** and click **New + > Web Service**.
3. Link your GitHub repository.
4. Select the environment parameters:
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py migrate && python manage.py seed_lms
     ```
   - **Start Command**:
     ```bash
     gunicorn lms_project.wsgi
     ```
5. Define environment variables in Render's dashboard:
   - `SECRET_KEY`: Choose a secure random string.
   - `DEBUG`: `False`

### Deploying the Frontend (Vercel)
1. Sign up on **Vercel.com** and click **Add New > Project**.
2. Link your GitHub repository.
3. Configure the Root Directory to target `frontend`.
4. Define Environment Variables:
   - `VITE_API_URL`: The production URL of your Render backend API (e.g. `https://my-lms-api.onrender.com`).
5. Click **Deploy**. Vercel will automatically compile it and give you a live URL!
