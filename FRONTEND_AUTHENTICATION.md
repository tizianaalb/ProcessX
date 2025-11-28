# Frontend Authentication Implementation

## Overview

The ProcessX frontend has been implemented with a complete authentication system that integrates with the backend API. This document outlines the implementation details and usage instructions.

## Architecture

### Tech Stack
- **React 18.3**: UI framework
- **TypeScript**: Type safety
- **React Router v6**: Client-side routing
- **Tailwind CSS**: Styling framework
- **shadcn/ui**: Component library
- **Vite**: Build tool and dev server

### Key Components

#### 1. API Client (`src/lib/api.ts`)
Type-safe API client for communication with the backend:

```typescript
class ApiClient {
  private baseURL: string;

  async register(data: RegisterData): Promise<AuthResponse>
  async login(data: LoginData): Promise<AuthResponse>
  async getCurrentUser(): Promise<{ user: User }>
}
```

**Features:**
- Automatic JWT token attachment from localStorage
- JSON request/response handling
- Error handling with descriptive messages
- Type-safe request and response interfaces

#### 2. Auth Context (`src/contexts/AuthContext.tsx`)
Global authentication state management using React Context:

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

**Features:**
- Persistent authentication via localStorage
- Token verification on app mount
- Automatic token refresh on page reload
- User session management

#### 3. Protected Route Component (`src/components/ProtectedRoute.tsx`)
Route wrapper that restricts access to authenticated users:

```typescript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

**Features:**
- Redirects unauthenticated users to `/login`
- Shows loading spinner during auth verification
- Seamless navigation after authentication

#### 4. UI Components

**Button Component** (`src/components/ui/button.tsx`):
- Variants: default, destructive, outline, secondary, ghost, link
- Sizes: default, sm, lg, icon
- Built with class-variance-authority for type-safe variants
- Accessible by default (Radix UI primitives)

**Input Component** (`src/components/ui/input.tsx`):
- Consistent styling across all forms
- Focus states with ring indicators
- Disabled state styling
- File input support

### Pages

#### Login Page (`src/pages/Login.tsx`)
**Route:** `/login`

**Features:**
- Email and password authentication
- Form validation
- Error message display
- Loading states
- Link to registration page

**Form Fields:**
- Email (required, type: email)
- Password (required, type: password)

**User Flow:**
1. User enters email and password
2. Form validates input
3. API request sent to backend
4. On success: Token stored, user redirected to `/dashboard`
5. On error: Error message displayed

#### Register Page (`src/pages/Register.tsx`)
**Route:** `/register`

**Features:**
- Multi-field registration form
- Real-time form validation
- Password requirements display
- Organization creation
- Error handling
- Link to login page

**Form Fields:**
- First Name (required)
- Last Name (required)
- Email (required, validated)
- Organization Name (required)
- Password (required, validated)

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**User Flow:**
1. User fills registration form
2. Client-side validation runs
3. API request creates organization and user
4. Admin role assigned automatically
5. JWT token returned and stored
6. User redirected to `/dashboard`

#### Dashboard Page (`src/pages/Dashboard.tsx`)
**Route:** `/dashboard`

**Features:**
- User welcome message
- Statistics cards (processes, pain points, optimizations)
- Quick action buttons (currently disabled - Phase 2)
- Logout functionality
- Responsive layout

**Statistics Displayed:**
- Total Processes: 0 (placeholder)
- Pain Points: 0 (placeholder)
- Optimizations: 0 (placeholder)

**Navigation:**
- ProcessX branding
- User name display
- Sign out button

## Routing Structure

```
/ → Redirects to /dashboard
/login → Login Page (public)
/register → Register Page (public)
/dashboard → Dashboard Page (protected)
* → Redirects to /dashboard
```

### Route Protection Flow

1. User navigates to protected route
2. `ProtectedRoute` checks `isAuthenticated` status
3. If authenticated: Render page
4. If not authenticated: Redirect to `/login`
5. If loading: Show loading spinner

## Authentication Flow

### Registration Flow
```
User fills form
    ↓
Frontend validates input
    ↓
POST /api/auth/register
    ↓
Backend creates organization
    ↓
Backend creates user with admin role
    ↓
Backend returns JWT + user data
    ↓
Frontend stores token in localStorage
    ↓
Frontend updates AuthContext state
    ↓
Redirect to /dashboard
```

### Login Flow
```
User enters credentials
    ↓
Frontend validates input
    ↓
POST /api/auth/login
    ↓
Backend verifies credentials
    ↓
Backend returns JWT + user data
    ↓
Frontend stores token in localStorage
    ↓
Frontend updates AuthContext state
    ↓
Redirect to /dashboard
```

### Logout Flow
```
User clicks Sign Out
    ↓
Frontend removes token from localStorage
    ↓
Frontend clears AuthContext state
    ↓
Redirect to /login
```

### Session Persistence Flow
```
User opens application
    ↓
AuthProvider checks localStorage for token
    ↓
If token exists:
  ├─→ GET /api/auth/me with token
  ├─→ If valid: Set user state
  └─→ If invalid: Clear token
    ↓
If no token:
  └─→ User remains unauthenticated
```

## Environment Configuration

### Environment Variables
Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3100
```

**Note:** Vite requires all environment variables to be prefixed with `VITE_`

## API Integration

### Base URL
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';
```

### Request Headers
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}` // Auto-attached if token exists
}
```

### API Endpoints Used

**POST /api/auth/register**
```typescript
Request: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

