# BookTableBuddy Project Journal

This document contains our team's project progress, decisions, and reflections throughout the development of BookTableBuddy.

## Team Members

1. **Pooja** - Backend Development and cloud 
2. **Viswa** - Frontend Development
3. **Alekhya** - Frontend Development 
4. **Teja** - Cloud Infrastructure & Deployment

## Project Overview

BookTableBuddy is a comprehensive restaurant reservation platform that connects diners with restaurants. The system allows customers to search for restaurants, make reservations, and write reviews, while restaurant managers can manage their profiles and handle reservations.

## Architecture & Technology Stack

- **Frontend**: React
- **Backend**: Django, Django REST Framework
- **Database**: SQLite
- **Cloud Infrastructure**: AWS EC2, Nginx, Gunicorn
- **Notification Services**: SMTP (Email)
- **Authentication**: JWT (JSON Web Tokens)

## Sprint 1: Project Setup & Core Features (March 5 - March 19, 2025)

### Major Decisions

1. **Technology Stack Selection**: After evaluating different options, we decided to use Django for the backend due to its robust ORM and built-in admin interface. For the frontend, we chose React for its component-based architecture and widespread industry adoption.

2. **Database Design**: We established the core database schema including User, Restaurant, and Booking models. We decided to implement a comprehensive permission system with different user roles (customer, restaurant manager, administrator).

3. **Authentication Strategy**: We selected JWT for authentication due to its stateless nature and suitability for REST APIs.

### Achievements

- Successfully set up project structure and development environment
- Implemented user registration and authentication
- Created restaurant model and search functionality
- Established CI/CD pipeline

### Challenges

- Coordinating frontend and backend development
- Defining clear API contracts between frontend and backend teams
- Setting up proper development environments for all team members

## Sprint 2: Core Functionality (March 20 - April 2, 2025)

### Major Decisions

1. **Booking Workflow**: We designed a booking workflow with statuses (pconfirmed, canceled, completed) and established rules for transitions between states.

2. **UI Design System**: Decided to use Material-UI for consistent design language across the application.

3. **Image Storage**: Implemented media file storage for restaurant photos.

### Achievements

- Implemented restaurant listing and detail pages
- Created booking system with reservation form
- Developed restaurant management dashboard
- Set up database in cloud environment

### Challenges
- Managing file uploads and storage
- Implementing proper validation for booking requests

## Sprint 3: Enhanced Features (April 3 - April 16, 2025)


### Achievements

- Implemented booking history and cancellation
- Created review system
- Developed photo upload functionality
- Established admin dashboard
- Implemented favorites system

### Challenges

- Ensuring proper permissions for different user types
- Handling image optimization
- Maintaining code quality with growing codebase

## Sprint 4: Finalization & Deployment (April 17 - May 1, 2025)

### Major Decisions

1. **Notification Strategy**: Implemented  email for booking confirmations.

2. **Deployment Configuration**: Decided on Nginx as a reverse proxy with Gunicorn as the WSGI server for the Django application.

3. **Mobile Responsiveness**: Prioritized mobile-friendly design to support users on various devices.

### Achievements

- Implemented notification system (email)
- Optimized UI for mobile devices
- Created statistics dashboards
- Successfully deployed application to production

### Challenges

- Configuring the production environment
- Ensuring seamless deployment process
- Addressing performance optimization
- Implementing comprehensive testing

## Final Reflections

### What Went Well

- Strong cross-functional collaboration between team members
- Consistent progress throughout sprints
- Well-designed architecture that scaled with project needs
- Effective use of Agile methodologies

### Areas for Improvement

- More comprehensive automated testing
- Earlier focus on mobile responsiveness
- More user feedback throughout development
- Better estimation of complex tasks

### Technical Achievements

- Implementation of a comprehensive restaurant booking system
- Integration of external APIs (Twilio, email services)
- Development of a responsive, user-friendly interface
- Secure, scalable cloud deployment

### Lessons Learned

- The importance of clear communication and documentation
- Value of regular code reviews and knowledge sharing
- Benefits of iterative development and continuous feedback
- Significance of proper planning and architecture design before implementation