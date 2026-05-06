import "dotenv/config";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { 
    makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason,
    WASocket
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import cron from "node-cron";
import axios from "axios";

// --- Configuración ---
const PORT = process.env.PORT || 3000;
const VERCEL_API_URL = process.env.VERCEL_API_URL || "http://localhost:3000";
const AUTH_FOLDER = "auth_info_baileys";
const RESET_FLAG = ".reset_bot";

const logger = pino({ level: "info" });
let sock: WASocket | undefined;
let qrCode: string | undefined;
let connectionStatus = "Desconectado";

// --- Utilidades de Archivos ---
function cleanAuthFolder() {
    if (existsSync(AUTH_FOLDER)) {
        logger.info("Flag de reinicio detectado. Limpiando archivos de sesión...");
        const files = readdirSync(AUTH_FOLDER);
        for (const file of files) {
            const fullPath = join(AUTH_FOLDER, file);
            if (statSync(fullPath).isFile()) {
                unlinkSync(fullPath);
            }
        }
        logger.info("Limpieza completada.");
    }
}

// --- Conexión Baileys ---
async function connectToWhatsApp() {
    // Verificar flag de reset
    if (existsSync(RESET_FLAG)) {
        cleanAuthFolder();
        unlinkSync(RESET_FLAG);
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        markOnlineOnConnect: false,
        syncFullHistory: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCode = qr;
            connectionStatus = "Esperando QR";
        }

        if (connection === "close") {
            qrCode = undefined;
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            connectionStatus = "Desconectado";
            logger.info(`Conexión cerrada. Reconectando: ${shouldReconnect}`);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === "open") {
            qrCode = undefined;
            connectionStatus = "Conectado";
            logger.info("¡WhatsApp Conectado!");
        }
    });

    // Auto-respuesta
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;
        if (msg.key.remoteJid?.includes('@g.us')) return;

        try {
            await sock?.sendMessage(msg.key.remoteJid!, { 
                text: "Este número solamente envía recordatorios de turnos para OmegaFit, no es para comunicarse con los licenciados.\nPara agendar un turno entrar a: https://omegafit.agustindev.com.ar/turnos/buscar" 
            });
        } catch (err) {
            logger.error("Error al enviar auto-respuesta: " + err);
        }
    });
}

// --- Servidor HTTP Ligero ---
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url;
    const method = req.method;

    // Ruta Principal: UI de Control
    if (url === "/" && method === "GET") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OmegaFit WhatsApp Bot</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                <style>
                    body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f2f5; }
                    .card { background: white; padding: 2rem; border-radius: 20px; shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; }
                    .status { font-weight: bold; padding: 0.5rem 1rem; border-radius: 10px; margin: 1rem 0; display: inline-block; }
                    .Connected { background: #dcf8c6; color: #075e54; }
                    .Disconnected { background: #ffebee; color: #c62828; }
                    .Waiting { background: #e3f2fd; color: #1565c0; }
                    #qrcode { margin: 1.5rem 0; display: flex; justify-content: center; }
                    .btn { background: #ef4444; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; text-decoration: none; }
                    .btn:hover { background: #dc2626; transform: scale(1.02); }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>WhatsApp Bot</h1>
                    <div class="status ${connectionStatus.split(" ")[0]}">${connectionStatus}</div>
                    <div id="qrcode"></div>
                    ${qrCode ? `<script>new QRCode(document.getElementById("qrcode"), "${qrCode}");</script>` : '<p>No hay QR activo en este momento.</p>'}
                    <div style="margin-top: 2rem;">
                        <a href="/reset-whatsapp" class="btn">🔄 Reiniciar y Generar Nuevo QR</a>
                    </div>
                </div>
                <script>
                    // Auto-refresh cada 30 segundos si no está conectado
                    if ("${connectionStatus}" !== "Conectado") {
                        setTimeout(() => location.reload(), 30000);
                    }
                </script>
            </body>
            </html>
        `;
        res.end(html);
        return;
    }

    // Ruta de Reset
    if (url === "/reset-whatsapp" && method === "GET") {
        writeFileSync(RESET_FLAG, "reset");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Reiniciando el bot... Por favor espera unos segundos y recarga la pagina principal.</h1><script>setTimeout(() => location.href='/', 5000)</script>");
        setTimeout(() => process.exit(1), 1000);
        return;
    }

    // API: Enviar Mensaje (POST)
    if (url === "/send-message" && method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", async () => {
            try {
                const { phone, message } = JSON.parse(body);
                if (!phone || !message) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "Missing phone or message" }));
                    return;
                }

                if (!sock || connectionStatus !== "Conectado") {
                    res.writeHead(503);
                    res.end(JSON.stringify({ error: "WhatsApp not connected" }));
                    return;
                }

                const formattedPhone = phone.includes("@") ? phone : `${phone.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
                await sock?.sendMessage(formattedPhone, { text: message });
                
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: "Error sending message" }));
            }
        });
        return;
    }

    // 404
    res.writeHead(404);
    res.end();
});

// --- Cron Jobs ---
function setupCron() {
    // Resumen diario para Admins (22:00)
    cron.schedule("0 22 * * *", async () => {
        logger.info("Ejecutando Cron de Resumen Diario...");
        try {
            const res = await axios.get(`${VERCEL_API_URL}/api/cron/admin-summary`);
            for (const sum of res.data) {
                if (sum.adminPhone && sock) {
                    const jid = `${sum.adminPhone.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
                    await sock.sendMessage(jid, { text: sum.message });
                }
            }
        } catch (err: any) {
            logger.error("Error en cron resumen admin: " + err.message);
        }
    });

    // Recordatorios para Pacientes (08:00 AM)
    cron.schedule("0 8 * * *", async () => {
        logger.info("Ejecutando Cron de Recordatorios...");
        try {
            const res = await axios.get(`${VERCEL_API_URL}/api/cron/patient-reminders`);
            for (const rem of res.data) {
                if (rem.patientPhone && sock) {
                    const jid = `${rem.patientPhone.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
                    await sock.sendMessage(jid, { text: rem.message });
                }
            }
        } catch (err: any) {
            logger.error("Error en cron recordatorios: " + err.message);
        }
    });
}

// --- Inicio ---
server.listen(PORT, () => {
    logger.info(`Servidor HTTP corriendo en puerto ${PORT}`);
    connectToWhatsApp();
    setupCron();
});
