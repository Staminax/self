const stacksData = [
    { name: "Flutter", icon: "assets/images/flutter.svg" },
    { name: "Dart", icon: "assets/images/dart.svg" },
    { name: "Android Studio", icon: "assets/images/android-studio.svg" },
    { name: "Xcode", icon: "assets/images/xcode.svg" },
    { name: "Delphi", icon: "assets/images/delphi.png" },
    { name: "Oracle PL/SQL", icon: "assets/images/oracle.svg" }
];

function renderStacks() {
    const grid = document.getElementById('stacks-grid');
    if (!grid) return;

    grid.innerHTML = stacksData.map(stack => `
        <div class="glass-card stack-item">
            <img src="${stack.icon}" alt="${stack.name}" class="stack-icon" onerror="this.src='assets/images/github.svg';">
            <span class="stack-name">${stack.name}</span>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', renderStacks);
