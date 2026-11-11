/* ═══════════════════════════════════════════════════════════
   KarthiOS Portfolio — Desktop Environment Engine
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // ── State ─────────────────────────────────────────────
    let windowZIndex = 100;
    let activeWindow = null;
    const windowPositions = {};
    const openWindows = new Set();

    // ── Boot Sequence ─────────────────────────────────────
    function bootSequence() {
        const bootScreen = document.getElementById('boot-screen');
        const desktop = document.getElementById('desktop');
        const lines = document.querySelectorAll('.boot-line');
        const progressBar = document.querySelector('.boot-progress-bar');

        let delay = 400;
        lines.forEach((line, i) => {
            setTimeout(() => {
                line.classList.add('visible');
                progressBar.style.width = `${((i + 1) / lines.length) * 100}%`;
            }, delay);
            delay += 350 + Math.random() * 200;
        });

        setTimeout(() => {
            bootScreen.style.transition = 'opacity 0.5s ease';
            bootScreen.style.opacity = '0';
            setTimeout(() => {
                bootScreen.style.display = 'none';
                desktop.classList.remove('hidden');
                desktop.style.animation = 'fadeIn 0.5s ease';

                // Auto-open About window on desktop load
                setTimeout(() => openWindow('about'), 300);
            }, 500);
        }, delay + 400);
    }

    bootSequence();

    // ── Clock ─────────────────────────────────────────────
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        const clockEl = document.getElementById('taskbar-clock');
        clockEl.querySelector('.clock-time').textContent = timeStr;
        clockEl.querySelector('.clock-date').textContent = dateStr;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // ── Window Management ────────────────────────────────

    function getDefaultPosition(windowId) {
        const container = document.getElementById('windows-container');
        const cw = container.clientWidth;
        const ch = container.clientHeight;

        const positions = {
            'about':     { width: 780, height: 500, x: null, y: null },
            'terminal':  { width: 700, height: 450, x: null, y: null },
            'projects':  { width: 850, height: 550, x: null, y: null },
            'skills':    { width: 750, height: 550, x: null, y: null },
            'education': { width: 800, height: 480, x: null, y: null },
            'contact':   { width: 800, height: 500, x: null, y: null },
        };

        const pos = positions[windowId] || { width: 700, height: 450 };
        const w = Math.min(pos.width, cw - 40);
        const h = Math.min(pos.height, ch - 40);

        // Cascade offset based on open window count
        const offset = openWindows.size * 30;
        const x = pos.x !== null ? pos.x : Math.max(20, (cw - w) / 2 + offset);
        const y = pos.y !== null ? pos.y : Math.max(20, (ch - h) / 2 + offset);

        return { x, y, width: w, height: h };
    }

    function openWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (!win) return;

        if (openWindows.has(windowId)) {
            // If minimized (hidden), show it
            if (win.style.display === 'none') {
                win.style.display = 'flex';
            }
            bringToFront(win, windowId);
            return;
        }

        // Position
        const pos = windowPositions[windowId] || getDefaultPosition(windowId);
        win.style.left = `${pos.x}px`;
        win.style.top = `${pos.y}px`;
        win.style.width = `${pos.width}px`;
        win.style.height = `${pos.height}px`;
        win.style.display = 'flex';

        openWindows.add(windowId);
        bringToFront(win, windowId);
        updateTaskbar();

        // Animate skill bars if skills window
        if (windowId === 'skills') {
            setTimeout(animateSkillBars, 300);
        }

        // Focus terminal input if terminal
        if (windowId === 'terminal') {
            setTimeout(() => {
                document.getElementById('terminal-input')?.focus();
            }, 100);
        }
    }

    function closeWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (!win) return;

        win.style.animation = 'windowClose 0.2s ease forwards';
        setTimeout(() => {
            win.style.display = 'none';
            win.style.animation = '';
            win.classList.remove('maximized');
            openWindows.delete(windowId);
            updateTaskbar();
            if (activeWindow === windowId) activeWindow = null;
        }, 200);
    }

    function minimizeWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (!win) return;

        win.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        win.style.transform = 'scale(0.9)';
        win.style.opacity = '0';
        setTimeout(() => {
            win.style.display = 'none';
            win.style.transform = '';
            win.style.opacity = '';
            win.style.transition = '';
        }, 200);
    }

    function maximizeWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (!win) return;

        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            const pos = windowPositions[windowId] || getDefaultPosition(windowId);
            win.style.left = `${pos.x}px`;
            win.style.top = `${pos.y}px`;
            win.style.width = `${pos.width}px`;
            win.style.height = `${pos.height}px`;
        } else {
            // Save current position
            windowPositions[windowId] = {
                x: parseInt(win.style.left),
                y: parseInt(win.style.top),
                width: parseInt(win.style.width),
                height: parseInt(win.style.height),
            };
            win.classList.add('maximized');
        }
    }

    function bringToFront(win, windowId) {
        windowZIndex++;
        win.style.zIndex = windowZIndex;

        // Remove active from all windows
        document.querySelectorAll('.window').forEach(w => w.classList.remove('active-window'));
        win.classList.add('active-window');
        activeWindow = windowId;
        updateTaskbar();
    }

    // ── Taskbar ───────────────────────────────────────────
    function updateTaskbar() {
        const taskbarApps = document.getElementById('taskbar-apps');
        taskbarApps.innerHTML = '';

        const iconMap = {
            'about': 'fa-user-circle',
            'terminal': 'fa-terminal',
            'projects': 'fa-folder-open',
            'skills': 'fa-code',
            'education': 'fa-graduation-cap',
            'contact': 'fa-envelope',
        };

        const nameMap = {
            'about': 'About Me',
            'terminal': 'Terminal',
            'projects': 'Projects',
            'skills': 'Skills',
            'education': 'Education',
            'contact': 'Contact',
        };

        openWindows.forEach(id => {
            const tab = document.createElement('div');
            tab.className = `taskbar-app ${activeWindow === id ? 'active' : ''}`;
            tab.innerHTML = `<i class="fas ${iconMap[id] || 'fa-window-maximize'}"></i> <span>${nameMap[id] || id}</span>`;
            tab.addEventListener('click', () => {
                const win = document.getElementById(`window-${id}`);
                if (win.style.display === 'none') {
                    win.style.display = 'flex';
                    win.style.transform = '';
                    win.style.opacity = '';
                }
                bringToFront(win, id);
            });
            taskbarApps.appendChild(tab);
        });
    }

    // ── Skill Bar Animation ───────────────────────────────
    function animateSkillBars() {
        document.querySelectorAll('.skill-fill').forEach(bar => {
            const level = bar.getAttribute('data-level');
            bar.style.width = `${level}%`;
        });
    }

    // ── Window Dragging ───────────────────────────────────
    function makeDraggable(win) {
        const titlebar = win.querySelector('.window-titlebar');
        let isDragging = false;
        let startX, startY, initialX, initialY;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('control')) return;
            if (win.classList.contains('maximized')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = parseInt(win.style.left) || 0;
            initialY = parseInt(win.style.top) || 0;

            const windowId = win.id.replace('window-', '');
            bringToFront(win, windowId);

            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            e.preventDefault();
        });

        function onDrag(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            win.style.left = `${initialX + dx}px`;
            win.style.top = `${initialY + dy}px`;
        }

        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);

            // Save position
            const windowId = win.id.replace('window-', '');
            windowPositions[windowId] = {
                x: parseInt(win.style.left),
                y: parseInt(win.style.top),
                width: parseInt(win.style.width),
                height: parseInt(win.style.height),
            };
        }

        // Touch support
        titlebar.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('control')) return;
            if (win.classList.contains('maximized')) return;

            const touch = e.touches[0];
            isDragging = true;
            startX = touch.clientX;
            startY = touch.clientY;
            initialX = parseInt(win.style.left) || 0;
            initialY = parseInt(win.style.top) || 0;

            const windowId = win.id.replace('window-', '');
            bringToFront(win, windowId);

            document.addEventListener('touchmove', onTouchDrag, { passive: false });
            document.addEventListener('touchend', stopTouchDrag);
        });

        function onTouchDrag(e) {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            win.style.left = `${initialX + dx}px`;
            win.style.top = `${initialY + dy}px`;
        }

        function stopTouchDrag() {
            isDragging = false;
            document.removeEventListener('touchmove', onTouchDrag);
            document.removeEventListener('touchend', stopTouchDrag);
        }
    }

    // ── Window Resizing ───────────────────────────────────
    function makeResizable(win) {
        const resizeHandle = document.createElement('div');
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0; right: 0;
            width: 16px; height: 16px;
            cursor: nwse-resize;
            z-index: 10;
        `;
        win.appendChild(resizeHandle);

        let isResizing = false;
        let startX, startY, startW, startH;

        resizeHandle.addEventListener('mousedown', (e) => {
            if (win.classList.contains('maximized')) return;
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startW = parseInt(win.style.width) || win.offsetWidth;
            startH = parseInt(win.style.height) || win.offsetHeight;

            document.addEventListener('mousemove', onResize);
            document.addEventListener('mouseup', stopResize);
            e.preventDefault();
            e.stopPropagation();
        });

        function onResize(e) {
            if (!isResizing) return;
            const newW = Math.max(400, startW + (e.clientX - startX));
            const newH = Math.max(300, startH + (e.clientY - startY));
            win.style.width = `${newW}px`;
            win.style.height = `${newH}px`;
        }

        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', onResize);
            document.removeEventListener('mouseup', stopResize);
        }
    }

    // Initialize all windows
    document.querySelectorAll('.window').forEach(win => {
        makeDraggable(win);
        makeResizable(win);

        // Click to focus
        win.addEventListener('mousedown', () => {
            const windowId = win.id.replace('window-', '');
            bringToFront(win, windowId);
        });
    });

    // ── Window Controls ───────────────────────────────────
    document.querySelectorAll('.control').forEach(ctrl => {
        ctrl.addEventListener('click', (e) => {
            e.stopPropagation();
            const win = ctrl.closest('.window');
            const windowId = win.id.replace('window-', '');
            const action = ctrl.getAttribute('data-action');

            if (action === 'close') closeWindow(windowId);
            else if (action === 'minimize') minimizeWindow(windowId);
            else if (action === 'maximize') maximizeWindow(windowId);
        });
    });

    // ── Desktop Icons ─────────────────────────────────────
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('dblclick', () => {
            const windowId = icon.getAttribute('data-window');
            openWindow(windowId);
        });

        // Single click on mobile
        let clickTimer = null;
        icon.addEventListener('click', () => {
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
                return; // double click handled
            }
            clickTimer = setTimeout(() => {
                clickTimer = null;
                // Single click — just focus highlight
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
            }, 300);
        });

        // Touch: single tap opens
        icon.addEventListener('touchend', (e) => {
            e.preventDefault();
            const windowId = icon.getAttribute('data-window');
            openWindow(windowId);
        });
    });

    // ── Start Menu ────────────────────────────────────────
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('hidden');
    });

    document.querySelectorAll('.start-item').forEach(item => {
        item.addEventListener('click', () => {
            const windowId = item.getAttribute('data-window');
            openWindow(windowId);
            startMenu.classList.add('hidden');
        });
    });

    // Close start menu on outside click
    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            startMenu.classList.add('hidden');
        }
    });

    // ── Context Menu ──────────────────────────────────────
    const contextMenu = document.getElementById('context-menu');

    document.querySelector('.wallpaper').addEventListener('contextmenu', (e) => {
        e.preventDefault();
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.classList.remove('hidden');
    });

    document.addEventListener('click', () => {
        contextMenu.classList.add('hidden');
    });

    document.querySelectorAll('.context-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            if (action === 'open-terminal') openWindow('terminal');
            else if (action === 'open-about') openWindow('about');
            else if (action === 'toggle-theme') toggleTheme();
            else if (action === 'change-wallpaper') cycleWallpaper();
            else if (action === 'refresh') location.reload();
            contextMenu.classList.add('hidden');
        });
    });

    // ── Theme Toggle ──────────────────────────────────────
    let isDark = true;
    const themeToggle = document.getElementById('theme-toggle');

    function toggleTheme() {
        isDark = !isDark;
        document.body.classList.toggle('light-theme');
        themeToggle.querySelector('i').className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    }

    themeToggle.addEventListener('click', toggleTheme);

    // ── Wallpaper Cycling ─────────────────────────────────
    const wallpapers = [
        'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        'linear-gradient(135deg, #0a2647 0%, #144272 50%, #205295 100%)',
        'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        'linear-gradient(135deg, #2d1b4e 0%, #1a1333 50%, #0d0d2b 100%)',
        'linear-gradient(135deg, #0b3d0b 0%, #1a4d1a 50%, #0d2b0d 100%)',
        'linear-gradient(135deg, #2c1810 0%, #3d1f15 50%, #1a0f0a 100%)',
    ];
    let wpIndex = 0;

    function cycleWallpaper() {
        wpIndex = (wpIndex + 1) % wallpapers.length;
        document.querySelector('.wallpaper').style.background = wallpapers[wpIndex];
    }

    // ═══════════════════════════════════════════════════════
    // TERMINAL ENGINE
    // ═══════════════════════════════════════════════════════
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const commandHistory = [];
    let historyIndex = -1;

    const resumeData = {
        name: 'Karthi',
        role: 'Engineering Student | Cybersecurity, AI and Software Development',
        college: 'Sri Sakthi Institute of Engineering and Technology',
        degree: 'B.E. Computer Science and Engineering (Cyber Security)',
        graduation: '2028 (Expected)',
        location: 'Coimbatore, India',
        email: 'kkeyan0575@gmail.com',
        phone: '9345513604',
        linkedin: 'https://www.linkedin.com/in/karthi-keyan-0a7941329/',
    };

    const commands = {
        help: () => {
            return `<span class="term-cyan term-bold">Available Commands:</span>

  <span class="term-green">about</span>        — About me
  <span class="term-green">skills</span>       — Technical skills
  <span class="term-green">projects</span>     — My projects
  <span class="term-green">education</span>    — Education details
  <span class="term-green">contact</span>      — Contact information
  <span class="term-green">experience</span>   — Work experience & practice
  <span class="term-green">tools</span>        — Tools & platforms I use
  <span class="term-green">strengths</span>    — Additional strengths
  <span class="term-green">resume</span>       — Full resume summary
  <span class="term-green">social</span>       — Social links
  <span class="term-green">whoami</span>       — Who am I?
  <span class="term-green">uname</span>        — System info
  <span class="term-green">date</span>         — Current date & time
  <span class="term-green">neofetch</span>     — System info (fancy)
  <span class="term-green">ls</span>           — List files
  <span class="term-green">cat</span>          — Read a file (try: cat about.txt)
  <span class="term-green">pwd</span>          — Print working directory
  <span class="term-green">echo</span>         — Echo text
  <span class="term-green">open</span>         — Open a window (e.g., open about)
  <span class="term-green">theme</span>        — Toggle dark/light theme
  <span class="term-green">wallpaper</span>    — Change wallpaper
  <span class="term-green">clear</span>        — Clear terminal
  <span class="term-green">history</span>      — Command history
  <span class="term-green">exit</span>         — Close terminal`;
        },

        about: () => {
            return `<span class="term-cyan term-bold">┌─── About Karthi ───────────────────────┐</span>
<span class="term-cyan">│</span>
<span class="term-cyan">│</span>  <span class="term-bold">${resumeData.name}</span>
<span class="term-cyan">│</span>  ${resumeData.role}
<span class="term-cyan">│</span>
<span class="term-cyan">│</span>  Engineering student with practical interests
<span class="term-cyan">│</span>  in cybersecurity, AI and software development.
<span class="term-cyan">│</span>  Builds hands-on projects and practices
<span class="term-cyan">│</span>  security analysis in lab environments.
<span class="term-cyan">│</span>
<span class="term-cyan">│</span>  <span class="term-yellow">📍</span> ${resumeData.location}
<span class="term-cyan">│</span>  <span class="term-yellow">🎓</span> ${resumeData.college}
<span class="term-cyan">│</span>
<span class="term-cyan">└────────────────────────────────────────┘</span>`;
        },

        skills: () => {
            return `<span class="term-cyan term-bold">Technical Skills</span>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<span class="term-green">▸ Programming & Dev:</span>   C, Python, Flask, Web Dev, MongoDB
<span class="term-green">▸ Cybersecurity:</span>       Networking, CTF, Cryptography, Web Security,
                        Digital Forensics, Reverse Eng., SOC
<span class="term-green">▸ Tools & Platforms:</span>   Linux, Kali, Nmap, Wireshark, Ghidra,
                        Git, Docker, Jenkins
<span class="term-green">▸ AI & Data:</span>           ML Fundamentals, AI Applications,
                        Face Recognition`;
        },

        projects: () => {
            return `<span class="term-cyan term-bold">Selected Projects</span>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<span class="term-purple">📂 Project K Automator</span> <span class="term-yellow">[CI/CD & Automation]</span>
   Software automation platform — Git integration,
   Docker builds, Jenkins pipelines. Python + Vue.js

<span class="term-purple">📂 ML Exam Monitoring</span> <span class="term-yellow">[Machine Learning]</span>
   Academic integrity project — ML-based exam
   monitoring and plagiarism detection

<span class="term-purple">📂 Face-Recognition Assistant</span> <span class="term-yellow">[AI / CV]</span>
   Applied AI project combining software dev
   with computer-vision concepts

<span class="term-purple">📂 Cybersecurity Practice</span> <span class="term-yellow">[Security & CTF]</span>
   CTF challenges, SOC skills, lab-based
   security monitoring & alert investigation`;
        },

        education: () => {
            return `<span class="term-cyan term-bold">Education</span>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<span class="term-green">🎓 ${resumeData.college}</span>
   ${resumeData.degree}
   Expected graduation: <span class="term-yellow">${resumeData.graduation}</span>
   📍 ${resumeData.location}`;
        },

        contact: () => {
            return `<span class="term-cyan term-bold">Contact Information</span>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  <span class="term-green">📧 Email:</span>    ${resumeData.email}
  <span class="term-green">📱 Phone:</span>    ${resumeData.phone}
  <span class="term-green">🔗 LinkedIn:</span> ${resumeData.linkedin}
  <span class="term-green">📍 Location:</span> ${resumeData.location}`;
        },

        experience: () => {
            return `<span class="term-cyan term-bold">Cybersecurity Practice & Experience</span>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<span class="term-green">▸</span> CTF challenges: cryptography, web exploitation,
  digital forensics, reverse engineering
<span class="term-green">▸</span> SOC skills: lab-based alert investigation,
  Windows event-log analysis, security monitoring
<span class="term-green">▸</span> Uses VMs and authorized lab targets for
  network and application security practice`;
        },

        tools: () => {
            return `<span class="term-cyan term-bold">Tools & Platforms</span>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  <span class="term-orange">🐧</span> Linux / Kali Linux
  <span class="term-orange">🔍</span> Nmap — Network scanning
  <span class="term-orange">🦈</span> Wireshark — Packet analysis
  <span class="term-orange">👻</span> Ghidra — Reverse engineering
  <span class="term-orange">📦</span> Git — Version control
  <span class="term-orange">🐳</span> Docker — Containerization
  <span class="term-orange">🏗️</span> Jenkins — CI/CD pipelines`;
        },

        strengths: () => {
            return `<span class="term-cyan term-bold">Additional Strengths</span>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  <span class="term-green">✦</span> Hands-on learner
  <span class="term-green">✦</span> Problem solving
  <span class="term-green">✦</span> Technical curiosity
  <span class="term-green">✦</span> Independent project work`;
        },

        resume: () => {
            return commands.about() + '\n\n' + commands.skills() + '\n\n' + commands.projects();
        },

        social: () => {
            return `<span class="term-cyan term-bold">Social Links</span>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  <span class="term-blue">LinkedIn:</span> <a href="${resumeData.linkedin}" target="_blank" style="color: var(--accent-cyan); text-decoration: underline;">${resumeData.linkedin}</a>
  <span class="term-blue">Email:</span>    <a href="mailto:${resumeData.email}" style="color: var(--accent-cyan); text-decoration: underline;">${resumeData.email}</a>`;
        },

        whoami: () => `<span class="term-green">${resumeData.name.toLowerCase()}</span>`,

        pwd: () => `/home/karthi/portfolio`,

        uname: () => `KarthiOS 2.0.0-portfolio x86_64 GNU/Linux`,

        date: () => `<span class="term-yellow">${new Date().toString()}</span>`,

        ls: () => {
            return `<span class="term-blue">about.txt</span>    <span class="term-blue">skills.md</span>    <span class="term-blue">projects/</span>    <span class="term-blue">education.conf</span>
<span class="term-blue">contact.txt</span>  <span class="term-blue">resume.pdf</span>   <span class="term-blue">.bashrc</span>       <span class="term-blue">README.md</span>`;
        },

        neofetch: () => {
            return `<span class="term-green">        .--.         </span>  <span class="term-green term-bold">karthi</span>@<span class="term-cyan term-bold">portfolio</span>
<span class="term-green">       |o_o |        </span>  ──────────────────
<span class="term-green">       |:_/ |        </span>  <span class="term-green">OS:</span>     KarthiOS 2.0
<span class="term-green">      //   \\ \\       </span>  <span class="term-green">Host:</span>   Portfolio Site
<span class="term-green">     (|     | )      </span>  <span class="term-green">Kernel:</span> 6.1.0-karthi
<span class="term-green">    /'\\_   _/\`\\     </span>  <span class="term-green">Shell:</span>  karthish 2.0
<span class="term-green">    \\___)=(___/      </span>  <span class="term-green">DE:</span>     KarthiDE
                       <span class="term-green">WM:</span>     Portfolio WM
                       <span class="term-green">Theme:</span>  ${isDark ? 'Dark Cyber' : 'Light Mode'}
                       <span class="term-green">Icons:</span>  FontAwesome 6
                       <span class="term-green">Font:</span>   JetBrains Mono
                       <span class="term-green">CPU:</span>    Brain v${resumeData.name}
                       <span class="term-green">Memory:</span> ∞ / ∞ MB

  <span style="background:#f85149;color:#f85149">██</span><span style="background:#d29922;color:#d29922">██</span><span style="background:#3fb950;color:#3fb950">██</span><span style="background:#58a6ff;color:#58a6ff">██</span><span style="background:#bc8cff;color:#bc8cff">██</span><span style="background:#39d2c0;color:#39d2c0">██</span><span style="background:#f0883e;color:#f0883e">██</span><span style="background:#e6edf3;color:#e6edf3">██</span>`;
        },

        clear: () => {
            terminalOutput.innerHTML = '';
            return null;
        },

        history: () => {
            if (commandHistory.length === 0) return '<span class="term-yellow">No commands in history.</span>';
            return commandHistory.map((cmd, i) => `  <span class="term-yellow">${i + 1}</span>  ${cmd}`).join('\n');
        },

        exit: () => {
            closeWindow('terminal');
            return null;
        },

        theme: () => {
            toggleTheme();
            return `<span class="term-green">Theme switched to ${isDark ? 'dark' : 'light'} mode.</span>`;
        },

        wallpaper: () => {
            cycleWallpaper();
            return `<span class="term-green">Wallpaper changed.</span>`;
        },
    };

    // Handle 'cat' command
    function handleCat(args) {
        const files = {
            'about.txt': commands.about,
            'skills.md': commands.skills,
            'contact.txt': commands.contact,
            'education.conf': commands.education,
            'resume.pdf': commands.resume,
            '.bashrc': () => `# KarthiOS .bashrc\nexport PS1="\\[\\033[32m\\]karthi\\[\\033[0m\\]@\\[\\033[36m\\]portfolio\\[\\033[0m\\]:\\w\\$ "\nalias ll='ls -la'\nalias projects='cd ~/projects'`,
            'README.md': () => `# Karthi's Portfolio\n\nWelcome to my portfolio! Built as a Linux desktop environment.\nExplore using the terminal or the desktop icons.\n\n© 2026 Karthi. All rights reserved.`,
        };

        if (!args || args.length === 0) {
            return '<span class="term-red">cat: missing operand</span>';
        }

        const fileName = args.join(' ');
        if (files[fileName]) {
            return files[fileName]();
        }
        return `<span class="term-red">cat: ${fileName}: No such file or directory</span>`;
    }

    // Handle 'echo' command
    function handleEcho(args) {
        return args.join(' ');
    }

    // Handle 'open' command
    function handleOpen(args) {
        if (!args || args.length === 0) {
            return '<span class="term-red">Usage: open &lt;window&gt; (about, terminal, projects, skills, education, contact)</span>';
        }
        const windowId = args[0].toLowerCase();
        const valid = ['about', 'terminal', 'projects', 'skills', 'education', 'contact'];
        if (valid.includes(windowId)) {
            openWindow(windowId);
            return `<span class="term-green">Opening ${windowId}...</span>`;
        }
        return `<span class="term-red">Unknown window: ${windowId}</span>`;
    }

    function processCommand(input) {
        const trimmed = input.trim();
        if (!trimmed) return null;

        commandHistory.push(trimmed);
        historyIndex = commandHistory.length;

        const parts = trimmed.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (commands[cmd]) {
            return commands[cmd]();
        }

        if (cmd === 'cat') return handleCat(args);
        if (cmd === 'echo') return handleEcho(args);
        if (cmd === 'open') return handleOpen(args);
        if (cmd === 'sudo') return `<span class="term-red">[sudo] password for karthi: Nice try! 😄</span>`;
        if (cmd === 'rm') return `<span class="term-red">Permission denied: This portfolio is read-only!</span>`;
        if (cmd === 'cd') return ''; // silently accept
        if (cmd === 'man') return `<span class="term-yellow">No manual entry for ${args[0] || 'unknown'}. Try 'help'.</span>`;
        if (cmd === 'vim' || cmd === 'nano' || cmd === 'vi') return `<span class="term-yellow">${cmd}: command not found (try the GUI! 😉)</span>`;
        if (cmd === 'hack') return `<span class="term-red">⚠ Access Denied. This is a portfolio, not a CTF challenge! 🛡️</span>`;
        if (cmd === 'hello' || cmd === 'hi') return `<span class="term-green">Hello! Welcome to Karthi's portfolio! Type 'help' to explore. 👋</span>`;

        return `<span class="term-red">Command not found: ${cmd}</span>. Type <span class="term-cyan">'help'</span> for available commands.`;
    }

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const input = terminalInput.value;

            // Show command
            const cmdLine = document.createElement('div');
            cmdLine.className = 'cmd-line';
            cmdLine.innerHTML = `<span class="terminal-prompt"><span class="term-green">karthi</span>@<span class="term-cyan">portfolio</span>:~$ </span>${escapeHtml(input)}`;
            terminalOutput.appendChild(cmdLine);

            // Process & show output
            const output = processCommand(input);
            if (output !== null && output !== '') {
                const outputDiv = document.createElement('div');
                outputDiv.className = 'cmd-output';
                outputDiv.innerHTML = output;
                terminalOutput.appendChild(outputDiv);
            }

            terminalInput.value = '';
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }

        // Command history navigation
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                terminalInput.value = commandHistory[historyIndex];
            }
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminalInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                terminalInput.value = '';
            }
        }

        // Tab completion
        if (e.key === 'Tab') {
            e.preventDefault();
            const current = terminalInput.value.trim().toLowerCase();
            const allCmds = [...Object.keys(commands), 'cat', 'echo', 'open', 'sudo', 'cd', 'man', 'vim', 'nano'];
            const matches = allCmds.filter(c => c.startsWith(current));
            if (matches.length === 1) {
                terminalInput.value = matches[0];
            } else if (matches.length > 1) {
                const outputDiv = document.createElement('div');
                outputDiv.className = 'cmd-output';
                outputDiv.innerHTML = matches.map(m => `<span class="term-green">${m}</span>`).join('  ');
                terminalOutput.appendChild(outputDiv);
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
            }
        }
    });

    // Focus terminal when terminal window is clicked
    document.getElementById('window-terminal')?.addEventListener('click', () => {
        terminalInput.focus();
    });

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── Keyboard Shortcuts ────────────────────────────────
    document.addEventListener('keydown', (e) => {
        // Ctrl+` opens terminal
        if (e.ctrlKey && e.key === '`') {
            e.preventDefault();
            openWindow('terminal');
        }
    });
});
