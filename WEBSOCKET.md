# WebSocket Real-time Messaging

This document describes the WebSocket implementation for real-time messaging between clients and businesses in the Appointyify platform.

## Connection

### Establishing a Connection

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN' // JWT token from /api/auth/login or /api/auth/register
  }
});

// Connection successful
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});

// Disconnected
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### Authentication

WebSocket connections require a valid JWT token passed in the `auth.token` field during connection. The token is verified on connection, and the user ID is extracted for authorization purposes.

## Events

### Client -> Server Events

#### 1. Join Booking Room

Join a specific booking conversation to receive messages.

```javascript
socket.emit('joinBooking', bookingId);
```

**Parameters:**
- `bookingId` (string): The ID of the booking conversation to join

**Example:**
```javascript
socket.emit('joinBooking', '507f1f77bcf86cd799439013');
console.log('Joined booking conversation');
```

---

#### 2. Send Message

Send a message in a booking conversation.

```javascript
socket.emit('sendMessage', {
  bookingId: string,
  content: string,
  senderType: 'client' | 'business'
});
```

**Parameters:**
- `bookingId` (string): The booking ID this message belongs to
- `content` (string): The message text content
- `senderType` (string): Either 'client' or 'business' indicating sender role

**Example:**
```javascript
socket.emit('sendMessage', {
  bookingId: '507f1f77bcf86cd799439013',
  content: 'Hi, I would like to confirm my appointment time.',
  senderType: 'client'
});
```

**Success Response:**
The message is broadcast to all users in the booking room via the `newMessage` event.

**Error Response:**
```javascript
socket.on('error', (error) => {
  console.error('Error:', error.message);
  // Possible errors:
  // - "Booking not found"
  // - "Unauthorized" (user not part of booking)
});
```

---

#### 3. Mark Messages as Read

Mark one or more messages as read.

```javascript
socket.emit('markAsRead', {
  messageIds: string[]
});
```

**Parameters:**
- `messageIds` (array): Array of message IDs to mark as read

**Example:**
```javascript
socket.emit('markAsRead', {
  messageIds: ['507f1f77bcf86cd799439014', '507f1f77bcf86cd799439015']
});
```

**Success Response:**
```javascript
socket.on('messagesMarkedAsRead', (data) => {
  console.log('Messages marked as read:', data.messageIds);
});
```

---

### Server -> Client Events

#### 1. New Message

Receive a new message in a booking conversation.

```javascript
socket.on('newMessage', (message) => {
  console.log('New message received:', message);
});
```

**Message Object:**
```javascript
{
  _id: "507f1f77bcf86cd799439014",
  booking: "507f1f77bcf86cd799439013",
  sender: {
    _id: "507f1f77bcf86cd799439011",
    name: "John Doe",
    email: "john.doe@example.com"
  },
  senderType: "client",
  content: "Hi, I would like to confirm my appointment time.",
  isRead: false,
  createdAt: "2026-02-09T10:30:00.000Z",
  updatedAt: "2026-02-09T10:30:00.000Z"
}
```

---

#### 2. Error

Receive error notifications.

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});
```

**Error Object:**
```javascript
{
  message: "Error description"
}
```

---

#### 3. Messages Marked as Read Confirmation

Receive confirmation when messages are marked as read.

```javascript
socket.on('messagesMarkedAsRead', (data) => {
  console.log('Confirmed read:', data.messageIds);
});
```

**Response Object:**
```javascript
{
  messageIds: ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
}
```

---

## Complete Client Example

```javascript
const io = require('socket.io-client');

// Connect with authentication
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected!');
  
  // Join a booking conversation
  const bookingId = '507f1f77bcf86cd799439013';
  socket.emit('joinBooking', bookingId);
});

// Listen for new messages
socket.on('newMessage', (message) => {
  console.log(`New message from ${message.sender.name}: ${message.content}`);
  
  // Display in UI
  displayMessage(message);
  
  // Mark as read if not sent by current user
  if (message.sender._id !== currentUserId) {
    socket.emit('markAsRead', { messageIds: [message._id] });
  }
});

// Send a message
function sendMessage(bookingId, content, senderType) {
  socket.emit('sendMessage', {
    bookingId,
    content,
    senderType
  });
}

// Handle errors
socket.on('error', (error) => {
  console.error('Error:', error.message);
  alert(error.message);
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

## React Example

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function ChatComponent({ bookingId, userType }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat');
      newSocket.emit('joinBooking', bookingId);
    });

    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('error', (error) => {
      console.error('Chat error:', error.message);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [bookingId]);

  const sendMessage = () => {
    if (messageInput.trim() && socket) {
      socket.emit('sendMessage', {
        bookingId,
        content: messageInput,
        senderType: userType
      });
      setMessageInput('');
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg._id} className={`message ${msg.senderType}`}>
            <strong>{msg.sender.name}:</strong> {msg.content}
            <span className="time">{new Date(msg.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

## Authorization

### Booking Access Control

Users can only send/receive messages in bookings where they are:
1. **The client** who made the booking, OR
2. **The business owner** of the booked business

Attempting to access unauthorized bookings will result in an `Unauthorized` error.

## Best Practices

1. **Always join the room** before sending messages: `socket.emit('joinBooking', bookingId)`
2. **Handle disconnections gracefully**: Implement reconnection logic
3. **Mark messages as read**: Improve user experience by tracking read status
4. **Validate sender type**: Ensure the correct `senderType` is used based on user role
5. **Use REST API for history**: Fetch message history using `/api/messages/booking/:bookingId`
6. **Display loading states**: Show UI feedback during connection/message sending

## REST API Integration

Use these REST endpoints in conjunction with WebSocket for complete messaging functionality:

### Get Message History
```
GET /api/messages/booking/:bookingId
Authorization: Bearer <token>
```

### Get All Conversations (Client)
```
GET /api/messages/my-conversations
Authorization: Bearer <token>
```

### Get Business Conversations
```
GET /api/messages/business/:businessId/conversations
Authorization: Bearer <token>
```

### Mark Messages as Read (Alternative to WebSocket)
```
POST /api/messages/mark-read
Authorization: Bearer <token>
Body: { messageIds: ["id1", "id2"] }
```

## Troubleshooting

### Connection Issues

**Problem:** `connect_error: Authentication error`
- **Solution:** Ensure your JWT token is valid and not expired

**Problem:** Messages not appearing
- **Solution:** Verify you've called `socket.emit('joinBooking', bookingId)` first

**Problem:** `Unauthorized` error when sending messages
- **Solution:** Ensure the current user is either the client or business owner of the booking

### Performance

- **Rate Limiting:** Consider implementing rate limiting on message sending
- **Reconnection:** Socket.io handles reconnection automatically, but you may want to add custom logic
- **Message Batching:** For high-volume scenarios, consider batching read receipts

## ISO 8601 Date Format

All timestamps in WebSocket events use ISO 8601 format:
- `createdAt`: `"2026-02-09T10:30:00.000Z"`
- `updatedAt`: `"2026-02-09T10:30:00.000Z"`

This ensures consistency across the entire platform.
