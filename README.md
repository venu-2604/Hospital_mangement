# AROGITH Hospital Management System

AROGITH is a modern hospital management system built with React (frontend) and Spring Boot (backend).

## Project Structure

- `/project` - Frontend React application
- `/backend` - Backend Spring Boot application

## Prerequisites

- Node.js (v16 or higher)
- Java 17
- Maven
- PostgreSQL database

## Database Setup

1. Make sure PostgreSQL is running
2. Create a database named "Arogith"
3. The tables are already set up (patients, visits, labtests)
4. The database credentials are configured in `/backend/src/main/resources/application.properties`

## Running the Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Build the project:
   ```
   mvn clean install
   ```

3. Run the Spring Boot application:
   ```
   mvn spring-boot:run
   ```

The backend API will be available at http://localhost:8080/api/

## Running the Frontend

1. Navigate to the frontend directory:
   ```
   cd project
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

The frontend will be available at http://localhost:3000

## API Endpoints

### Patients

- `GET /api/patients` - Get all patients
- `GET /api/patients/{patientId}` - Get patient by ID
- `GET /api/patients/category/{category}` - Get patients by visit date category (today, yesterday, all)
- `POST /api/patients` - Register a new patient
- `PUT /api/patients/{patientId}` - Update patient details
- `GET /api/patients/search?query={query}` - Search patients

### Visits

- `GET /api/visits` - Get all visits
- `GET /api/visits/{visitId}` - Get visit by ID
- `GET /api/visits/patient/{patientId}` - Get visits by patient ID
- `POST /api/visits` - Create a new visit
- `PUT /api/visits/{visitId}` - Update visit details

### Lab Tests

- `GET /api/labtests` - Get all lab tests
- `GET /api/labtests/{testId}` - Get lab test by ID
- `GET /api/labtests/visit/{visitId}` - Get lab tests by visit ID
- `POST /api/labtests` - Add a new lab test
- `PUT /api/labtests/{testId}` - Update lab test details
- `DELETE /api/labtests/{testId}` - Delete lab test

## Features

- Patient registration and management
- Visit history tracking
- Lab test ordering and results
- Search and filter patients
- Responsive design for desktop and mobile devices
- Patient details close button (X) to easily return to patient list
- Health check API to monitor system availability

## Note

This project is currently set up to connect to a PostgreSQL database with the following credentials:
- Database: Arogith
- Username: postgres
- Password: Venu@2604

To change these settings, modify the `/backend/src/main/resources/application.properties` file. 