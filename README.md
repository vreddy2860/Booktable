Team Titans

Members:
- Pooja Sindham
- Divyasri Lakshmi Alekhya Nakka
- Viswa Kumar Suvvada
- Teja Mareddy

# BookTableBuddy

BookTableBuddy is a comprehensive restaurant table booking application that connects diners with restaurants, providing an easy-to-use platform for making, managing, and tracking reservations.

## Project Overview

BookTableBuddy is designed to streamline the restaurant reservation process, offering features for three main user roles:
- **Customers**: Search for restaurants, make reservations, manage bookings, and leave reviews
- **Restaurant Managers**: Manage restaurant profiles, tables, reservation schedules, and customer bookings
- **Administrators**: Oversee the platform, approve restaurant registrations, and view system analytics

## Features

### Customer Features
- User registration and authentication
- Restaurant search with filters (location, cuisine, date, time, party size)
- Table reservation at available time slots
- Reservation management (view, modify, cancel)
- Post-dining review submission
- User profile management

### Restaurant Manager Features
- Restaurant registration and profile management
- Table configuration and management
- Reservation management dashboard
- Daily reservation schedule view
- Customer reservation tracking
- Restaurant analytics dashboard

### Admin Features
- User management
- Restaurant approval process
- System-wide analytics
- Platform monitoring

## Technology Stack

### Frontend
- **Framework**: React.js
- **State Management**: Context API
- **Styling**: Tailwind CSS
- **Routing**: React Router

### Backend
- **Framework**: Django & Django REST Framework
- **API**: RESTful API endpoints
- **Authentication**: JWT (JSON Web Tokens)

### Database
- **DBMS**: PostgreSQL
- **Schema**: Relational database design for users, restaurants, bookings, and reviews

## Architecture

BookTableBuddy follows a modern client-server architecture with:
- **Presentation Layer**: React.js frontend with responsive design
- **Application Layer**: Django backend with RESTful API
- **Data Layer**: PostgreSQL database

The component and deployment diagrams are available in the Diagrams directory.

## User Interface

The application features a clean, intuitive user interface designed for ease of use across different devices. Key screens include:

- Home Page with search functionality
- Restaurant search results
- Restaurant details page
- Reservation booking interface
- User dashboards (customer, restaurant, admin)
- Authentication screens

## Installation and Setup

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- PostgreSQL

### Frontend Setup
```bash
# Navigate to frontend directory
cd BookTableBuddy/frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Backend Setup
```bash
# Navigate to backend directory
cd BookTableBuddy/backend

# Install Python dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

## API Documentation

The application exposes several RESTful API endpoints for:
- User authentication and management
- Restaurant data
- Reservation booking and management
- Reviews
- Analytics


## Design Decisions

### Authentication Strategy
- JWT-based authentication for secure, stateless user sessions
- Role-based access control for three distinct user types

### Database Design
- Normalized relational database schema to maintain data integrity
- Efficient indexing for common queries like restaurant searches and reservation lookups

### User Experience
- Mobile-responsive design to accommodate users on various devices
- Intuitive reservation flow minimizing steps to complete a booking
- Real-time availability updates to prevent double bookings

### Security Considerations
- Password hashing and secure credential storage
- Data validation on both client and server sides



