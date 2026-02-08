# Manual Testing Guide - Frontend UI & UX

**Feature**: 003-frontend-ui
**Date**: 2026-02-07
**Status**: Ready for Testing
**Servers Running**:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

## Prerequisites

✅ Backend server running on port 8000
✅ Frontend server running on port 3000
✅ Neon PostgreSQL database connected
✅ Environment variables configured

## Testing Instructions

Open your browser and navigate to http://localhost:3000 to begin testing.

---

## 1. Authentication Testing

### 1.1 User Signup

**Test Case**: Valid signup with strong password

1. Navigate to http://localhost:3000/signup
2. Enter email: `testuser@example.com`
3. Enter password: `TestPass123!@#` (12+ chars, letter, number, special char)
4. Click "Sign Up"

**Expected Result**:
- ✅ User account created successfully
- ✅ Redirected to /tasks page
- ✅ JWT token stored in httpOnly cookie
- ✅ User session active

**Test Case**: Invalid email format

1. Navigate to http://localhost:3000/signup
2. Enter email: `invalid-email`
3. Enter password: `TestPass123!@#`
4. Click "Sign Up"

**Expected Result**:
- ✅ Error message: "Invalid email format"
- ✅ Form not submitted
- ✅ User remains on signup page

**Test Case**: Weak password

1. Navigate to http://localhost:3000/signup
2. Enter email: `testuser2@example.com`
3. Enter password: `weak` (less than 12 chars)
4. Click "Sign Up"

**Expected Result**:
- ✅ Error message: "Password must be at least 12 characters and contain letters, numbers, and special characters"
- ✅ Form not submitted
- ✅ User remains on signup page

**Test Case**: Duplicate email

1. Navigate to http://localhost:3000/signup
2. Enter email: `testuser@example.com` (already registered)
3. Enter password: `TestPass123!@#`
4. Click "Sign Up"

**Expected Result**:
- ✅ Error message: "Email already registered" or similar
- ✅ User remains on signup page

---

### 1.2 User Signin

**Test Case**: Valid credentials

1. Navigate to http://localhost:3000/signin
2. Enter email: `testuser@example.com`
3. Enter password: `TestPass123!@#`
4. Click "Sign In"

**Expected Result**:
- ✅ Authentication successful
- ✅ Redirected to /tasks page
- ✅ JWT token stored in httpOnly cookie
- ✅ User session active

**Test Case**: Invalid credentials

1. Navigate to http://localhost:3000/signin
2. Enter email: `testuser@example.com`
3. Enter password: `WrongPassword123!`
4. Click "Sign In"

**Expected Result**:
- ✅ Error message: "Invalid credentials" or similar
- ✅ User remains on signin page
- ✅ No token stored

**Test Case**: Non-existent user

1. Navigate to http://localhost:3000/signin
2. Enter email: `nonexistent@example.com`
3. Enter password: `TestPass123!@#`
4. Click "Sign In"

**Expected Result**:
- ✅ Error message: "Invalid credentials" or similar
- ✅ User remains on signin page

---

### 1.3 Route Protection

**Test Case**: Access protected route without authentication

1. Open a new incognito/private browser window
2. Navigate directly to http://localhost:3000/tasks

**Expected Result**:
- ✅ Redirected to /signin page
- ✅ Cannot access /tasks without authentication

**Test Case**: Access auth pages when already authenticated

1. Sign in successfully
2. Navigate to http://localhost:3000/signin

**Expected Result**:
- ✅ Redirected to /tasks page (already authenticated)

---

### 1.4 User Signout

**Test Case**: Signout functionality

1. Sign in successfully
2. Navigate to /tasks page
3. Click "Sign Out" button

**Expected Result**:
- ✅ Session cleared
- ✅ JWT token removed from cookies
- ✅ Redirected to /signin page
- ✅ Cannot access /tasks without signing in again

---

## 2. Task Management Testing

### 2.1 View Tasks

**Test Case**: Empty task list

1. Sign in with a new user account
2. Navigate to /tasks page

**Expected Result**:
- ✅ Empty state displayed
- ✅ Message: "No tasks yet. Create your first task!"
- ✅ "Add Task" button visible

**Test Case**: View existing tasks

1. Sign in with user that has tasks
2. Navigate to /tasks page

**Expected Result**:
- ✅ All user's tasks displayed
- ✅ Each task shows: title, description (if any), completion status
- ✅ Edit and Delete buttons visible for each task

---

### 2.2 Create Task

**Test Case**: Create task with title only

1. Sign in and navigate to /tasks
2. Click "Add Task" button
3. Enter title: "Buy groceries"
4. Leave description empty
5. Click "Create Task"

**Expected Result**:
- ✅ Task created successfully
- ✅ Task appears in task list
- ✅ Task shows title "Buy groceries"
- ✅ Task marked as incomplete (unchecked)
- ✅ Form cleared after creation

**Test Case**: Create task with title and description

1. Click "Add Task" button
2. Enter title: "Complete project report"
3. Enter description: "Finish the Q4 project report and submit to manager"
4. Click "Create Task"

