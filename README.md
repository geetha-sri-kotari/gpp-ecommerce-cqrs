# GPP E-Commerce CQRS Implementation

## Project Overview

This project demonstrates the implementation of the CQRS (Command Query Responsibility Segregation) pattern using Node.js, RabbitMQ, and Docker.

The system is divided into two main services:

* Command Service (handles write operations)
* Query Service (handles read operations)

RabbitMQ is used as the message broker to transfer events from the Command service to the Query service. Each service maintains its own database as per CQRS architecture.

---

## Architecture

The architecture follows the CQRS pattern:

Client → Command Service → RabbitMQ → Query Service → Read Database

### Components:

1. Command Service

   * Accepts POST requests
   * Writes data to write database
   * Publishes event to RabbitMQ

2. RabbitMQ

   * Acts as message broker
   * Sends events from Command to Query service

3. Query Service

   * Listens to RabbitMQ events
   * Updates read database
   * Handles GET requests

4. Docker Compose

   * Runs all services together
   * Manages networking between containers

---

## Technologies Used

* Node.js
* Express.js
* RabbitMQ
* Docker
* Docker Compose
* PostgreSQL / MongoDB (depending on configuration)

---

## How to Run the Project

1. Clone the repository

2. Navigate to the project directory

3. Run:

   docker compose up --build

4. Check running containers:

   docker ps

5. RabbitMQ Management UI:

   [http://localhost:15672](http://localhost:15672)
   Default credentials:

   * Username: guest
   * Password: guest

---

## API Endpoints

### Command Service

POST /orders
Creates a new order and publishes an event to RabbitMQ.

Example body:
{
"productName": "Laptop",
"price": 50000
}

---

### Query Service

GET /orders
Returns the list of orders from the read database.

---

## What is Working

* Docker containers start successfully
* RabbitMQ exchange and queues are created
* POST request successfully sends event to RabbitMQ
* Query service consumes messages
* GET endpoint returns stored data

---

## Challenges Faced

* RabbitMQ connection issues inside Docker network
* Handling asynchronous message consumption
* Debugging container crashes
* Understanding separation between write and read databases

---

## Learning Outcomes

Through this project, I understood:

* How CQRS architecture works in real systems
* How message brokers enable service communication
* How Docker Compose manages multiple services
* The importance of separating read and write responsibilities
* Basic debugging of distributed systems

---

## Conclusion

This project helped me understand event-driven architecture and microservices communication using RabbitMQ. Implementing CQRS practically gave me clarity on how large-scale systems separate command and query responsibilities for better scalability and maintainability.
