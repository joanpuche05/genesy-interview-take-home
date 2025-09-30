# Genesy AI Lead Management System

A full-stack TypeScript application for managing leads with features for data import, enrichment, and message generation. Built with React, Express.js, and Prisma.

## Features

- **Lead Management**: Create, read, update, and delete leads with detailed information
- **CSV Import**: Bulk import leads from CSV files with validation and error reporting
- **Gender Prediction**: Automatically guess gender using the Genderize.io API
- **Message Generation**: Create personalized messages using customizable templates
- **Bulk Operations**: Select multiple leads for batch operations (delete, enrich, message)
- **Import Tracking**: Detailed reports for CSV imports with error logging

## Tech Stack

### Backend
- **Express.js** - RESTful API server
- **Prisma ORM** - Database management with SQLite
- **TypeScript** - Type safety and better development experience
- **Multer** - File upload handling for CSV imports
- **csv-parser** - CSV file processing

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe frontend development
- **TanStack Query** - Data fetching, caching, and synchronization
- **Vite** - Fast development server and build tool
- **Axios** - HTTP client for API communication

### Database
- **SQLite** - Lightweight database for development
- **Prisma** - Type-safe database client and migrations

## Project Structure

```
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── app.ts          # Main application logic and routes
│   │   └── index.ts        # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── dev.db          # SQLite database file
│   ├── tests/              # Backend tests
│   └── uploads/            # Temporary file uploads
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api/           # API client and types
│   │   └── App.tsx        # Main application component
│   └── dist/              # Built frontend assets
└── docs/                  # Sample CSV files and documentation
```

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd interview-take-home-c-main
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up the database**
   ```bash
   cd ../backend
   npx prisma migrate dev
   npx prisma generate
   ```

### Running the Application

1. **Start the backend server** (in one terminal)
   ```bash
   cd backend
   npm run dev
   ```
   The API server will start on `http://localhost:4000`

2. **Start the frontend development server** (in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   The React app will start on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

## API Endpoints

### Lead Management
- `GET /leads` - Get all leads
- `GET /leads/:id` - Get a specific lead
- `POST /leads` - Create a new lead
- `PATCH /leads/:id` - Update a lead
- `DELETE /leads/:id` - Delete a lead
- `POST /leads/bulk-delete` - Delete multiple leads

### Lead Enrichment
- `POST /leads/guess-gender` - Predict gender using Genderize.io API
- `POST /leads/generate-messages` - Generate personalized messages

### CSV Import
- `POST /leads/import-csv` - Import leads from CSV file

## Development Commands

### Backend
```bash
cd backend
npm run dev        # Start development server with hot reload
npm run build      # Compile TypeScript to JavaScript
npm start          # Run production build
npm run format     # Format code with Prettier
npm test           # Run tests
npm run test:watch # Run tests in watch mode
```

### Frontend
```bash
cd frontend
npm run dev        # Start Vite development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Database
```bash
cd backend
npx prisma studio     # Open database GUI
npx prisma migrate dev # Create and apply new migration
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema changes without migration
```

## Testing

### Backend Tests
The backend includes comprehensive test coverage with Jest and Supertest:

```bash
cd backend
npm test                # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

Test files are located in `backend/tests/` and cover:
- API endpoint functionality
- CSV import validation
- Error handling
- Database operations

## Debugging

### Backend Debugging
1. **Check server logs**: The development server logs all requests and errors
2. **Database inspection**: Use `npx prisma studio` to view database contents
3. **API testing**: Use tools like Postman or curl to test endpoints directly

### Frontend Debugging
1. **React Developer Tools**: Install the browser extension for component inspection
2. **TanStack Query DevTools**: Included in development mode for query debugging
3. **Console logs**: Check browser console for errors and warnings
4. **Network tab**: Monitor API requests and responses

## CSV Import Format

The application expects CSV files with the following headers:
- `firstName` (required)
- `lastName` (required)
- `email` (required)
- `jobTitle` (optional)
- `countryCode` (optional)
- `companyName` (optional)
- `gender` (optional)

Sample CSV files are available in the `docs/` directory.