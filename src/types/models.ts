{\rtf1\ansi\ansicpg1252\cocoartf2908
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // src/types/models.ts\
\
export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'LCF' | 'RCF' | 'RF' | 'DH' | 'EH'; // Adjust based on your kickball rules\
\
export interface Player \{\
  id: string;\
  team_id: string; // Added to map to relational DB\
  name: string;\
  number?: string;\
  status: 'active' | 'archived';\
  created_at: string;\
  preferred_positions?: Position[];\
\}\
\
export interface Team \{\
  id: string;\
  owner_id: string; // Links to auth.users\
  name: string;\
  thumbnail_url?: string;\
  created_at: string;\
  players?: Player[];\
\}\
\
export interface InningAssignment \{\
  inningNumber: number;\
  assignments: \{ playerId: string; position: Position \}[];\
\}\
\
export interface GameLineup \{\
  id: string;\
  team_id: string;\
  game_date: string;\
  game_time: string;\
  opposing_team: string;\
  location: string;\
  field: string;\
  weather: string;\
  kicking_order: string[]; // Array of Player IDs\
  subs: string[]; // Array of Player IDs\
  innings: InningAssignment[]; // JSONB in database\
  created_at: string;\
  players?: Player[];\
\}\
\
export interface GameDraft \{\
  savedAt: string;\
  step: number;\
  selectedTeamId?: string;\
  gameInfo: \{\
    gameDate: string;\
    gameTime: string;\
    opposingTeam: string;\
    location: string;\
    field: string;\
    weather: string;\
  \} | null;\
  attendingPlayers: string[];\
  subs: string[];\
  kickingOrder: string[];\
  innings: InningAssignment[];\
\}}