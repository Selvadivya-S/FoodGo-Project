export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "FoodGo API",
    version: "1.0.0",
    description: "Advanced multi-role food delivery platform API"
  },
  servers: [{ url: "http://localhost:5000" }],
  tags: [
    { name: "Auth" }, { name: "Restaurants" }, { name: "Customer" },
    { name: "Restaurant Partner" }, { name: "Delivery" }, { name: "Admin" }, { name: "Payments" }
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Auth"],
        summary: "Health check",
        responses: { "200": { description: "Healthy" } }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"], summary: "Login",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email","password"], properties: { email: { type: "string" }, password: { type: "string" } } } } } },
        responses: { "200": { description: "JWT access and refresh tokens" } }
      }
    }
  }
};
