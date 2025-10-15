
export enum Status {
  Idle = 'IDLE',
  Connecting = 'CONNECTING',
  Connected = 'CONNECTED',
  Listening = 'LISTENING',
  Processing = 'PROCESSING',
  Speaking = 'SPEAKING',
  Error = 'ERROR',
  Disconnected = 'DISCONNECTED'
}

export enum Speaker {
  User = 'USER',
  Astra = 'ASTRA',
}

export interface TranscriptionEntry {
  speaker: Speaker;
  text: string;
}
