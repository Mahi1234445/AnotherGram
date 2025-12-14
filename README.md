# AnotherGram

A social media app built with Django and Next.js.

## What is this?
It's an Instagram-like app where you can post photos/videos, share stories, and follow your friends. It supports private accounts, follow requests, and has a dark mode.

## Codebase
- **Backend**: Django REST Framework
- **Frontend**: Next.js (React)

## How to Run

### 1. Backend (Django)
Open a terminal in the `backend` folder:

```bash
# create virtual env
python -m venv venv

# activate it
# windows:
venv\Scripts\activate
# mac/linux:
source venv/bin/activate

# install libs
pip install -r requirements.txt

# setup db
python manage.py migrate

# run it
python manage.py runserver
```

### 2. Frontend (Next.js)
Open a new terminal in the `frontend` folder:

```bash
npm install
npm run dev
```

Go to `http://localhost:3000`.
