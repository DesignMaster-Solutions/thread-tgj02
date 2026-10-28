import Cocoa
import WebKit

// Minimal native shell: the game is the same HTML5 build as web/, loaded from the app bundle.
final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: NSWindow!

    func applicationDidFinishLaunching(_ notification: Notification) {
        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []
        let web = WKWebView(frame: .zero, configuration: config)
        let dir = Bundle.main.resourceURL!.appendingPathComponent("web")
        web.navigationDelegate = self
        web.loadFileURL(dir.appendingPathComponent("index.html"), allowingReadAccessTo: dir)

        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1280, height: 800),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.title = "Thread"
        window.contentView = web
        window.center()
        window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(web)
        NSApp.activate(ignoringOtherApps: true)
    }

    // Self-check for the build: THREAD_SNAPSHOT=out.png renders the loaded game to a PNG and quits.
    func webView(_ web: WKWebView, didFinish navigation: WKNavigation!) {
        guard let out = ProcessInfo.processInfo.environment["THREAD_SNAPSHOT"] else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            web.takeSnapshot(with: nil) { image, _ in
                guard let tiff = image?.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
                      let png = rep.representation(using: .png, properties: [:]) else { exit(2) }
                try? png.write(to: URL(fileURLWithPath: out))
                exit(0)
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
let menu = NSMenu(), item = NSMenuItem()
menu.addItem(item)
item.submenu = NSMenu()
item.submenu!.addItem(withTitle: "Quit Thread", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
app.mainMenu = menu
app.run()
