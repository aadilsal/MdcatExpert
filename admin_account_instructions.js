// Script to create an admin user in Convex
// 1. Run this in your Convex dashboard or as a script using Convex client

const email = "admin+mdcat@yourdomain.com"; // Change if you want default
const password = "MDCAT-Admin-2026!"; // Change to a secure password
const name = "Admin";

// 1. Create the user (register with email/password)
// 2. Promote to admin

// Example using Convex client (pseudo-code):
// await convex.mutation("users:createUser", { email, name });
// const user = await convex.query("users:getUserByEmail", { email });
// await convex.mutation("users:setUserRole", { userId: user._id, role: "admin" });

// If using Convex Auth Password provider, register via your app's signup form, then run setUserRole.

module.exports = { email, password, name };
