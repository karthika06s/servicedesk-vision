# ServiceDesk Vision Backend

Spring Boot backend for login and signup.

## Run

```powershell
mvn spring-boot:run
```

The API starts on `http://localhost:8080`.

## Auth endpoints

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/auth/health`

Hibernate creates and updates the configured MySQL database.

No default users, projects, employees, or tasks are seeded. Create accounts through signup,
then create projects and project tasks from the dashboard.
