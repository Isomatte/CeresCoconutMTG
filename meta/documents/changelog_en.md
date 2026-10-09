# Release Notes for CeresCoconutMTG

## v1.0.12 (2026-10-09)

### Fixed

- The wish list, the 404 page and the newsletter opt-out page load the theme fonts and styles again. Ceres delivers these pages with the checkout bundle, so the theme header, footer and fonts were missing. The same applies to password reset, change e-mail and returns. Checkout and login are unchanged.

## v1.0.11 (2026-10-09)

### Changed

- New design of the shipment tracking page based on the "Sendungsverfolgung Redesign" draft: dark full-width header, search with order number and postcode side by side, three hints below.
- Result: delivery day and time window in large type in the header, switch between several packages (without JavaScript), "Shipment status" card with progress, copyable tracking number and carrier link, tracking history grouped by day, next to it "Your order" with item images and "Questions about your delivery?".
- Separate mobile layout with grouped lists.
- Recommendations as a swipeable row with arrow buttons instead of a carousel.
- The postcode field opens the numeric keyboard on mobile. Messages for empty required fields use the shop language instead of the browser language.

## v1.0.10 (2026-10-08)

### Added

- "Track shipment" button (data provider "Sendungsverfolgung: Button Sendung verfolgen"): for each order in the order history of the customer account (container "Ceres::MyAccount.OrderHistoryPaymentInformation") and in the order details and on the order confirmation (container "Ceres::OrderConfirmation.AdditionalPaymentInformation"). On the order confirmation the access key from the URL is passed on so the link also works for guests.
- `/sendungsverfolgung/?order=...` without postcode or key for logged-in customers if the order belongs to their account. Otherwise the form with the order number pre-filled.

## v1.0.9 (2026-10-08)

### Added

- Shipment tracking page `/sendungsverfolgung`. Customers enter order number and postcode (or follow a link with `?order=...&zip=...`) and see the same view for UPS and DHL packages: five-step progress, estimated delivery and tracking history.
- Requests to the UPS Tracking API and the DHL Shipment Tracking API (Unified) via `resources/lib`, status cached per tracking number.
- Personal link for order and shipping confirmation: `?order=...&key=...` with the order's access key (as used by "view order"), without address data in the URL.
- Notice for outstanding payments including the amount due; for bank transfers a pointer to the bank details shown when the order was completed.
- Protection against guessing the postcode: after 10 failed attempts an order number is locked for one hour.
- Cross-selling items (relation "Accessory") for the ordered items and an optional link to installation help.
- New configuration tab "Shipment tracking" for activation, UPS/DHL credentials, cache and installation help link.

## v1.0.8 (2026-09-01)

### Added

- Own cancellation form in the theme including the REST endpoint `/rest/cerescoconutmtg/cancellation`. The mail to the shop now carries a reply-to header pointing at the customer's contact email, so replying reaches the customer.
- Optional confirmation of receipt for the customer including date and time.
- New configuration tab "Cancellation form" for recipient address, subject and confirmation of receipt.
- ShopBuilder widget "Cancellation form (theme)" as an alternative to the static page.

## v1.0.7 (2019-05-02)

### TODO

- Please save all changes made to CeresCoconutMTG before executing the update. All changes will be reset during the update process.

### Fixed

- CeresCoconutMTG is now compatible with Ceres 4.0.0.

## v1.0.6 (2019-01-30)

### TODO

- Please save all changes made to CeresCoconutMTG before executing the update. All changes will be reset during the update process.

### Added

- We added the language files **Template.properties** for DE and EN.

### Fixed

- Due to an error, result fields weren't overridden correctly. This has been fixed.

## v1.0.4 (2019-01-25)

### TODO

- Please save all changes made to CeresCoconutMTG before executing the update. All changes will be reset during the update process.

### Added

- We added the templates **SingleItem_Details.twig** and **SingleItem_InformationTable.twig**.

## v1.0.3 (2019-01-21)

### Fixed

- Due to an error, result fields weren't loaded correctly from CeresCoconutMTG. This has been fixed.

## v1.0.2 (2019-01-21)

### Fixed

- Due to an error, overriding result fields didn't work correctly. This has been fixed.

## v1.0.1 (2019-01-21)

### Fixed

- Some plugin files weren't renamed correctly. This has been fixed.

## v1.0.0 (2019-01-21)

### Added

- Plugin files to make CeresCoconutMTG compatible with Ceres 3.0.0.
- Functionality for overriding result fields in the plugin configuration.
- Functionality for overriding CSS, templates and partials by activating the respective template in the plugin configuration.
