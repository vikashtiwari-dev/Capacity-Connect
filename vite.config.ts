import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'

// In-memory session store for real-time QR handshake across devices
const qrSessions = new Map<string, { role: string; approved: boolean; createdAt: number }>()

// Server-side authoritative OTP store for register and login flows (expires in 10 mins)
const serverOtpStore = new Map<string, { otp: string; expiresAt: number; purpose: string; name?: string }>()

// Active SSE client connections across all devices (MacBook, iPhone, Android, etc.)
const sseClients = new Set<any>()

function broadcastDbChange(event: { collection: string; action: string; data?: any }) {
  const payload = `data: ${JSON.stringify(event)}\n\n`
  for (const client of sseClients) {
    try {
      client.write(payload)
    } catch (e) {
      sseClients.delete(client)
    }
  }
}

const DB_FILE = path.resolve(__dirname, 'src/server/db.json')

function getDbData(): Record<string, any[]> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8')
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('Error reading db.json:', e)
  }
  return { users: [] }
}

function saveDbData(data: Record<string, any[]>) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (e) {
    console.error('Error writing db.json:', e)
  }
}

function centralDatabasePlugin() {
  return {
    name: 'central-database-server',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        // Set standard CORS headers for multi-device LAN requests
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        const host = req.headers.host || 'localhost:5173'
        const url = new URL(req.url, 'http://' + host)

        // 1. Real-Time Server-Sent Events (SSE) Stream
        if (url.pathname === '/api/db/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          })
          res.write(`data: ${JSON.stringify({ type: 'connected', time: Date.now() })}\n\n`)
          sseClients.add(res)

          // Heartbeat every 25 seconds to keep connection alive across mobile Wi-Fi
          const heartbeat = setInterval(() => {
            try {
              res.write(': heartbeat\n\n')
            } catch (e) {
              clearInterval(heartbeat)
              sseClients.delete(res)
            }
          }, 25000)

          req.on('close', () => {
            clearInterval(heartbeat)
            sseClients.delete(res)
          })
          return
        }

function getSmtpConfig() {
  try {
    const envFile = path.resolve(__dirname, '.env')
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8')
      const env: Record<string, string> = {}
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=')
          env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim()
        }
      }
      return {
        email: env.SMTP_EMAIL || env.SMTP_USER || '',
        password: env.SMTP_PASSWORD || env.SMTP_PASS || '',
        host: env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(env.SMTP_PORT) || 465,
        secure: env.SMTP_SECURE !== 'false'
      }
    }
  } catch (e) {}
  return { email: '', password: '', host: 'smtp.gmail.com', port: 465, secure: true }
}

        // Send Real OTP Email via Official Capacity Connect Email (capacityconnect.org@gmail.com)
        if (url.pathname === '/api/send-otp' && req.method === 'POST') {
          let bodyStr = ''
          req.on('data', (chunk: any) => (bodyStr += chunk))
          req.on('end', async () => {
            try {
              const { email, name, otp, purpose } = JSON.parse(bodyStr || '{}')
              const normEmail = (email || '').trim().toLowerCase()
              const finalOtp = otp || Math.floor(100000 + Math.random() * 900000).toString()
              const flowType = purpose === 'login' ? 'login' : 'register'

              // Authoritatively cache OTP on server for 10 minutes
              serverOtpStore.set(normEmail, {
                otp: finalOtp,
                expiresAt: Date.now() + 10 * 60 * 1000,
                purpose: flowType,
                name: name || 'User'
              })

              console.log(`\n======================================================`)
              console.log(`📧 [OFFICIAL OTP DISPATCH - ${flowType.toUpperCase()}] To: ${normEmail} (${name || 'User'})`)
              console.log(`🔑 Verification OTP Code: ${finalOtp}`)
              console.log(`⏰ Time: ${new Date().toLocaleTimeString()} (Valid for 10 minutes)`)
              console.log(`======================================================\n`)

              if (normEmail && normEmail.endsWith('@example.com')) {
                console.log(`ℹ️ [SKIP EMAIL] Skipped test address: ${normEmail}`)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true, message: `Skipped test address`, skipped: true }))
                return
              }

              const smtp = getSmtpConfig()
              if (smtp.email && smtp.password) {
                const transporter = nodemailer.createTransport(
                  smtp.email.endsWith('@gmail.com')
                    ? {
                        host: 'smtp.gmail.com',
                        port: 465,
                        secure: true,
                        auth: { user: smtp.email, pass: smtp.password },
                        tls: { rejectUnauthorized: false }
                      }
                    : {
                        host: smtp.host,
                        port: smtp.port,
                        secure: smtp.secure,
                        auth: { user: smtp.email, pass: smtp.password }
                      }
                )

                const isLogin = flowType === 'login'
                const subject = isLogin
                  ? `Your Capacity Connect Login Security Code: ${finalOtp}`
                  : `Your Capacity Connect Registration Verification Code: ${finalOtp}`
                const headingText = isLogin ? 'Login Security Verification' : 'Email Verification Code'
                const introText = isLogin
                  ? `A sign-in attempt was initiated for your <strong>Capacity Connect</strong> account. Please use this one-time code to complete two-factor authentication:`
                  : `Thank you for registering with <strong>Capacity Connect</strong>. Please enter this 6-digit verification code on the registration screen to verify your email address and activate your account:`

                await transporter.sendMail({
                  from: `"Capacity Connect" <${smtp.email}>`,
                  to: normEmail,
                  subject,
                  html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0b0f19; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; color: #ffffff;">
                      <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">CAPACITY CONNECT</h2>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Official Learning & Accreditation Management Portal</p>
                      </div>
                      <div style="background: rgba(0, 113, 227, 0.1); border: 1px solid rgba(41, 151, 255, 0.35); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #cbd5e1;">${headingText}</p>
                        <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #2997ff; font-family: monospace;">${finalOtp}</div>
                        <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8;">Valid for 10 minutes &bull; Do not share this code with anyone.</p>
                      </div>
                      <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0;">
                        Hello <strong>${name || 'User'}</strong>,<br/>
                        ${introText}
                      </p>
                      <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 24px; text-align: center; font-size: 11px; color: #64748b;">
                        Sent automatically from <strong>${smtp.email}</strong> &bull; Capacity Connect Security Team
                      </div>
                    </div>
                  `
                })

                console.log(`✅ [EMAIL DISPATCHED] Successfully sent from ${smtp.email} to ${normEmail}`)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  message: `Verification code sent from ${smtp.email} to ${normEmail}`,
                  customSender: true,
                  sender: smtp.email
                }))
                return
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                message: `Verification code logged`,
                customSender: false
              }))
            } catch (err: any) {
              console.error('❌ Error sending mail via custom sender:', err)
              res.statusCode = 500
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        // Authoritative OTP Verification Endpoint
        if (url.pathname === '/api/verify-otp' && req.method === 'POST') {
          let bodyStr = ''
          req.on('data', (chunk: any) => (bodyStr += chunk))
          req.on('end', () => {
            try {
              const { email, otp } = JSON.parse(bodyStr || '{}')
              const normEmail = (email || '').trim().toLowerCase()
              const enteredOtp = (otp || '').trim()
              const record = serverOtpStore.get(normEmail)

              console.log(`🔍 [VERIFY OTP] Email: ${normEmail}, Entered: "${enteredOtp}", Expected: "${record?.otp}"`)

              if (!record) {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ valid: false, error: 'No active OTP found for this email. Please request a new code.' }))
                return
              }

              if (Date.now() > record.expiresAt) {
                serverOtpStore.delete(normEmail)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ valid: false, error: 'Verification code has expired. Please request a new code.' }))
                return
              }

              if (record.otp !== enteredOtp) {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ valid: false, error: 'Incorrect verification code. Please check your inbox and try again.' }))
                return
              }

              // Valid OTP: Consume it
              serverOtpStore.delete(normEmail)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ valid: true, message: 'OTP verified successfully.' }))
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ valid: false, error: e.message }))
            }
          })
          return
        }

        // Unified Official Email Dispatcher Endpoint
        if (url.pathname === '/api/send-email' && req.method === 'POST') {
          let bodyStr = ''
          req.on('data', (chunk: any) => (bodyStr += chunk))
          req.on('end', async () => {
            try {
              const { to, subject, html, text, type } = JSON.parse(bodyStr || '{}')
              const smtp = getSmtpConfig()

              console.log(`\n======================================================`)
              console.log(`📧 [OFFICIAL DISPATCH: ${type?.toUpperCase() || 'COMMUNICATION'}]`)
              console.log(`From: ${smtp.email || '(Configured Official Mailer)'}`)
              console.log(`To: ${to}`)
              console.log(`Subject: ${subject}`)
              console.log(`Time: ${new Date().toLocaleTimeString()}`)
              console.log(`======================================================\n`)

              if (to && to.endsWith('@example.com')) {
                console.log(`ℹ️ [SKIP EMAIL] Skipped test address: ${to}`)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true, message: `Skipped test address`, skipped: true }))
                return
              }

              if (smtp.email && smtp.password) {
                const transporter = nodemailer.createTransport(
                  smtp.email.endsWith('@gmail.com')
                    ? {
                        host: 'smtp.gmail.com',
                        port: 465,
                        secure: true,
                        auth: { user: smtp.email, pass: smtp.password },
                        tls: { rejectUnauthorized: false }
                      }
                    : {
                        host: smtp.host,
                        port: smtp.port,
                        secure: smtp.secure,
                        auth: { user: smtp.email, pass: smtp.password }
                      }
                )

                await transporter.sendMail({
                  from: `"Capacity Connect" <${smtp.email}>`,
                  to,
                  subject,
                  text: text || '',
                  html
                })

                console.log(`✅ [OFFICIAL EMAIL DELIVERED] Dispatched from ${smtp.email} to ${to}`)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  message: `Official communication delivered from ${smtp.email} to ${to}`,
                  sender: smtp.email
                }))
                return
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                message: `Communication recorded (waiting for SMTP sender details)`,
                queued: true
              }))
            } catch (err: any) {
              console.error('❌ Failed to dispatch official communication:', err)
              res.statusCode = 500
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        // 2. REST API: GET /api/db/:collection
        if (url.pathname.startsWith('/api/db/')) {
          const parts = url.pathname.replace('/api/db/', '').split('/')
          const collection = parts[0]
          const recordId = parts[1]

          const db = getDbData()
          const items = db[collection] || []

          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json')
            if (recordId) {
              const item = items.find((i: any) => i.id === recordId)
              if (item) {
                res.end(JSON.stringify(item))
              } else {
                res.statusCode = 404
                res.end(JSON.stringify({ error: 'Record not found' }))
              }
            } else {
              res.end(JSON.stringify(items))
            }
            return
          }

          // Parse body helper for POST/PUT/DELETE
          const getBody = async (): Promise<any> => {
            return new Promise((resolve) => {
              let bodyStr = ''
              req.on('data', (chunk: any) => (bodyStr += chunk))
              req.on('end', () => {
                try {
                  resolve(bodyStr ? JSON.parse(bodyStr) : {})
                } catch (e) {
                  resolve({})
                }
              })
            })
          }

          // POST: Create Record
          if (req.method === 'POST') {
            const body = await getBody()
            const newItem = {
              ...body,
              id: body.id || 'id_' + Math.random().toString(36).substring(2, 9),
              createdAt: body.createdAt || new Date().toISOString()
            }

            // Upsert / Append
            const existingIdx = items.findIndex((i: any) => (body.id && i.id === body.id) || (body.email && i.email === body.email))
            if (existingIdx >= 0) {
              items[existingIdx] = { ...items[existingIdx], ...newItem }
            } else {
              items.unshift(newItem)
            }

            db[collection] = items
            saveDbData(db)

            broadcastDbChange({ collection, action: 'create', data: newItem })

            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 201
            res.end(JSON.stringify(newItem))
            return
          }

          // PUT: Update Record
          if (req.method === 'PUT') {
            const body = await getBody()
            const targetId = recordId || body.id

            const idx = items.findIndex((i: any) => i.id === targetId)
            if (idx >= 0) {
              items[idx] = { ...items[idx], ...body }
              db[collection] = items
              saveDbData(db)

              broadcastDbChange({ collection, action: 'update', data: items[idx] })

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(items[idx]))
            } else {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Item not found to update' }))
            }
            return
          }

          // DELETE: Remove Record
          if (req.method === 'DELETE') {
            const targetId = recordId || url.searchParams.get('id')
            if (!targetId) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing record id' }))
              return
            }

            const updated = items.filter((i: any) => i.id !== targetId)
            db[collection] = updated
            saveDbData(db)

            broadcastDbChange({ collection, action: 'delete', data: { id: targetId } })

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, id: targetId }))
            return
          }
        }

        next()
      })
    }
  }
}

function qrAuthPlugin() {
  return {
    name: 'qr-auth-server',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const host = req.headers.host || 'localhost:5173'
        const url = new URL(req.url, 'http://' + host)

        if (url.pathname === '/api/qr/session') {
          const role = url.searchParams.get('role') || 'trainee'
          const sessionId = 'qr_' + Math.random().toString(36).substring(2, 11)
          qrSessions.set(sessionId, { role, approved: false, createdAt: Date.now() })
          
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({ sessionId, role, success: true }))
          return
        }

        if (url.pathname === '/api/qr/status') {
          const sessionId = url.searchParams.get('sessionId')
          const session = sessionId ? qrSessions.get(sessionId) : null
          
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({
            approved: Boolean(session && session.approved),
            role: session?.role || 'trainee',
            exists: Boolean(session)
          }))
          return
        }

        if (url.pathname === '/api/qr/approve') {
          const sessionId = url.searchParams.get('sessionId')
          const session = sessionId ? qrSessions.get(sessionId) : null
          
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          if (session) {
            session.approved = true
            res.end(JSON.stringify({ success: true, message: 'Session approved successfully' }))
          } else {
            if (sessionId) {
              const role = url.searchParams.get('role') || 'trainee'
              qrSessions.set(sessionId, { role, approved: true, createdAt: Date.now() })
              res.end(JSON.stringify({ success: true, message: 'Session approved successfully' }))
            } else {
              res.statusCode = 400
              res.end(JSON.stringify({ success: false, error: 'Missing sessionId' }))
            }
          }
          return
        }

        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), centralDatabasePlugin(), qrAuthPlugin()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
})

