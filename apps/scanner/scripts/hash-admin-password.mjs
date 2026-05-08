#!/usr/bin/env node
// Generate a scrypt hash for ADMIN_LOGIN_PASSWORD_HASH.
// Matches apps/scanner/src/lib/admin-auth.ts SCRYPT_PARAMS.
//
// Usage (run on your laptop, not the production box):
//   node apps/scanner/scripts/hash-admin-password.mjs
// Then type the password at the prompt (input is hidden).
// Paste the printed `scrypt$...` line into Coolify env var
// ADMIN_LOGIN_PASSWORD_HASH and restart the container.

import { scrypt as _scrypt, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(_scrypt)

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt)
    const stdin = process.stdin
    if (!stdin.isTTY) {
      reject(new Error('stdin is not a TTY; run interactively'))
      return
    }
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    let buf = ''
    const onData = (ch) => {
      // Accept Enter (CR/LF) and Ctrl-D as submit.
      if (ch === '\r' || ch === '\n' || ch.charCodeAt(0) === 4) {
        stdin.setRawMode(false)
        stdin.pause()
        stdin.removeListener('data', onData)
        process.stdout.write('\n')
        resolve(buf)
      } else if (ch.charCodeAt(0) === 3) {
        // Ctrl-C: abort.
        stdin.setRawMode(false)
        process.stdout.write('\n')
        process.exit(130)
      } else if (ch === '\b' || ch.charCodeAt(0) === 127) {
        // Backspace / DEL.
        buf = buf.slice(0, -1)
      } else {
        buf += ch
      }
    }
    stdin.on('data', onData)
  })
}

const password = await readHidden(
  'New admin password (>=12 chars, hidden): ',
)
if (!password || password.length < 12) {
  console.error('error: password must be at least 12 characters')
  process.exit(1)
}

const confirm = await readHidden('Confirm password: ')
if (password !== confirm) {
  console.error('error: passwords did not match')
  process.exit(1)
}

const salt = randomBytes(16)
const hash = await scrypt(password, salt, 64)
const out = `scrypt$16384$8$1$${salt.toString('base64')}$${hash.toString('base64')}`

console.log('\n--- copy the line below into Coolify ADMIN_LOGIN_PASSWORD_HASH ---')
console.log(out)
console.log('---')
