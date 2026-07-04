const stacksData = [
    { name: "Flutter", icon: "assets/images/flutter.svg", desc: "Primary mobile framework" },
    { name: "Dart", icon: "assets/images/dart.svg", desc: "Core language for Flutter" },
    { name: "Android Studio", icon: "assets/images/android-studio.svg", desc: "Android development" },
    { name: "Xcode", icon: "assets/images/xcode.svg", desc: "iOS development" },
    { name: "Delphi", icon: "assets/images/delphi.png", desc: "Desktop & ERP systems" },
    { name: "Oracle PL/SQL", icon: "assets/images/oracle.svg", desc: "Database & legacy systems" }
];

function renderStacks() {
    const grid = document.getElementById('stacks-grid');
    if (!grid) return;

    grid.innerHTML = stacksData.map(stack => `
        <div class="glass-card stack-item">
            <img src="${stack.icon}" alt="${stack.name}" class="stack-icon" onerror="this.src='assets/images/github.svg';">
            <span class="stack-name">${stack.name}</span>
            <span class="stack-desc">${stack.desc}</span>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', renderStacks);
