import { app, globalShortcut, BrowserWindow, shell } from "electron"
import path from "path"

const userAgent =
    "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36"

let isFullScreen = false

// this appears to be causing flickering on some systems
// will stay disabled for now until a fix is found
// app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder")
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
        title: "Xbox Cloud Gaming",
    })

    mainWindow.loadURL("https://www.xbox.com/en-US/play")
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
        isFullScreen = win.isFullScreen()
        if (isFullScreen) {
            win.setFullScreen(false)
            isFullScreen = false
        } else {
            win.setFullScreen(true)
            isFullScreen = true
        }
    })

    globalShortcut.register("F1", () =>
        shell.openExternal(
            "https://github.com/marzeq/xbox-cloud-gaming-electron"
        )
    )

    globalShortcut.register("F12", () => {
        const win = BrowserWindow.getAllWindows()[0]
        win.webContents.openDevTools()
    })

    globalShortcut.register("Control+Shift+c", () => {
        const win = BrowserWindow.getAllWindows()[0]
        win.webContents.toggleDevTools()
    })
})

app.on("browser-window-created", (_, window) => {
    window.setBackgroundColor("#1A1D1F")
    window.setMenu(null)
    window.webContents.setUserAgent(userAgent)

    window.on("leave-full-screen", () => {
        if (isFullScreen) {
            const win = BrowserWindow.getAllWindows()[0]
            win.setFullScreen(true)
        }
    })

    window.on("page-title-updated", (e, title) => {
        // cancel event
        e.preventDefault()
        if (title.includes("|   Xbox Cloud Gaming")) {
            window.setFullScreen(true)
            isFullScreen = true
        } else {
            window.setFullScreen(false)
            isFullScreen = false
        }
    })

    app.on("will-quit", () => globalShortcut.unregisterAll())

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit()
        }
    })
})