**Expected Result**:
- ✅ Task created successfully
- ✅ Task appears in task list
- ✅ Task shows both title and description
- ✅ Task marked as incomplete

**Test Case**: Create task without title (validation)

1. Click "Add Task" button
2. Leave title empty
3. Enter description: "Some description"
4. Click "Create Task"

**Expected Result**:
- ✅ Validation error: "Title is required"
- ✅ Task not created
- ✅ Form remains open with entered data

---

### 2.3 Edit Task

**Test Case**: Edit task title

1. Click "Edit" button on an existing task
2. Change title to: "Buy groceries and cook dinner"
3. Click "Save"

**Expected Result**:
- ✅ Task updated successfully
- ✅ New title displayed in task list
- ✅ Edit form closed
- ✅ Changes persisted (refresh page to verify)

**Test Case**: Edit task description

1. Click "Edit" button on a task
2. Change description to: "Updated description text"
3. Click "Save"

**Expected Result**:
- ✅ Task updated successfully
- ✅ New description displayed
- ✅ Changes persisted

**Test Case**: Cancel edit

1. Click "Edit" button on a task
2. Make changes to title
3. Click "Cancel"

**Expected Result**:
- ✅ Changes discarded
- ✅ Original task data unchanged
- ✅ Edit form closed

---

### 2.4 Toggle Task Completion

**Test Case**: Mark task as complete

1. Click checkbox next to an incomplete task

**Expected Result**:
- ✅ Task marked as complete
- ✅ Visual indication (strikethrough, checkmark, or color change)
- ✅ Status persisted (refresh page to verify)

**Test Case**: Mark task as incomplete

1. Click checkbox next to a completed task

**Expected Result**:
- ✅ Task marked as incomplete
- ✅ Visual indication removed
- ✅ Status persisted

---

### 2.5 Delete Task

**Test Case**: Delete task with confirmation

1. Click "Delete" button on a task
2. Confirmation dialog appears
3. Click "Confirm" or "Delete"

**Expected Result**:
- ✅ Confirmation dialog displayed
- ✅ Task deleted successfully
- ✅ Task removed from list
- ✅ Deletion persisted (refresh page to verify)

**Test Case**: Cancel delete

1. Click "Delete" button on a task
2. Confirmation dialog appears
3. Click "Cancel"

**Expected Result**:
- ✅ Task not deleted
- ✅ Task remains in list
- ✅ Dialog closed

---

## 3. Responsive Design Testing

### 3.1 Mobile View (320px - 480px)

**Test Instructions**:
1. Open browser DevTools (F12)
2. Enable responsive design mode
3. Set viewport to 375px width (iPhone SE)

**Test Cases**:

- ✅ Landing page displays correctly
- ✅ Signin form is readable and usable
- ✅ Signup form is readable and usable
- ✅ Task list displays in single column
- ✅ Task cards stack vertically
- ✅ Buttons are touch-friendly (min 44x44px)
- ✅ No horizontal scrolling
- ✅ Text is readable without zooming
- ✅ Forms are easy to fill on mobile
- ✅ Navigation is accessible

---

### 3.2 Tablet View (768px - 1024px)

**Test Instructions**:
1. Set viewport to 768px width (iPad)

**Test Cases**:

- ✅ Layout adapts to tablet size
- ✅ Task list displays appropriately
- ✅ Forms are well-proportioned
- ✅ Buttons and interactive elements are appropriately sized
- ✅ No wasted space
- ✅ Content is centered or well-aligned

---

### 3.3 Desktop View (1920px+)

**Test Instructions**:
1. Set viewport to 1920px width (Full HD)

**Test Cases**:

- ✅ Layout uses available space effectively
- ✅ Content is not stretched too wide
- ✅ Task list is readable and organized
- ✅ Forms are appropriately sized (not too wide)
- ✅ Navigation is clear and accessible
- ✅ Visual hierarchy is maintained

---

## 4. Error Handling Testing

### 4.1 Network Errors

**Test Case**: Create task with backend offline

1. Stop the backend server (Ctrl+C in backend terminal)
2. Try to create a new task

**Expected Result**:
- ✅ User-friendly error message displayed
- ✅ Message: "Unable to connect to server. Please try again."
- ✅ Task not created
- ✅ Form data preserved

**Test Case**: Retry after backend restart

1. Restart backend server
2. Click "Create Task" again

**Expected Result**:
- ✅ Task created successfully
- ✅ Application recovers gracefully

---

### 4.2 Session Expiration

**Test Case**: Token expiration handling

1. Sign in successfully
2. Wait for token to expire (JWT_EXPIRATION = 3600 seconds = 1 hour)
   - OR manually delete the auth cookie in browser DevTools
3. Try to create a task

**Expected Result**:
- ✅ Error message: "Session expired. Please sign in again."
- ✅ Redirected to /signin page
- ✅ User must authenticate again

---

### 4.3 Multi-User Data Isolation

**Test Case**: Verify users can only see their own tasks

1. Sign in as User A
2. Create 3 tasks
3. Sign out
4. Sign in as User B
5. Navigate to /tasks

