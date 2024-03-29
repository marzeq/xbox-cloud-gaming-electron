import { execSync } from "node:child_process"
import { app, globalShortcut, BrowserWindow, shell, session } from "electron"
import path from "path"
import { rpcLogin } from "./rpc"

const userAgentWindows = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 Edg/105.0.1343.53"

const VAAPIWARN = `VA-API is not available! This might cause stuttering and poor quality. Please install it alongside vainfo. Refer to the README FAQ for more information. To disable this warning, pass the --no-vaapi-warning flag.

If you're on Fedora, there's currently no way to fix this due to a copyright issue. This migth change soon, so please monitor the situation and see if there are any packages in the RPMFusion repository that can be used.`


let vaapiAvailable = false

try {
    const vainfo = execSync("vainfo").toString() as string
    vaapiAvailable = vainfo.includes("VA-API version")
} catch (e) {
    console.error(VAAPIWARN)
}

let rpcDisabled = false

if (vaapiAvailable) {
    app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder")
    app.commandLine.appendSwitch("enable-accelerated-mjpeg-decode")
    app.commandLine.appendSwitch("enable-accelerated-video")
    app.commandLine.appendSwitch("ignore-gpu-blacklist")
    app.commandLine.appendSwitch("enable-native-gpu-memory-buffers")
    app.commandLine.appendSwitch("enable-gpu-rasterization")
}

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

    if (process.argv.includes("--no-rpc")) rpcDisabled = true

    if (process.argv.includes("--gpu-info")) {
        mainWindow.loadURL("chrome://gpu")
        rpcDisabled = true
    } else if (process.argv.includes("--open")) {
        const index = process.argv.indexOf("--open")

        if (process.argv[index + 1] && !process.argv[index + 1].startsWith("-")) {
            mainWindow.loadURL(process.argv[index + 1])
            rpcDisabled = true
        }
    } else {
        mainWindow.loadURL("https://www.xbox.com/play")
    }
}

app.whenReady().then(() => {
    if (!process.argv.includes("--normal-user-agent")) {
        const filter = {
            urls: ["https://xbox.com/*"]
        }
          
        session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
            details.requestHeaders["User-Agent"] = userAgentWindows
            callback({ requestHeaders: details.requestHeaders })
        })
    }

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
    
    if (!process.argv.includes("--normal-user-agent")) {
        window.webContents.setUserAgent(userAgentWindows)
    }

    const rpc = rpcDisabled ? null : await rpcLogin().catch(null)

    if (!rpc && !rpcDisabled) {
        console.error("Failed to login to Discord RPC")
    }

    const injectCode = () => {
        if (!process.argv.includes("--gpu-info"))
            window.webContents.insertCSS(/*css*/`
                ::-webkit-scrollbar { display: none; }
            `)
        
        if (!vaapiAvailable && !process.argv.includes("--no-vaapi-warning"))
            window.webContents.executeJavaScript(/*javascript*/`
                const vaapiWarningDiv = document.createElement("div")
                vaapiWarningDiv.style.backgroundColor = "white"
                vaapiWarningDiv.style.color = "red"
                vaapiWarningDiv.style.padding = "10px"
                vaapiWarningDiv.style.fontFamily = "sans-serif"

                vaapiWarningDiv.innerHTML = "${VAAPIWARN.replaceAll("\n", "<br>")}"

                document.body.prepend(vaapiWarningDiv)
            `).catch(() => null)

        
        if (!process.argv.includes("--dont-hide-pointer")) {
            window.webContents.insertCSS(/*css*/`
                .no-pointer { cursor: none; }
            `)

            window.webContents.executeJavaScript(/*javascript*/`
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
    }

    injectCode()

    rpc?.setActivity({
        details: "Playing",
        state: "Browsing the library",
        startTimestamp: Date.now()
    })

    window.on("page-title-updated", (e, title) => {
        if (!process.argv.includes("--normal-user-agent")) {
            window.webContents.setUserAgent(userAgentWindows)
        }

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
