import { app, globalShortcut, BrowserWindow, shell } from "electron"
import path from "path"
import { javascript, css } from "template-tags"
import { rpcLogin } from "./rpc"

const userAgentWindows = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5026.0 Safari/537.36 Edg/103.0.1254.0",
    userAgentLinux = "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5026.0 Safari/537.36"

const isVaapiAvailable = () => {
    const { execSync } = require("child_process")

    try {
        const vainfo = execSync("vainfo").toString() as string
        return vainfo.includes("VA-API version")
    } catch (e) {
        console.error("VA-API is not available! Please install it alongside vainfo. Refer to the README FAQ for more information.")
        return false
    }
}

if (isVaapiAvailable()) app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder")
app.commandLine.appendSwitch("enable-accelerated-mjpeg-decode")
app.commandLine.appendSwitch("enable-accelerated-video")
app.commandLine.appendSwitch("ignore-gpu-blacklist")
app.commandLine.appendSwitch("enable-native-gpu-memory-buffers")
app.commandLine.appendSwitch("enable-gpu-rasterization")

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: false,
            nativeWindowOpen: false,
        },
        minWidth: 1280,
        minHeight: 720,
        title: "Xbox Cloud Gaming",
    })

    if (process.argv.includes("--gpu-info")) {
        mainWindow.loadURL("chrome://gpu")
    } else {
        mainWindow.loadURL(`https://www.xbox.com/${app.getLocale()}/play`)
    }
}

app.whenReady().then(() => {
    createWindow()

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    globalShortcut.register("F11", () => {
        const win = BrowserWindow.getAllWindows()[0]

        win.setFullScreen(!win.isFullScreen())
    })

    globalShortcut.register("F1", () =>
        shell.openExternal(
            "https://github.com/marzeq/xbox-cloud-gaming-electron"
        )
    )

    globalShortcut.register("F12", () => {
        BrowserWindow.getAllWindows()[0].webContents.openDevTools()
    })

    globalShortcut.register("Control+Shift+c", () => {
        BrowserWindow.getAllWindows()[0].webContents.toggleDevTools()
    })

    globalShortcut.register("Control+Shift+i", () => {
        BrowserWindow.getAllWindows()[0].webContents.toggleDevTools()
    })

    globalShortcut.register("Control+q", () => {
        app.quit()
    })
})

app.on("browser-window-created", async (_, window) => {
    window.setBackgroundColor("#1A1D1F")
    window.setMenu(null)
    
    if (process.argv.includes("--linux-user-agent")) {
        window.webContents.setUserAgent(userAgentLinux)
    } else {
        window.webContents.setUserAgent(userAgentWindows)
    }

    const rpc = process.argv.includes("--no-rpc") ? null : await rpcLogin().catch(null)

    if (!rpc && !process.argv.includes("--no-rpc")) {
        console.error("Failed to login to Discord RPC")
        process.exit(1)
    }

    const injectCode = () => {
        if (!process.argv.includes("--gpu-info"))
            window.webContents.insertCSS(css`
                ::-webkit-scrollbar { display: none; }
            `)
        
        if (!process.argv.includes("--dont-hide-pointer"))
            window.webContents.insertCSS(css`
                .no-pointer { cursor: none; }
            `)

            window.webContents.executeJavaScript(javascript`
                document.addEventListener("mousemove", () => {
                    document.querySelectorAll("*").forEach((element) => {
                        element.classList.remove("no-pointer")
                    })
                })

                setInterval(() => {
                    for (const gamepad of navigator.getGamepads()) {
                        if (!gamepad) continue

                        const pressed = [...gamepad.buttons.map(b => b.value), ...gamepad.axes].filter(v => v >= 0.8 || v <= -0.8)

                        if (pressed.length > 0) {
                            document.querySelectorAll("*").forEach((element) => {
                                element.classList.add("no-pointer")
                            })
                        }
                    }   
                }, 10)
            `)
    }

    injectCode()

    rpc?.setActivity({
        details: "Playing",
        state: "Browsing the library",
        startTimestamp: Date.now()
    })

    window.on("page-title-updated", (e, title) => {
        injectCode()

        e.preventDefault()
        if (title.includes("|")) {
            const gameName = title.split("|")[0].replaceAll("Play", "").trim()

            let state = gameName
            
            if (title.includes("  ")) {
                window.setFullScreen(true)
                state = "Playing " + gameName
            } else {
                window.setFullScreen(false)
                state = "Viewing " + gameName
            }


            rpc?.setActivity({
                details: "Playing",
                state,
                largeImageKey: "xbox",
                largeImageText: "Xbox Cloud Gaming on Linux (Electron)",
                startTimestamp: Date.now()
            })
        } else {
            window.setFullScreen(false)

            rpc?.setActivity({
                details: "Playing",
                state: "Browsing the library",
                largeImageKey: "xbox",
                largeImageText: "Xbox Cloud Gaming on Linux (Electron)",
                startTimestamp: Date.now()
            })
        }
    })

    app.on("will-quit", async () => {
        globalShortcut.unregisterAll()
        await rpc?.clearActivity()
    })

    app.on("window-all-closed", async () => {
        if (process.platform !== "darwin") {
            await rpc?.clearActivity()
            app.quit()
        }
    })
})
