

### General Requirements

* Responsive layout for desktop and tablet.
* Sidebar navigation with collapsible menu.
* Top navigation bar showing:

  * Admin name
  * Current date/time
  * Notification icon
  * Profile menu
  * Logout
* Automatic logout after a period of inactivity.


## Dashboard Home

Display summary cards showing:

* Total registered users
* Total clients
* Total service providers
* Total administrators
* Verified providers
* Pending verification requests
* Active users today
* Suspended users
* Blocked users
* Total completed bookings
* Total pending bookings
* Total reports
* Pending reports
* Resolved reports

Include analytics charts such as:

* User registrations over time
* Bookings over time
* Most requested service categories
* Provider verification status
* Report trends
* Active vs inactive users
* Top rated providers
* Most active regions

Recent Activity section showing:

* New registrations
* New provider applications
* Recent reports
* Recent completed bookings

## User Management

Display all users in a searchable and filterable table.

Columns:

* User ID
* Profile picture
* Full name
* Email
* Phone number
* Roles (Client / Provider / Both)
* Verification status
* Account status
* Region
* Date joined
* Last login

Filters:

* Client
* Provider
* Both
* Verified
* Pending Verification
* Suspended
* Blocked
* Active
* Inactive

Actions:

* View profile
* Edit user
* Suspend account
* Unsuspend account
* Block account
* Unblock account
* Reset password
* View booking history
* View reports
* View ratings

Admin should never see passwords.

Admin should not see live location.

## Provider Verification

Dedicated verification page.

Show pending providers.

Display:

* Headshot
* Ghana Card image
* Entered Ghana Card details
* Job title
* Bio
* Region
* Date submitted

Actions:

* Approve verification
* Reject verification
* Request resubmission
* Add review notes

Verification status:

* Pending
* Verified
* Rejected

## Booking Management

View all bookings.

Columns:

* Booking ID
* Client
* Provider
* Service category
* Booking status
* Scheduled date
* Region
* Created date

Filters:

* Pending
* Accepted
* In Progress
* Completed
* Cancelled
* Delayed
* No Show

Clicking a booking opens:

* Full booking details
* Timeline
* Ratings
* Payment information (manual records only)
* History
* Reports linked to booking

Admin cannot modify completed bookings.

## Report Management

Dedicated report management module.

Tabs:

* All Reports
* Pending
* Under Review
* Resolved
* Dismissed

Each report should display:

* Report ID
* Reporter
* Reported user
* Booking reference
* Reason
* Description
* Current status
* Date submitted

Actions:

* Mark under review
* Resolve
* Dismiss
* Suspend reported user
* Add internal notes

Reports should remain permanently.

## Reviews Management

View every review submitted.

Columns:

* Booking
* Reviewer
* Reviewed user
* Rating
* Review
* Date

Filters:

* Rating
* Service category
* Provider

Admin can remove abusive reviews.

## Service Categories

Manage available service categories.

Functions:

* Add category
* Edit category
* Disable category
* Enable category

Examples:

* Plumbing
* Carpentry
* Hairdressing
* Electrical
* Painting
* Gardening

These categories should be dynamic rather than hardcoded.

## Analytics

### User Analytics

Display:

* Total users
* Active users
* New users this week
* Login frequency
* User growth

### Provider Analytics

Display:

* Total providers
* Verified providers
* Average ratings
* Most completed jobs
* Most requested services
* Availability statistics

### Client Analytics

Display:

* Total bookings
* Average bookings per client
* Most requested categories
* Average ratings given

### Booking Analytics

Display:

* Completed bookings
* Cancelled bookings
* Delayed bookings
* No-show bookings
* Average completion time

### Regional Analytics

Display:

* Bookings by region
* Providers by region
* Clients by region
* Most active regions

## System Monitoring

Dashboard should include:

* Server status (if API endpoint exists)
* Database connection status
* Firebase connection status
* Total API requests (optional)
* Failed requests (optional)

## Admin Management

Manage administrator accounts.

Display:

* Admin ID
* Name
* Email
* Role
* Last login

Actions:

* Create admin
* Disable admin
* Change permissions
* Reset password

Super Admin should control administrator creation.

## Activity Logs

Every administrator action should be logged.

Log:

* Login
* Logout
* User verification
* User suspension
* User blocking
* Report resolution
* Category updates

Each log should contain:

* Admin
* Action
* Target
* Timestamp
* Device
* IP address (if backend supports it)

Logs should be read-only.

## Notifications

Admin notification center should display:

* New provider awaiting verification
* New reports
* New registrations
* System alerts

Unread notifications should be highlighted.

## Search

Global search should allow searching by:

* User ID
* Booking ID
* Report ID
* Email
* Name
* Phone number

## Settings

Allow configuration of:

* Chat retention period
* Session timeout
* Default user status
* Notification preferences

Future settings can be added without redesigning the page.

## Recommended Page Structure

```
Dashboard
│
├── Dashboard Home
├── User Management
├── Provider Verification
├── Booking Management
├── Reports
├── Reviews
├── Service Categories
├── Analytics
│   ├── Users
│   ├── Providers
│   ├── Clients
│   ├── Bookings
│   └── Regions
├── Notifications
├── Activity Logs
├── Administrators
├── Settings
└── Profile
```

## Important Restrictions

* Admin cannot view user passwords.
* Admin cannot view users' live locations.
* Admin cannot modify chat messages.
* Completed bookings should be read-only.
* Sensitive data such as encrypted Ghana Card numbers must never be displayed in plain text.
* All administrative actions should require authentication and be recorded in the activity log.

## Priority Order

Implement in this order:

1. Authentication and admin layout
2. Dashboard overview
3. User management
4. Provider verification
5. Booking management
6. Report management
7. Analytics
8. Activity logs
9. Notifications
10. Settings

This order ensures that the core administrative functionality is available first, with analytics and quality-of-life features added afterward.


Users select what service they wish to do on sign up
Users upload headshot as well as ghana card for identification as well as verification
users get email/sms verification for status of application, accepted, rejected, resubmit, account suspended. or in app notification if email and sms implementation is too challenging