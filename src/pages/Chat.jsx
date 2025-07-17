import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getMyConversations, getConversation, createChat, getAllTenants, getAllLandlords, socket } from '../services/api';

const Chat = () => {
  const { user, isLandlord } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [tenants, setTenants] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef(null);

  // Check if there's a chat partner from navigation
  useEffect(() => {
    const chatPartner = sessionStorage.getItem('chatPartner');
    if (chatPartner) {
      const partner = JSON.parse(chatPartner);
      console.log('🎯 Chat partner from navigation:', partner);
      
      // Wait for conversations to load first
      const waitForConversations = () => {
        if (conversations.length > 0) {
          // Find if conversation already exists
          const existingConversation = conversations.find(conv => conv.partnerId === partner.id);
          
          if (existingConversation) {
            // Select existing conversation
            setSelectedConversation(existingConversation);
            loadConversationMessages(existingConversation.partnerId);
          } else {
            // Start new conversation
            startNewConversation({
              _id: partner.id,
              name: partner.name,
              role: partner.role,
              nationalID: partner.nationalID
            });
          }
        } else {
          // If no conversations yet, start new conversation
          startNewConversation({
            _id: partner.id,
            name: partner.name,
            role: partner.role,
            nationalID: partner.nationalID
          });
        }
      };

      // Wait a bit for conversations to load
      setTimeout(waitForConversations, 1000);
      
      sessionStorage.removeItem('chatPartner'); // Clear after use
    }
  }, [conversations.length]); // Depend on conversations length to trigger when they load

  // Socket setup
  useEffect(() => {
    if (user) {
      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      socket.connect();
      socket.emit('joinRoom', { 
        username: user.name, 
        roomId: user.apartmentName 
      });

      socket.on('userJoined', ({ user: joinedUser, roomId }) => {
        console.log('User joined:', joinedUser.name, 'in room:', roomId);
        setOnlineUsers(prev => [...prev.filter(u => u.name !== joinedUser.name), joinedUser]);
      });

      socket.on('newMessage', (message) => {
        console.log('New message received:', message);
        
        // Only add message if it's not from the current user to avoid duplicates
        if (message.senderId !== user._id && message.senderId._id !== user._id) {
          setMessages(prev => {
            const isDuplicate = prev.some(msg => 
              msg._id === message._id || 
              (msg.message === message.message && 
               msg.senderId === message.senderId && 
               Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 1000)
            );
            return isDuplicate ? prev : [...prev, message];
          });
        }
        
        // Update conversation list
        setConversations(prev => prev.map(conv => 
          conv.partnerId === message.senderId._id || conv.partnerId === message.receiverId._id
            ? { ...conv, lastMessage: message }
            : conv
        ));

        // Show notification if message is not from current user
        if (message.senderId._id !== user._id) {
          if (Notification.permission === 'granted') {
            new Notification(`New message from ${message.senderName}`, {
              body: message.message,
              icon: '/favicon.ico'
            });
          }
        }
      });

      socket.on('userOffline', (username) => {
        setOnlineUsers(prev => prev.filter(u => u.name !== username));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  // Fetch conversations and users
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        
        console.log('🔄 Fetching chat data...');
        
        // Fetch conversations
        const conversationsResponse = await getMyConversations();
        console.log('💬 Conversations response:', conversationsResponse.data);
        const conversationsList = conversationsResponse.data || [];
        setConversations(conversationsList);

        // Fetch users based on role
        if (isLandlord) {
          try {
            const tenantsResponse = await getAllTenants();
            console.log('👥 Tenants for chat:', tenantsResponse.data);
            setTenants(tenantsResponse.data || []);
          } catch (error) {
            console.error('❌ Error fetching tenants:', error);
            setTenants([]);
          }
        } else {
          try {
            const landlordsResponse = await getAllLandlords();
            console.log('🏠 Landlords for chat:', landlordsResponse.data);
            setLandlords(landlordsResponse.data || []);
          } catch (error) {
            console.error('❌ Error fetching landlords:', error);
            setLandlords([]);
          }
        }

        // Auto-select first conversation if available and no conversation is selected
        if (conversationsList.length > 0 && !selectedConversation) {
          console.log('🎯 Auto-selecting first conversation');
          const firstConversation = conversationsList[0];
          setSelectedConversation(firstConversation);
          await loadConversationMessages(firstConversation.partnerId);
        }
      } catch (error) {
        console.error('❌ Error fetching chat data:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchChatData();
    }
  }, [isLandlord, user]);

  // Load messages for a specific conversation
  const loadConversationMessages = async (partnerId) => {
    try {
      setMessagesLoading(true);
      console.log('🔄 Loading messages for partner:', partnerId);
      console.log('🔄 Current user ID:', user._id);
      
      const response = await getConversation(user._id, partnerId);
      console.log('💬 Messages response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('💬 Loaded messages count:', response.data.length);
        setMessages(response.data);
      } else {
        console.log('💬 No messages found or invalid response');
        setMessages([]);
      }
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('❌ Error loading conversation messages:', error);
      console.error('❌ Error details:', error.response?.data);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = async (conversation) => {
    console.log('🎯 Selecting conversation:', conversation);
    setSelectedConversation(conversation);
    setMessages([]); // Clear messages while loading
    await loadConversationMessages(conversation.partnerId);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedConversation && !sending) {
      setSending(true);
      setError('');
      try {
        const messageData = {
          receiverId: selectedConversation.partnerId,
          message: newMessage.trim()
        };

        const response = await createChat(messageData);
        const newMessageObj = response.data.chat;
        
        // Send via socket for real-time updates to other users
        socket.emit('sendMessage', {
          content: newMessage.trim(),
          receiverName: selectedConversation.partnerName,
          senderName: user.name,
          senderId: user._id,
          receiverId: selectedConversation.partnerId
        });
        
        // Add message to current conversation (avoid duplicates)
        setMessages(prev => {
          const isDuplicate = prev.some(msg => 
            msg._id === newMessageObj._id || 
            (msg.message === newMessageObj.message && 
             msg.senderId === newMessageObj.senderId && 
             Math.abs(new Date(msg.createdAt) - new Date(newMessageObj.createdAt)) < 1000)
          );
          return isDuplicate ? prev : [...prev, newMessageObj];
        });
        
        // Update conversation in the list
        const updatedConversations = conversations.map(conv => 
          conv.partnerId === selectedConversation.partnerId 
            ? { ...conv, lastMessage: newMessageObj }
            : conv
        );
        setConversations(updatedConversations);
        
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
        setError('Failed to send message. Please try again.');
      } finally {
        setSending(false);
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Function to start a new conversation
  const startNewConversation = async (userToMessage) => {
    try {
      const messageData = {
        receiverId: userToMessage._id,
        message: `Hello ${userToMessage.name}! 👋`
      };

      const response = await createChat(messageData);
      const newMessageObj = response.data.chat;
      
      // Send via socket for real-time updates
      socket.emit('sendMessage', {
        content: `Hello ${userToMessage.name}! 👋`,
        receiverName: userToMessage.name,
        senderName: user.name,
        senderId: user._id,
        receiverId: userToMessage._id
      });
      
      // Create new conversation object
      const newConversation = {
        partnerId: userToMessage._id,
        partnerName: userToMessage.name,
        partnerRole: userToMessage.role,
        partnerNationalID: userToMessage.nationalID,
        lastMessage: newMessageObj,
        messageCount: 1
      };

      // Add to conversations and select it
      setConversations([newConversation, ...conversations]);
      setSelectedConversation(newConversation);
      setMessages([newMessageObj]);
    } catch (error) {
      console.error('Error starting new conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-800">Chats</h1>
              <button
                onClick={() => setShowUserList(!showUserList)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                title="New Chat"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {isLandlord ? 'Your Tenants' : 'Your Landlord'}
            </p>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No conversations yet</p>
                <button
                  onClick={() => setShowUserList(true)}
                  className="text-green-600 text-sm hover:underline mt-1"
                >
                  Start a new chat
                </button>
              </div>
            ) : (
              conversations.map((conversation) => {
                const isOnline = onlineUsers.some(u => u.name === conversation.partnerName);
                const isSelected = selectedConversation?.partnerId === conversation.partnerId;
                
                return (
                  <div
                    key={conversation.partnerId}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`flex items-center p-3 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50 ${
                      isSelected ? 'bg-green-50 border-r-4 border-r-green-500' : ''
                    }`}
                  >
                    <div className="relative mr-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold text-lg">
                          {conversation.partnerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.partnerName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessage?.createdAt || conversation.lastMessage?.timestamp || new Date())}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* New Chat Users List */}
          {showUserList && (
            <div className="border-t border-gray-200 bg-gray-50 max-h-48 overflow-y-auto">
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {isLandlord ? 'Start chat with tenant:' : 'Available landlords:'}
                </h3>
                <div className="space-y-1">
                  {(isLandlord ? tenants : landlords).map((user) => {
                    const isOnline = onlineUsers.some(u => u.name === user.name);
                    return (
                      <button
                        key={user._id}
                        onClick={() => {
                          startNewConversation(user);
                          setShowUserList(false);
                        }}
                        className="w-full flex items-center p-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="relative mr-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                        {isOnline && (
                          <span className="text-xs text-green-600 font-medium">Online</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {selectedConversation.partnerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {onlineUsers.some(u => u.name === selectedConversation.partnerName) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedConversation.partnerName}</h2>
                    <p className="text-sm text-gray-600">
                      {onlineUsers.some(u => u.name === selectedConversation.partnerName) ? 'Online' : 'Offline'} • {selectedConversation.partnerRole}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <span className="ml-2 text-gray-600">Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isCurrentUser = message.senderId?._id === user._id || message.senderId === user._id;
                    const showTimestamp = index === 0 || 
                      (new Date(message.createdAt || message.timestamp) - new Date(messages[index - 1]?.createdAt || messages[index - 1]?.timestamp)) > 300000; // 5 minutes
                    
                    return (
                      <div key={message._id || index}>
                        {showTimestamp && (
                          <div className="text-center mb-4">
                            <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                              {new Date(message.createdAt || message.timestamp).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                            isCurrentUser
                              ? 'bg-green-500 text-white ml-12'
                              : 'bg-white text-gray-800 mr-12'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              isCurrentUser ? 'text-green-100' : 'text-gray-400'
                            }`}>
                              {formatTime(message.createdAt || message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white p-4 border-t border-gray-200">
                {error && (
                  <div className="mb-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 bg-gray-50"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-gray-400 mb-6">
                  <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  Welcome to Safe Stay Chat
                </h2>
                <p className="text-gray-500 mb-6">
                  Select a conversation to start messaging
                </p>
                <button
                  onClick={() => setShowUserList(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-md"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
