// generate_90s_video.mjs
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9235;

async function main() {
    console.log("====================================================");
    console.log("🎬 STARTING 90-SECOND ARCHITECTURAL MP4 VIDEO TOUR");
    console.log("====================================================");

    const profileDir = 'C:\\Users\\yuvar\\AppData\\Local\\Temp\\chrome_tour_' + Date.now();
    const chrome = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1920,1080',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${profileDir}`,
        'file:///C:/Users/yuvar/OneDrive/Desktop/scrap/views.html'
    ]);

    let tab = null;
    for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 400));
        try {
            const data = await new Promise((resolve, reject) => {
                http.get(`http://localhost:${PORT}/json`, res => {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => resolve(JSON.parse(body)));
                }).on('error', reject);
            });
            tab = data.find(t => t.type === 'page' && t.url.includes('views.html'));
            if (tab) break;
        } catch (e) {}
    }

    if (!tab) {
        chrome.kill();
        throw new Error("Failed to find views.html tab");
    }

    console.log("Connected to Chrome page tab:", tab.webSocketDebuggerUrl);
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let id = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
        }
    };

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const msgId = id++;
            pending.set(msgId, { resolve, reject });
            ws.send(JSON.stringify({ id: msgId, method, params }));
        });
    }

    await new Promise(r => ws.onopen = r);
    await send('Runtime.enable');

    console.log("Waiting for WebGL canvas and 3D scene to initialize...");
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 400));
        const chk = await send('Runtime.evaluate', {
            expression: "!!document.querySelector('#canvas-container canvas')",
            returnByValue: true
        });
        if (chk.result?.value) break;
    }

    console.log("Injecting 90-second cinematic tour and starting MediaRecorder...");

    // The script in browser context records the canvas at 1920x1080 for exactly 90.0 seconds
    const recordPromise = send('Runtime.evaluate', {
        expression: `
            new Promise((resolve, reject) => {
                try {
                    const canvas = document.querySelector('#canvas-container canvas');
                    if (!canvas) return reject(new Error('Canvas not found'));

                    // Hide sidebar and floating cards for full clean broadcast frame
                    if (typeof toggleViewsSidebar === 'function') toggleViewsSidebar(false);
                    const panel = document.getElementById('panel-3d');
                    if (panel) {
                        Array.from(panel.children).forEach(child => {
                            if (child.id !== 'canvas-container') child.style.display = 'none';
                        });
                    }
                    const sidebar = document.getElementById('views-sidebar-container');
                    if (sidebar) sidebar.style.display = 'none';
                    const openBtns = document.getElementById('btn-open-list-sidebar');
                    if (openBtns) openBtns.style.display = 'none';
                    const drawerBtn = document.getElementById('btn-drawer-open-sidebar');
                    if (drawerBtn) drawerBtn.style.display = 'none';

                    // Set 1920x1080 resolution
                    const W = 1920;
                    const H = 1080;
                    if (renderer) renderer.setSize(W, H);
                    if (camera) {
                        camera.aspect = W / H;
                        camera.updateProjectionMatrix();
                    }

                    // Composite recording canvas with architectural HUD overlay
                    const recCanvas = document.createElement('canvas');
                    recCanvas.width = W;
                    recCanvas.height = H;
                    const ctx = recCanvas.getContext('2d');

                    const stream = recCanvas.captureStream(30);
                    let mimeType = 'video/webm;codecs=vp9';
                    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

                    const chunks = [];
                    const recorder = new MediaRecorder(stream, {
                        mimeType,
                        videoBitsPerSecond: 8000000 // 8 Mbps high quality
                    });

                    recorder.ondataavailable = e => {
                        if (e.data && e.data.size > 0) chunks.push(e.data);
                    };

                    recorder.onstop = () => {
                        const blob = new Blob(chunks, { type: mimeType });
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            resolve({
                                size: blob.size,
                                data: reader.result.split(',')[1]
                            });
                        };
                        reader.readAsDataURL(blob);
                    };

                    // Define Keyframes for 90 Seconds (8 Scenes)
                    const keyframes = [
                        // Scene 1: South Front Street & Elevation (0 to 12s)
                        { t: 0.0,  pos: {x: 10, y: 3.2, z: 24}, target: {x: 10, y: 2.5, z: 7}, roof: true,  floor: 'both', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "01/08", title: "SOUTH STREET ARRIVAL & EXTERIOR ELEVATION", sub: "60' × 42' Plot · 10' Full Perimeter Walls · South Main Entry Gate & Boundary Setbacks" },
                        { t: 12.0, pos: {x: 24, y: 4.8, z: 18}, target: {x: 10, y: 2.8, z: 7}, roof: true,  floor: 'both', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "01/08", title: "SOUTH STREET ARRIVAL & EXTERIOR ELEVATION", sub: "60' × 42' Plot · 10' Full Perimeter Walls · South Main Entry Gate & Boundary Setbacks" },
                        
                        // Scene 2: 360° Massing Orbit & Roof Deck (12 to 24s)
                        { t: 12.01, pos: {x: 24, y: 4.8, z: 18}, target: {x: 10, y: 2.8, z: 7}, roof: true, floor: 'both', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "02/08", title: "360° ARCHITECTURAL MASSING & ROOF SLAB", sub: "East Balcony Deck · North Rear Setback · West Stair Tower · Parapet & Central Skylight" },
                        { t: 18.0, pos: {x: 18, y: 14.0, z: -16}, target: {x: 10, y: 3.5, z: 7}, roof: true, floor: 'both', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "02/08", title: "360° ARCHITECTURAL MASSING & ROOF SLAB", sub: "East Balcony Deck · North Rear Setback · West Stair Tower · Parapet & Central Skylight" },
                        { t: 24.0, pos: {x: -4, y: 12.0, z: -6}, target: {x: 10, y: 3.5, z: 7}, roof: true, floor: 'both', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "02/08", title: "360° ARCHITECTURAL MASSING & ROOF SLAB", sub: "East Balcony Deck · North Rear Setback · West Stair Tower · Parapet & Central Skylight" },
                        
                        // Scene 3: Roof Retraction & First Floor Overview (24 to 36s)
                        { t: 24.5, pos: {x: -2, y: 9.5, z: 12}, target: {x: 10, y: 4.2, z: 7}, roof: false, floor: 'first', walls: 'full', light: 'day', theme: 'coded', exp: 0, sNum: "03/08", title: "FIRST FLOOR LAYOUT & P1 FAMILY GALLERY", sub: "Upper Bedroom Suites · P1 Family Roaming Lobby · Dual Balconies · Glass Guardrails" },
                        { t: 36.0, pos: {x: 15, y: 6.8, z: 14}, target: {x: 10, y: 4.0, z: 7}, roof: false, floor: 'first', walls: 'full', light: 'day', theme: 'coded', exp: 0, sNum: "03/08", title: "FIRST FLOOR LAYOUT & P1 FAMILY GALLERY", sub: "Upper Bedroom Suites · P1 Family Roaming Lobby · Dual Balconies · Glass Guardrails" },

                        // Scene 4: Central P2 Double-Height Void Dive (36 to 48s)
                        { t: 36.5, pos: {x: 14.2, y: 5.6, z: 8.8}, target: {x: 7.5, y: 1.8, z: 7.5}, roof: false, floor: 'both', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "04/08", title: "CENTRAL P2 DOUBLE-HEIGHT VOID (21.5 FT CORE)", sub: "Vertical Architectural Opening Connecting First Floor Directly to Ground Dining Core" },
                        { t: 48.0, pos: {x: 10.8, y: 1.8, z: 8.8}, target: {x: 7.2, y: 1.6, z: 7.5}, roof: false, floor: 'both', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "04/08", title: "CENTRAL P2 DOUBLE-HEIGHT VOID (21.5 FT CORE)", sub: "Vertical Architectural Opening Connecting First Floor Directly to Ground Dining Core" },

                        // Scene 5: Ground Floor Living Core, Dining & Kitchen (48 to 62s)
                        { t: 48.5, pos: {x: 12.0, y: 1.68, z: 12.0}, target: {x: 8.5, y: 1.6, z: 7.5}, roof: false, floor: 'ground', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "05/08", title: "GROUND FLOOR CORE — LIVING, DINING & KITCHEN", sub: "Spacious Central Dining Hall · 6-Seater Table · L-Shaped Granite Kitchen · Small God Room (Puja)" },
                        { t: 55.0, pos: {x: 6.5, y: 1.68, z: 10.5}, target: {x: 2.2, y: 1.4, z: 12.6}, roof: false, floor: 'ground', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "05/08", title: "GROUND FLOOR CORE — LIVING, DINING & KITCHEN", sub: "L-Shaped Open Kitchen Counter & Breakfast Bar · Small God Room (Mandir) on South Wall" },
                        { t: 62.0, pos: {x: 7.8, y: 1.68, z: 8.5}, target: {x: 4.5, y: 1.6, z: 4.5}, roof: false, floor: 'ground', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "05/08", title: "GROUND FLOOR CORE — LIVING, DINING & KITCHEN", sub: "Seamless Spatial Flow between Drawing Hall, Dining Table and Kitchen Core" },

                        // Scene 6: Master Bedroom Suite & Dual Staircases (62 to 74s)
                        { t: 62.5, pos: {x: 6.5, y: 1.68, z: 4.5}, target: {x: 3.2, y: 1.5, z: 2.0}, roof: false, floor: 'ground', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "06/08", title: "MASTER BEDROOM SUITE & DUAL STAIRS (REF 1–4)", sub: "33.5' × 15.5' Master Suite · Internal Attached Bathroom · King Bed & Wardrobes" },
                        { t: 68.0, pos: {x: 6.0, y: 2.2, z: 6.8}, target: {x: 1.2, y: 3.0, z: 6.8}, roof: false, floor: 'ground', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "06/08", title: "MASTER BEDROOM SUITE & DUAL STAIRS (REF 1–4)", sub: "Internal Duplex Staircase (Ref 1 → Ref 2) Rising Into P1 Upper Gallery" },
                        { t: 74.0, pos: {x: 16.8, y: 3.2, z: 4.5}, target: {x: 17.5, y: 3.8, z: 1.5}, roof: false, floor: 'both', walls: 'full', light: 'day', theme: 'realistic', exp: 0, sNum: "06/08", title: "MASTER BEDROOM SUITE & DUAL STAIRS (REF 1–4)", sub: "External Balcony Staircase (Ref 3 → Ref 4) for Independent Upper Access" },

                        // Scene 7: 3D Exploded Structural Stack View (74 to 82s)
                        { t: 74.5, pos: {x: 25, y: 12.0, z: 22}, target: {x: 10, y: 4.0, z: 7}, roof: true, floor: 'both', walls: 'full', light: 'day', theme: 'coded', exp: 3.6, sNum: "07/08", title: "3D EXPLODED STRUCTURAL STACK (3.6m LIFT)", sub: "Engineering Coordination · Vertical Alignment · Ground & First Floors Pulled Apart" },
                        { t: 82.0, pos: {x: 23, y: 14.0, z: 24}, target: {x: 10, y: 4.0, z: 7}, roof: true, floor: 'both', walls: 'full', light: 'day', theme: 'coded', exp: 3.6, sNum: "07/08", title: "3D EXPLODED STRUCTURAL STACK (3.6m LIFT)", sub: "Engineering Coordination · Vertical Alignment · Ground & First Floors Pulled Apart" },

                        // Scene 8: Dusk Lighting & Twilight Architectural Illumination (82 to 90s)
                        { t: 82.5, pos: {x: 14, y: 4.5, z: 26}, target: {x: 10, y: 3.0, z: 7}, roof: true, floor: 'both', walls: 'full', light: 'dusk', theme: 'realistic', exp: 0, sNum: "08/08", title: "DUSK ELEVATION & TWILIGHT NIGHT ILLUMINATION", sub: "Warm Interior Glow · Chandelier Illumination · Twilight Architectural Elevation" },
                        { t: 90.0, pos: {x: 10, y: 6.5, z: 32}, target: {x: 10, y: 3.5, z: 7}, roof: true, floor: 'both', walls: 'full', light: 'dusk', theme: 'realistic', exp: 0, sNum: "08/08", title: "DUSK ELEVATION & TWILIGHT NIGHT ILLUMINATION", sub: "Complete Architectural Duplex House Plan · Father & Builder Final Presentation" }
                    ];

                    // Helper to interpolate keyframes
                    function sampleKeyframe(curT) {
                        if (curT <= keyframes[0].t) return keyframes[0];
                        if (curT >= keyframes[keyframes.length - 1].t) return keyframes[keyframes.length - 1];
                        for (let i = 0; i < keyframes.length - 1; i++) {
                            const k1 = keyframes[i];
                            const k2 = keyframes[i + 1];
                            if (curT >= k1.t && curT <= k2.t) {
                                const rawU = (curT - k1.t) / (k2.t - k1.t);
                                const u = rawU * rawU * (3 - 2 * rawU); // smoothstep
                                return {
                                    pos: {
                                        x: k1.pos.x + (k2.pos.x - k1.pos.x) * u,
                                        y: k1.pos.y + (k2.pos.y - k1.pos.y) * u,
                                        z: k1.pos.z + (k2.pos.z - k1.pos.z) * u
                                    },
                                    target: {
                                        x: k1.target.x + (k2.target.x - k1.target.x) * u,
                                        y: k1.target.y + (k2.target.y - k1.target.y) * u,
                                        z: k1.target.z + (k2.target.z - k1.target.z) * u
                                    },
                                    roof: k1.roof,
                                    floor: k1.floor,
                                    walls: k1.walls,
                                    light: k1.light,
                                    theme: k1.theme,
                                    exp: k1.exp + (k2.exp - k1.exp) * u,
                                    sNum: k1.sNum,
                                    title: k1.title,
                                    sub: k1.sub
                                };
                            }
                        }
                        return keyframes[0];
                    }

                    // Start recording
                    recorder.start(100);
                    const startTime = performance.now();
                    const TOTAL_DURATION_MS = 90000; // 90 seconds exactly

                    let lastFloor = null;
                    let lastWalls = null;
                    let lastLight = null;
                    let lastTheme = null;

                    function renderStep() {
                        const elapsed = performance.now() - startTime;
                        const curSec = Math.min(elapsed / 1000, 90.0);
                        const kf = sampleKeyframe(curSec);

                        // Apply architectural state changes
                        if (kf.floor !== lastFloor || kf.walls !== lastWalls) {
                            setFloorFilter(kf.floor, kf.walls);
                            lastFloor = kf.floor;
                            lastWalls = kf.walls;
                        }
                        if (typeof roofGroup !== 'undefined') {
                            roofGroup.visible = kf.roof;
                        }
                        if (kf.light !== lastLight) {
                            setLightingMode(kf.light);
                            lastLight = kf.light;
                        }
                        if (kf.theme !== lastTheme) {
                            set3DColorTheme(kf.theme);
                            lastTheme = kf.theme;
                        }
                        if (typeof explodeOffset !== 'undefined') {
                            explodeOffset = kf.exp;
                            if (typeof firstFloorGroup !== 'undefined') firstFloorGroup.position.y = explodeOffset;
                            if (typeof roofGroup !== 'undefined') roofGroup.position.y = explodeOffset;
                        }

                        // Position camera directly
                        camera.position.set(kf.pos.x, kf.pos.y, kf.pos.z);
                        camera.lookAt(kf.target.x, kf.target.y, kf.target.z);

                        // Render 3D Scene
                        renderer.render(scene, camera);

                        // Draw WebGL onto Recording Canvas
                        ctx.drawImage(canvas, 0, 0, W, H);

                        // Draw Broadcast Cinematic HUD Overlay
                        // 1. Top Brand Banner
                        ctx.fillStyle = 'rgba(7, 13, 25, 0.88)';
                        ctx.fillRect(40, 36, 440, 52);
                        ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
                        ctx.lineWidth = 1.5;
                        ctx.strokeRect(40, 36, 440, 52);

                        ctx.fillStyle = '#10b981';
                        ctx.font = 'bold 15px sans-serif';
                        ctx.fillText('DUPLEX ARCHITECTURAL PRESENTATION', 58, 60);
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '12px monospace';
                        ctx.fillText("60' × 42' Plot · Father & Builder Final Edition", 58, 77);

                        // 2. Top-Right Timecode & Progress
                        const tcWidth = 260;
                        ctx.fillStyle = 'rgba(7, 13, 25, 0.88)';
                        ctx.fillRect(W - tcWidth - 40, 36, tcWidth, 52);
                        ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
                        ctx.strokeRect(W - tcWidth - 40, 36, tcWidth, 52);

                        const mm = String(Math.floor(curSec / 60)).padStart(2, '0');
                        const ss = String(Math.floor(curSec % 60)).padStart(2, '0');
                        ctx.fillStyle = '#f8fafc';
                        ctx.font = 'bold 18px monospace';
                        ctx.fillText(mm + ':' + ss + ' / 01:30', W - tcWidth - 20, 62);
                        ctx.fillStyle = '#10b981';
                        ctx.font = 'bold 11px sans-serif';
                        ctx.fillText('90s 1080P MASTER TOUR', W - tcWidth - 20, 78);

                        // Top Progress Bar Line
                        const progress = curSec / 90.0;
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                        ctx.fillRect(0, 0, W, 5);
                        const grad = ctx.createLinearGradient(0, 0, W * progress, 0);
                        grad.addColorStop(0, '#10b981');
                        grad.addColorStop(1, '#38bdf8');
                        ctx.fillStyle = grad;
                        ctx.fillRect(0, 0, W * progress, 5);

                        // 3. Bottom Cinematic Title Card
                        ctx.fillStyle = 'rgba(7, 13, 25, 0.92)';
                        ctx.fillRect(40, H - 128, W - 80, 88);
                        ctx.strokeStyle = 'rgba(30, 41, 59, 0.9)';
                        ctx.strokeRect(40, H - 128, W - 80, 88);

                        // Left vertical accent bar
                        ctx.fillStyle = '#10b981';
                        ctx.fillRect(40, H - 128, 6, 88);

                        // Scene Number Badge
                        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
                        ctx.fillRect(65, H - 116, 88, 24);
                        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
                        ctx.strokeRect(65, H - 116, 88, 24);
                        ctx.fillStyle = '#6ee7b7';
                        ctx.font = 'bold 11px monospace';
                        ctx.fillText(kf.sNum, 75, H - 100);

                        // Scene Title
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 20px sans-serif';
                        ctx.fillText(kf.title, 168, H - 98);

                        // Scene Subtitle Description
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '14px sans-serif';
                        ctx.fillText(kf.sub, 65, H - 62);

                        if (curSec < 90.0) {
                            requestAnimationFrame(renderStep);
                        } else {
                            setTimeout(() => recorder.stop(), 500);
                        }
                    }

                    renderStep();
                } catch (err) {
                    resolve({ error: err.message, stack: err.stack });
                }
            })
        `,
        awaitPromise: true,
        returnByValue: true
    });

    console.log("Recording in progress for 90 seconds (please wait)...");
    const result = await recordPromise;
    console.log("Result:", JSON.stringify(result, null, 2));

    if (result.result?.value?.error) {
        console.error("Browser error during tour:", result.result.value.error);
        console.error(result.result.value.stack);
        ws.close();
        chrome.kill();
        process.exit(1);
    }

    console.log(`Recording complete! Received WebM size: ${result.result?.value?.size} bytes.`);
    const webmPath = 'C:\\Users\\yuvar\\OneDrive\\Desktop\\scrap\\house_plan_tour_90s.webm';
    fs.writeFileSync(webmPath, Buffer.from(result.result.value.data, 'base64'));
    console.log("Saved raw recording:", webmPath);

    ws.close();
    chrome.kill();

    // Now convert to broadcast MP4 with imageio_ffmpeg
    console.log("Encoding pristine H.264 MP4 using FFmpeg...");
    const pythonScript = `
import subprocess, imageio_ffmpeg
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
cmd = [
    ffmpeg_exe, '-y',
    '-i', 'house_plan_tour_90s.webm',
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-r', '30',
    '-movflags', '+faststart',
    'final_house_plan_90s_tour.mp4'
]
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode != 0:
    print("FFmpeg Error:", res.stderr)
    exit(1)
print("FFmpeg encoding completed successfully!")
`;

    fs.writeFileSync('C:\\Users\\yuvar\\OneDrive\\Desktop\\scrap\\convert_to_mp4.py', pythonScript);
    const ffmpegProc = spawn('python', ['convert_to_mp4.py'], { cwd: 'C:\\Users\\yuvar\\OneDrive\\Desktop\\scrap' });

    ffmpegProc.stdout.on('data', d => console.log(d.toString()));
    ffmpegProc.stderr.on('data', d => console.error(d.toString()));

    await new Promise((resolve, reject) => {
        ffmpegProc.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error('FFmpeg failed with code ' + code));
        });
    });

    const stat = fs.statSync('C:\\Users\\yuvar\\OneDrive\\Desktop\\scrap\\final_house_plan_90s_tour.mp4');
    console.log("🎉 SUCCESS! Generated final_house_plan_90s_tour.mp4 with size:", stat.size, "bytes");

    // Clean up temporary files
    try {
        fs.unlinkSync('C:\\Users\\yuvar\\OneDrive\\Desktop\\scrap\\convert_to_mp4.py');
        fs.unlinkSync('C:\\Users\\yuvar\\OneDrive\\Desktop\\scrap\\house_plan_tour_90s.webm');
    } catch (e) {}

    console.log("====================================================");
    console.log("✅ 90-SECOND ARCHITECTURAL MP4 TOUR READY!");
    console.log("====================================================");
}

main().catch(err => {
    console.error("Fatal tour generation error:", err);
    process.exit(1);
});
