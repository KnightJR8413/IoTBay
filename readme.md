# IoTBay
#### A UTS Project

An e-commerce plaftorm built ising Node.js, Flask, SQLite, and Python. this was made of a assessment at UTS in the subject Introduction to Software development

## Table of Contents
1. Installation
2. Setup
3. Frontend
4. Backend
5. API


## Installation
### Prerequisites
Before you begin, ensure you have the following installed:
* Node.js and npm (for backend dependencies)
* Python (for running the Flask frontend)
* SQLite (for the database)

### Install Dependencies
1. install Node.js dependencies
    * install Node.js dependencies
    ```bash
    npm install
    ```
2. install python dependencies
    * navigate to root project folder
    * create virtual environment (first time, optional)
    ``` bash
    python3 -m venv venv 
    .\venv\Scripts\activate  # Windows
    source venv/bin/activate  # Mac/Linux
    ```
    * install python dependencies
    ``` bash
    pip install -r requirements.txt  # Install required Python packages 
    ```


## Setup and Usage
### Start backend and front end
1. start backend
    * in the terminal navigate to backend folder
    * run 
    ```bash
    node backend.js
    ```
2. start frontend
    * navigate to root project folder
    * run webserver.py
    ```bash
    py webserver.py
    ```

### Access the apllication
In your browser you can access the application 
    * localhost:5000 (local machine)
    * 127.0.0.1:5000 (local machine)
    * *ip*:5000 (any machine on the network)

## Frontend
* The frontend is built using Flask and serves HTML pages.
* All frontend assets (CSS, images, scripts) are in the WebPages/html directory.

## Backend
The backend is built using Node.js and SQLite.
API endpoints handle user registration, login, and product management.
The backend server runs on port 3000 by default.

### Endpoints
POST /register: Registers a new user.
POST /login: Logs a user in and returns a JWT token.
GET /check-session: checks if a user is logged in
/logout: currently not used but is there if needed for future application

## API
### Authentication
* Register User: Sends user data (email, first name, surname, password) and creates a new user with encrypted password stored in SQLite.
* Login: Accepts email and password, generates and returns a JWT token if successful.






### How to Run the website (Currently)
#### Mac
*Note: python3 in command could also be 'py' or 'python'*
1. open terminal
2. run the command python3 -m venv venv
3. run source venv/bin/activate
4. pip install flask (python3 -m pip install flask if it doesnt work)
5. make sure the venv folder is outside the Webpages folder
6. run webserver.py (webserverlocalhost.py if you only want local host)
7. terminal will print to make sure it runs
8. go to 127.0.0.1:5000 or localhost:5000 for local connection
9. go to your *IP*:5000 as shown in terminal for online connection, this can be done from other devices too

#### Windows
*Note: python3 in command could also be 'py' or 'python'*
1. open terminal
2. make sure flask is installed using python3 -m pip install flask or pip install flask if pip is already installed
3. run webserver.py (webserverlocalhost.py if you only want local host)
4. terminal will print to make sure it runs
5. go to 127.0.0.1:5000 or localhost:5000 for local connection
6. go to your *IP*:5000 as shown in terminal for online connection, this can be done from other devices too