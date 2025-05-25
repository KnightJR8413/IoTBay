# IoTBay
#### A UTS Project

An e-commerce platform built using Node.js, Flask, SQLite, and Python. this was made of a assessment at UTS in the subject Introduction to Software development

## Table of Contents
1. Installation
2. Setup
3. Frontend
4. Backend


## Installation
### Prerequisites
Before you begin, ensure you have the following installed:
* Node.js and npm (for backend dependencies)
* Python (for running the Flask frontend)
* SQLite (for the database)

### Install Dependencies
*Note: all these commands should be run in the root project directory*
1. install Node.js dependencies
    * install Node.js dependencies
    ```bash
    npm install
    ```
2. install python dependencies
    * create virtual environment (first time, optional)
    ``` bash
    py -m venv venv #windows
    python -m venv venv #any system where python3 is default
    python3 -m venv venv #systems where python3 is installed alongside python2
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
    py webserver.py #windows
    python webserver.py #any system where python3 is default
    python3 webserver.py #systems where python3 is installed alongside python2
    ```

### Access the application
In your browser you can access the application 
* localhost:5000 (local machine)
* 127.0.0.1:5000 (local machine)
* *ip*:5000 (any machine on the network)

## Frontend
* The frontend is built using Flask and serves HTML pages.
* All frontend assets (CSS, images, scripts) are in the WebPages/html directory.

## Backend
* The backend is built using Node.js and SQLite.
* API endpoints handle user registration, login, and product management.
* The backend server runs on port 3000 by default.

### Endpoints
1. POST
    * POST /register: Registers a new user.
    * POST /login: Logs a user in and returns a JWT token.
    * POST /update-customer: Updates customer information
    * POST /admin/users: adds user into table with default password
    * POST /products: create a product
    * POST /cart: add to cart
    * POST /update-cart: save order
    * POST /order/:orderId/copy-to-cart: copy items for order to cart
    * POST /newsletter: adds user to marketing list
    * POST /logout: currently not used but is there if needed for future application
    * POST /payments: inserts payment information into database

2. GET
    * GET /user-details: get the users details
    * GET /user-logs: gets the login and logout logs for a user
    * GET /check-session: checks if a user is logged in
    * GET /admin/users: get a list of all non admin users
    * GET /admin/users/:id: get specific user information
    * GET /products: gets all products
    * GET /product/:id: get single product
    * GET /cart: get cart
    * GET /order-history: gets order history
    * GET /orders/:orderId/items: get items for specific order
    * GET /payments: gets all payment methods for logged in user

3. DELETE
    * DELETE /delete-account: deletes all user information but keeps their user ID in the system
    * DELETE /product/:id: delete product completely
    * DELETE /admin/users/:id: deletes user from table completely
    * DELETE /cart: remove item from cart
    * DELETE /orders/:id: delete order completely
    * DELETE /payments/:id: delete payment method

4. PUT
    * PUT /admin/users/:id: updates user details
    * PUT /admin/users/:id/status: toggles account as active/inactive
    * PUT /product/:id: update product information
    * PUT /payments/:id: edit payment method
