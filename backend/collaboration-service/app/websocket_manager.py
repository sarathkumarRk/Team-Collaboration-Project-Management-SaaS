from fastapi import WebSocket


class ConnectionManager:

    def __init__(self):
        self.active_connections = {}

    # Connect User
    async def connect(
        self,
        task_id: int,
        websocket: WebSocket,
    ):
        await websocket.accept()

        if task_id not in self.active_connections:
            self.active_connections[task_id] = []

        self.active_connections[task_id].append(websocket)

    # Disconnect User
    def disconnect(
        self,
        task_id: int,
        websocket: WebSocket,
    ):
        if task_id in self.active_connections:
            if websocket in self.active_connections[task_id]:
                self.active_connections[task_id].remove(websocket)

            if not self.active_connections[task_id]:
                del self.active_connections[task_id]

    # Send Message to Task Members
    async def broadcast(
        self,
        task_id: int,
        message: dict,
    ):
        connections = self.active_connections.get(task_id, [])

        for connection in connections.copy():
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(task_id, connection)


manager = ConnectionManager()