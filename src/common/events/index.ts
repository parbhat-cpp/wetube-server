export enum SocketEvents {
  CREATE_ROOM = 'create-room',
  JOIN_ROOM = 'join-room',
  ROOM_EXISTS = 'room-exists',
  ROOM_CREATED = 'room-created',
  ROOM_LIMIT_REACHED = 'room-limit-reached',
  ENTER_ROOM = 'enter-room',
  NEW_ATTENDEE = 'new-attendee',
  ROOM_NOT_FOUND = 'room-not-found',
  AUTH_FAILED = 'auth-failed',
  LEAVE_ROOM = 'leave-room',
  ATTENDEE_LEFT = 'attendee-left',
  ATTENDEE_KICKED = 'attendee-kicked',
  RECEIVE_MESSAGE = 'receive-message',
  EXIT_ROOM = 'exit-room',
  REMOVE_ATTENDEE = 'remove-attendee',
  SEND_MESSAGE = 'send-message',
  SET_VIDEO = 'set-video',
  SET_VIDEO_ID = 'set-video-id',
}
