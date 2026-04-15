# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- View participant lists without logging in
- Teachers can log in to sign students up for activities
- Teachers can log students out of activities

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| POST   | `/auth/login`                                                     | Log in as a teacher and get a session token                         |
| POST   | `/auth/logout`                                                    | End the current teacher session                                     |
| GET    | `/auth/session`                                                   | Validate the active teacher session                                 |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign a student up for an activity as a teacher                      |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student from an activity as a teacher               |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.

## Teacher Access

Teacher usernames and password hashes are stored in `src/teachers.json`.

Demo accounts included in this repository:

- Username: `ms-johnson`
- Password: `mergington123`
- Username: `mr-lee`
- Password: `clubadvisor`