**Expected Result**:
- ✅ User B sees empty task list (or only their own tasks)
- ✅ User B cannot see User A's tasks
- ✅ Data isolation enforced

**Test Case**: Attempt to access another user's task (security test)

1. Sign in as User A
2. Create a task and note its ID (check network tab)
3. Sign out
4. Sign in as User B
5. Try to access User A's task via direct API call or URL manipulation

**Expected Result**:
- ✅ 403 Forbidden or 404 Not Found error
- ✅ User B cannot access User A's task
- ✅ Security enforced at API level

---

## 5. Browser Compatibility Testing

Test the application in the following browsers:

### Chrome (Latest)
- ✅ All features work correctly
- ✅ UI renders properly
- ✅ No console errors

### Firefox (Latest)
- ✅ All features work correctly
- ✅ UI renders properly
- ✅ No console errors

### Safari (Latest)
- ✅ All features work correctly
- ✅ UI renders properly
- ✅ No console errors

### Edge (Latest)
- ✅ All features work correctly
- ✅ UI renders properly
- ✅ No console errors

---

## 6. Performance Testing

### 6.1 Page Load Times

**Test Cases**:

- ✅ Landing page loads in < 2 seconds
- ✅ Signin page loads in < 2 seconds
- ✅ Tasks page loads in < 3 seconds
- ✅ No unnecessary re-renders
- ✅ Smooth transitions and animations

### 6.2 API Response Times

**Test Cases**:

- ✅ Task creation completes in < 1 second
- ✅ Task list fetch completes in < 1 second
- ✅ Task update completes in < 1 second
- ✅ Task deletion completes in < 1 second

---

## 7. Accessibility Testing

### 7.1 Keyboard Navigation

**Test Cases**:

- ✅ Can navigate entire app using Tab key
- ✅ Can submit forms using Enter key
- ✅ Can close dialogs using Escape key
- ✅ Focus indicators are visible
- ✅ Tab order is logical

### 7.2 Screen Reader Support

**Test Cases**:

- ✅ Form labels are properly associated
- ✅ Error messages are announced
- ✅ Button purposes are clear
- ✅ ARIA attributes used where appropriate

---

## Testing Checklist Summary

### Authentication
- [ ] Signup with valid credentials
- [ ] Signup with invalid email
- [ ] Signup with weak password
- [ ] Signup with duplicate email
- [ ] Signin with valid credentials
- [ ] Signin with invalid credentials
- [ ] Access protected route without auth
- [ ] Signout functionality

### Task Management
- [ ] View empty task list
- [ ] View existing tasks
- [ ] Create task with title only
- [ ] Create task with title and description
- [ ] Create task without title (validation)
- [ ] Edit task title
- [ ] Edit task description
- [ ] Cancel edit
- [ ] Toggle task completion
- [ ] Delete task with confirmation
- [ ] Cancel delete

### Responsive Design
- [ ] Mobile view (375px)
- [ ] Tablet view (768px)
- [ ] Desktop view (1920px)
- [ ] Touch-friendly buttons
- [ ] No horizontal scrolling

### Error Handling
- [ ] Network error during task creation
- [ ] Backend offline
- [ ] Session expiration
- [ ] Multi-user data isolation

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Performance
- [ ] Page load times acceptable
- [ ] API response times acceptable

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader support

---

## Reporting Issues

If you encounter any issues during testing, document:

1. **Test Case**: Which test case failed
2. **Steps to Reproduce**: Exact steps taken
3. **Expected Result**: What should have happened
4. **Actual Result**: What actually happened
5. **Browser/Device**: Browser and device used
6. **Screenshots**: If applicable
7. **Console Errors**: Any errors in browser console

---

## Next Steps After Testing

1. ✅ Complete all test cases above
2. ✅ Document any issues found
3. ✅ Fix critical issues
4. ✅ Re-test fixed issues
5. ✅ Mark T106 as complete in tasks.md
6. ✅ Verify all success criteria from spec.md (T107)
7. ✅ Create final PHR for implementation phase
8. ✅ Prepare for deployment

---

## Success Criteria Verification (T107)

After completing manual testing, verify these success criteria from spec.md:

- [ ] **SC1**: Users can sign up with email/password
- [ ] **SC2**: Users can sign in and receive JWT token
- [ ] **SC3**: Protected routes redirect unauthenticated users
- [ ] **SC4**: Users can create tasks with title and optional description
- [ ] **SC5**: Users can view their task list
- [ ] **SC6**: Users can edit existing tasks
- [ ] **SC7**: Users can delete tasks with confirmation
- [ ] **SC8**: Users can toggle task completion status
- [ ] **SC9**: UI is responsive on mobile, tablet, and desktop
- [ ] **SC10**: Error messages are user-friendly
- [ ] **SC11**: Multi-user data isolation enforced
- [ ] **SC12**: All features work without manual coding

---

**Testing Started**: [Date/Time]
**Testing Completed**: [Date/Time]
**Tested By**: [Your Name]
**Overall Status**: [ ] PASS / [ ] FAIL
