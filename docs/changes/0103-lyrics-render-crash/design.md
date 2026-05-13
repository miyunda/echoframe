# Design: Lyrics Render Crash

## Problem

Preview rendering crashes whenever lyrics are present. The failure is in the lyric renderer itself, not in LRC parsing.

## Root Cause

`drawLyrics` was changed to read an optional argument through `arguments[5]` while still being implemented as an arrow function. Arrow functions do not provide their own `arguments`, so any lyric render path throws immediately.

## Goal

- Make lyric rendering accept explicit options without relying on `arguments`.

