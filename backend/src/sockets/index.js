export function registerSockets(io) {
  io.on("connection", (socket) => {
    socket.on("join:user", (userId) => socket.join(`user:${userId}`));
    socket.on("join:order", (orderId) => socket.join(`order:${orderId}`));
    socket.on("join:restaurant", (restaurantId) => socket.join(`restaurant:${restaurantId}`));
  });
}
