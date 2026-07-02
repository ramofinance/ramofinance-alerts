import { createServer } from "./app";

const PORT = process.env.PORT || 3000;

const server = createServer();

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
