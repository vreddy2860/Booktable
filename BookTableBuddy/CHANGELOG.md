# BookTableBuddy Changelog

## [Unreleased]

### Fixed

- **Restaurant Approval Functionality**
  - Fixed issue with approval status not being properly sent to the backend API
  - Modified `api.js` to properly format and send approval status using URLSearchParams
  - Updated `RestaurantApproval.js` component to correctly handle approval and rejection actions
  - Added validation to ensure only valid approval statuses ('approved' or 'rejected') are sent
  - Fixed content-type headers for API requests to match backend expectations

### Changed

- **API Service**
  - Improved error handling in the approveRestaurant function
  - Updated API service to use proper form data formatting for approval requests

## [1.0.0] - Initial Release

### Added

- Initial application structure and features
- Restaurant booking functionality
- User authentication and authorization
- Restaurant management system
- Admin approval workflow for restaurants
