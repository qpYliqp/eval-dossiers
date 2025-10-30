# EvalDossiers

EvalDossiers is a web application for evaluating files. This project is divided into two parts: the frontend (Angular) and the backend (Node.js/Express).

<div align="center">
<table>
<tr>
<td align="center" width="9999">

## 📚 Documentation 📚

This readme can be short and technical, if you want a full user guide, it can be found at:

[User Guide English Version](DOCUMENTATION_EN.md) | [User Guide French Version](DOCUMENTATION_FR.md)

</td>
</tr>
</table>
</div>

## Prerequisites

Make sure you have the following installed on your machine:
- npm (version 6 or higher)
- Docker Compose (version 2.22.0 or higher)

> **⚠️ IMPORTANT DISCLAIMER ⚠️**
>
> **This application is currently in active development and may contain bugs or incomplete features. 
> Use in production environments is not recommended without thorough testing.
> Always back up your data before using this application with real student records.**

## Installation

#### Backend

1. Navigate to the backend directory:
    ```bash
    cd backend
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

#### Frontend

1. Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

### With Docker

1. Make sure Docker and Docker Compose are installed on your machine.

2. In the root directory of the project, run the following command to start the backend and frontend services:
    ```bash
    docker-compose up --build
    ```

The backend and frontend services will start at `http://localhost:3000` and `http://localhost:4200` respectively.

## Useful Docker Compose Commands

To start the application in hot reload mode, run:

```bash
docker compose up --watch
```

To rebuild all components of the application, run:

```bash
docker compose up --build
```

To stop and remove volumes, run:

```bash
docker compose down -v
```

To just stop the application, run:

```bash
docker compose down
```

To rebuild a specific component (frontend, backend, db), run:

```bash
docker compose up --build service_name
```

## Project Structure

- `backend/` : Contains the source code for the backend server (Node.js/Express).
- `frontend/` : Contains the source code for the frontend application (Angular).

## Running Tests

### Backend

To run the backend unit tests, navigate to the backend directory and run:
```bash
npm test
```

### Frontend

To run the frontend unit tests, navigate to the frontend directory and run:
```bash
ng test
```

## Contributing

If you would like to contribute to this project, please follow these steps:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Authors and Acknowledgments

Thanks to everyone who has contributed to this project.

## Project Status

The project is currently under active development. Updates and improvements are regularly made.