# Specification

## Summary
**Goal:** Build a full e-commerce storefront with customer-facing product browsing and order placement, plus a secured admin panel for managing products and orders for Creative Prints and Design.

**Planned changes:**
- Add a customer-facing store page displaying all 3D printed products in a responsive grid with images, names, descriptions, and prices fetched from the backend
- Add a shopping cart and checkout flow that collects customer name, email, shipping address, and submits a store order to the backend, showing a success confirmation on completion
- Add backend data models and endpoints for products (CRUD) and store orders (create, list, update status)
- Restrict admin panel access to the Internet Identity principal associated with lanepeevy@gmail.com; backend must verify admin identity on all admin operations and frontend must hide admin UI from non-admins
- Build an admin dashboard with a Products tab (add/edit/delete products with image upload, name, description, price) and an Orders tab (view all orders with customer details and status, update order status through Pending → Processing → Shipped → Completed)

**User-visible outcome:** Customers can browse 3D printed products, add them to a cart, and place orders through a checkout form. The admin (lanepeevy@gmail.com) can log in with Internet Identity to access a protected dashboard where they can manage products and review or update the status of customer orders.