Response: {
  message: string;
  token: string;
  user: User;
  organization: Organization;
}
```

**POST /api/auth/login**
```typescript
Request: {
  email: string;
  password: string;
}

Response: {
  message: string;
  token: string;
  user: User;
}
```

**GET /api/auth/me**
```typescript
Headers: {
  Authorization: Bearer <token>
}

Response: {
  user: User;
}
```

## Type Definitions

### User Type
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}
```

### Organization Type
```typescript
interface Organization {
  id: string;
  name: string;
}
```

### Auth Response Type
```typescript
interface AuthResponse {
  message: string;
  token: string;
  user: User;
  organization?: Organization;
}
```

## Running the Frontend

### Development Server
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5100`

### Build for Production
```bash
npm run build
```

Output will be in `dist/` directory

### Preview Production Build
```bash
npm run preview
```

## Security Considerations

### Token Storage
- JWT tokens stored in localStorage
- Tokens automatically attached to authenticated requests
- Tokens removed on logout

### Password Security
- Client-side validation enforces strong passwords
- Server-side hashing with bcrypt (10 salt rounds)
- Passwords never stored in plain text

### Protected Routes
- All sensitive routes wrapped in `ProtectedRoute`
- Automatic redirect to login if unauthenticated
- Token verification on every protected request

### CORS Configuration
Backend must be configured to allow requests from frontend origin:
```typescript
// Backend CORS config needed
app.use(cors({
  origin: 'http://localhost:5100', // Frontend dev server
  credentials: true
}));
```

## Error Handling

### Form Validation Errors
- Displayed inline below form fields
- Red background with error text
- User-friendly error messages

### API Errors
- Network errors caught and displayed
- 401 Unauthorized: Token invalid/expired
- 400 Bad Request: Validation errors
- 500 Server Error: Backend issues

### Example Error Display
```typescript
{error && (
  <div className="rounded-md bg-red-50 p-4">
    <div className="text-sm text-red-700">{error}</div>
  </div>
)}
```

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx        # Reusable button component
│   │   │   └── input.tsx         # Reusable input component
│   │   └── ProtectedRoute.tsx    # Route protection wrapper
│   ├── contexts/
│   │   └── AuthContext.tsx       # Global auth state
│   ├── lib/
│   │   ├── api.ts                # API client
│   │   └── utils.ts              # Utility functions (cn helper)
│   ├── pages/
│   │   ├── Login.tsx             # Login page
│   │   ├── Register.tsx          # Registration page
│   │   └── Dashboard.tsx         # Dashboard page
│   ├── App.tsx                   # Main app with routing
│   ├── App.css                   # App styles
│   ├── index.css                 # Global styles + Tailwind
│   └── main.tsx                  # App entry point
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript config
└── vite.config.ts                # Vite config
```

## Next Steps

The authentication system is now complete. Future phases will add:

**Phase 2: Process Mapping**
- Interactive process visualization with ReactFlow
- Process step creation and editing
- Connection management
- Process templates

**Phase 3: Pain Point Analysis**
- AI-powered pain point detection
- Manual pain point annotation
- Pain point categorization
- Impact analysis

**Phase 4: Optimization & Export**
- Target process generation
- AI-powered recommendations
- PowerPoint export
- PDF, Excel, Word exports

## Testing the Authentication

### Manual Testing Steps

1. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Registration:**
   - Navigate to `http://localhost:5100/register`
   - Fill in all fields
   - Click "Create account"
   - Verify redirect to dashboard
   - Check localStorage for `auth_token`

4. **Test Logout:**
   - Click "Sign out" button
   - Verify redirect to login
   - Verify token removed from localStorage

5. **Test Login:**
   - Navigate to `http://localhost:5100/login`
   - Enter registered credentials
   - Click "Sign in"
   - Verify redirect to dashboard

6. **Test Protected Routes:**
   - Log out
   - Try to access `http://localhost:5100/dashboard`
   - Verify redirect to login

7. **Test Session Persistence:**
   - Log in
   - Refresh the page
   - Verify you remain logged in
   - Verify user data displayed

## Troubleshooting

### Common Issues

**Issue: "Failed to fetch" error**
- **Cause:** Backend server not running or CORS issue
- **Solution:** Start backend server and configure CORS

**Issue: Token stored but user not authenticated**
- **Cause:** Invalid or expired token
- **Solution:** Clear localStorage and login again

**Issue: Redirect loop on dashboard**
- **Cause:** AuthContext not properly initialized
- **Solution:** Check console for errors, verify AuthProvider wraps routes

**Issue: Styles not loading**
- **Cause:** Tailwind not processing CSS
- **Solution:** Ensure `npm run dev` is running, check tailwind.config.js

## Dependencies

### Core Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.28.0"
}
```

### UI Dependencies
```json
{
  "@radix-ui/react-slot": "^1.1.1",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0"
}
```

### Development Dependencies
```json
{
  "@vitejs/plugin-react": "^4.3.4",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.49",
  "tailwindcss": "^3.4.17",
  "typescript": "~5.6.2",
  "vite": "^6.0.1"
}
```

## Summary

The frontend authentication system provides:
- ✅ Complete user registration with organization creation
- ✅ Secure login with JWT tokens
- ✅ Session persistence across page refreshes
- ✅ Protected route system
- ✅ Clean, responsive UI with Tailwind CSS
- ✅ Type-safe API integration
- ✅ Comprehensive error handling
- ✅ User-friendly forms and validation

The system is ready for integration with the process mapping features in the next development phase.
