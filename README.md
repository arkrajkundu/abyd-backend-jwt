# ABYD Backend

Welcome to the ABYD Backend repository! This project is responsible for the server-side functionality of the ABYD application. Follow the steps below to get started with running the backend locally on your machine.

## Prerequisites

Before you begin, ensure that you have the following installed:

- [Node.js](https://nodejs.org/) (version 14.x or higher)
- [npm](https://www.npmjs.com/) (Node Package Manager, typically installed with Node.js)
- A running database (such as MongoDB) depending on the backend configuration.

## Steps to Run the Backend

1. **Clone the Repository**

   First, you need to clone the ABYD Backend repository to your local machine. Run the following command in your terminal:

   ```bash
   git clone <repository-url>
   ```

   Replace `<repository-url>` with the actual URL of the ABYD backend repository.

2. **Navigate to the Project Directory**

   After cloning the repository, move into the `abyd-backend-jwt` directory:

   ```bash
   cd abyd-backend-jwt
   ```

3. **Install Dependencies**

   To install the necessary dependencies for the project, run:

   ```bash
   npm install
   ```

   This will install all the required libraries and packages listed in the `package.json` file.

4. **Run the Backend Server**

   Once the dependencies are installed, you can start the backend server by running:

   ```bash
   node app.js
   ```

   This will start the backend server on PORT 8000, and the application will be accessible at `http://localhost:5000` (or any other port specified in your configuration).