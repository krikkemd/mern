import { useState, useEffect } from 'react';

// Redux
import { connect } from 'react-redux';

// Redux actions
import { getAllUsers } from '../redux/actions/userActions';
import { getSingleChatRoom, createChatRoom } from '../redux/actions/chatMessageActions';

// MUI
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Avatar from '@material-ui/core/Avatar';
import Badge from '@material-ui/core/Badge';

// online badge icon
const StyledBadge = withStyles(theme => ({
  badge: {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: '$ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}))(Badge);

const ChatFriendsList = props => {
  // authroute calls getsAllUserRooms, which queries the chatrooms with {req.user._id} where the current logged in user is a member of.
  // We add the chatrooms to the redux state, only chatrooms that have messages are rendered to CHATS
  // we render the chatrooms, with the name of the member that is not the currentUser, sorted by the last created or received message on top.
  // onCLick => getChatMessages from that room with the room._id + we socket.join('clickedRoom') server side, and leave all other rooms. (SERVER SIDE: NO LONGER TRUE)
  // in socketManager we query the chatRooms where the user is a member, we loop through the rooms and socket.join them all.

  useEffect(() => {
    props.getAllUsers();
  }, []);

  // CONTACTS ONCLICK FUNCTIE MAKEN DIE CHECKT OF ER EEN ROOM / GESPREK IS MET DIE USER, ANDERS NIEUWE ROOM MAKEN
  // ROOMS ALLEEN SHOWEN ONDER CHATS ALS ER MESSAGES IN STAAN?
  // GEEN LEGE ROOMS SHOWEN ONDER CHATS
  const [toggleChat, setToggleChat] = useState('contacts');

  // check if there is a chatroom with the clicked on contact. create one if there is not.
  const checkIfContactHasChatRoom = clickedContact => {
    let chatroom;
    props.chatRooms.map(room => {
      room.members.map(member => {
        if (clickedContact._id === member._id && room.members.length <= 2) {
          chatroom = room;
        }
      });
    });
    console.log(chatroom);

    // If there is a chatroom, set it as the activeChatRoom
    if (chatroom) {
      props.getSingleChatRoom(chatroom._id);

      // If the chatroom contains chatMessages, render 'chats'. If the chatroom does not contain chatMessages, stay in 'contacts'.
      chatroom.chatMessages.length > 0 && setToggleChat('chats');
    } else {
      // There is no chatRoom, stay in 'contacts
      setToggleChat('contacts');
      console.log('no chatroom');

      //  chatmessages: [] at chatroomModel?
      // If there is no chatroom found, create a new chatroom.
      // When the chatRoom is created, send it: socket.emit(CREATED_CHAT_MESSAGE, res.data.doc) to the server.
      // dispatch SET_ACTIVE_CHATROOM which updates the props.activeChatRoom of the current user to the newly created chatroom
      // the server socket.joins(newChatRoom._id) with the current socket.
      // Server emits EMIT_CREATED_CHATROOM to chatMessageArea
      // dispatch CREATE_CHAT_ROOM which updates the props.chatrooms of the chatRoomsMembers, updating the state. can't create 2 rooms ✅
      // socket.emit(MEMBERS_JOIN_CHAT_ROOMS, newCreatedChatRoomId) to the server, so all connected members join the new chat room.
      // TODO: on create message / props.chatMessages.length > 0. toggle 'chats'
      // TODO: set an expiry time on the chatRoom if no messages are sent within one hour/day?
      // TODO: SORTING LASTMESSAGE = FUCKED, FILTER IF NULL?
      // TODO: process nog een x doorlopen, misschien kan er wel een emit of dispatch tussen uit. bijvoorbeeld na onchange, als we toch emitten naar iedereen, en dan pas de members filteren.
      props.createChatRoom(props.socket, clickedContact._id, props.user._id);
    }
  };

  return (
    <List>
      <Grid container justify='space-between'>
        <Grid item xs={5}>
          <ListItem
            button
            onClick={e => {
              setToggleChat('contacts');
              console.log(toggleChat);
            }}>
            <ListItemText primary='Contacts' style={{ textAlign: 'center' }}>
              Contacts
            </ListItemText>
          </ListItem>
        </Grid>
        <Divider orientation='vertical' flexItem />
        <Grid item xs={5}>
          <ListItem
            button
            onClick={e => {
              setToggleChat('chats');
              console.log(toggleChat);
            }}>
            <ListItemText primary='Chats' style={{ textAlign: 'center' }}>
              Chats
            </ListItemText>
          </ListItem>
        </Grid>
      </Grid>

      {/* Render chats with messages */}
      {props.chatRooms && toggleChat === 'chats'
        ? props.chatRooms.map(room => {
            // Render ONLINE CHAT users: sorted: chat with last received message on top
            return (
              room.chatMessages.length > 0 &&
              room.members.map(member => {
                if (
                  Object.values(props.connectedUsers).includes(member._id) &&
                  member.username !== props.user.username
                ) {
                  return (
                    <ListItem
                      button
                      key={room._id}
                      onClick={e => {
                        console.log('click');
                        console.log(`Room Id: ${room._id}`);
                        props.getSingleChatRoom(room._id);
                        // props.socket.emit('roomId', room._id);
                      }}>
                      <ListItemIcon>
                        <StyledBadge
                          overlap='circle'
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                          variant='dot'>
                          <Avatar alt={member.username} src={member.avatar} />
                        </StyledBadge>
                      </ListItemIcon>
                      <ListItemText primary={member.username}>{member.username}</ListItemText>
                      <ListItemText
                        secondary={props.lastMessages.map(lastMessage => {
                          if (lastMessage && lastMessage.chatRoomId === room._id) {
                            return lastMessage.body;
                          }
                        })}
                        align='right'></ListItemText>
                    </ListItem>
                  );
                  // Render OFFLINE CHAT users
                } else if (member.username !== props.user.username) {
                  return (
                    <ListItem
                      button
                      key={room._id}
                      onClick={e => {
                        console.log('click');
                        console.log(`Room Id: ${room._id}`);
                        props.getSingleChatRoom(room._id);
                        // props.socket.emit('roomId', room._id);
                      }}>
                      <ListItemIcon>
                        <Avatar alt={member.username} src={member.avatar} />
                      </ListItemIcon>
                      <ListItemText primary={member.username}>{member.username}</ListItemText>
                      <ListItemText
                        secondary={props.lastMessages.map(lastMessage => {
                          if (lastMessage && lastMessage.chatRoomId === room._id) {
                            return lastMessage.body;
                          }
                        })}
                        align='right'></ListItemText>
                    </ListItem>
                  );
                }
              })
            );
          })
        : // Render ONLINE CONTACTS: sorted online users first
          props.users &&
          toggleChat === 'contacts' &&
          props.users.map(user => {
            if (
              Object.values(props.connectedUsers).includes(user._id) &&
              user.username !== props.user.username
            ) {
              return (
                <ListItem
                  button
                  key={user._id}
                  onClick={e => {
                    console.log('clicked ONLINE contact');
                    // console.log(props.chatRooms);
                    // console.log(user._id);
                    console.log(user);
                    checkIfContactHasChatRoom(user);

                    // console.log(`Room Id: ${room._id}`);
                    // props.getSingleChatRoom(room._id);
                    // props.socket.emit('roomId', room._id);
                  }}>
                  <ListItemIcon>
                    <StyledBadge
                      overlap='circle'
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      variant='dot'>
                      <Avatar alt={user.username} src={user.avatar} />
                    </StyledBadge>
                  </ListItemIcon>
                  <ListItemText primary={user.username}>{user.username}</ListItemText>
                </ListItem>
              );
            }
            // Render OFFLINE CONTACTS
            else if (user.username !== props.user.username) {
              return (
                <ListItem
                  button
                  key={user._id}
                  onClick={e => {
                    console.log('clicked OFFLINE contact');
                    // console.log(props.chatRooms);
                    // console.log(user._id);
                    console.log(user);

                    checkIfContactHasChatRoom(user);
                  }}>
                  <ListItemIcon>
                    <Avatar alt={user.username} src={user.avatar} />
                  </ListItemIcon>
                  <ListItemText primary={user.username}>{user.username}</ListItemText>
                  <ListItemText secondary='Offline' align='right'></ListItemText>
                </ListItem>
              );
            }
          })}
    </List>
  );
};

const mapStateToProps = state => {
  return {
    socket: state.socket.socket,
    user: state.user.user,
    chatRooms: state.chat.chatRooms,
    lastMessages: state.chat.lastMessages,
    connectedUsers: state.user.connectedUsers,
    users: state.user.users,
  };
};

export default connect(mapStateToProps, { getSingleChatRoom, getAllUsers, createChatRoom })(
  ChatFriendsList,
);
