let saveEl = document.getElementById("save-el");
let countEl = document.getElementById("count-el");
let count = 0;

function increment() {
    count += 1;
    countEl.textContent = count;
    countEl.style.transform = "scale(1.1)"; // Animation effect
    setTimeout(() => {
        countEl.style.transform = "scale(1)"; // Reset scale
    }, 200);
}

function save() {
    let countStr = count + " - ";
    saveEl.textContent += countStr;
    countEl.textContent = 0;
    count = 0;
    localStorage.setItem('previousEntries', saveEl.textContent); // Save to local storage
}

function reset() {
    count = 0;
    countEl.textContent = count;
    saveEl.textContent = "Previous Entries: "; // Clear previous entries
    localStorage.removeItem('previousEntries'); // Clear local storage
}

// Load previous entries from local storage on page load
window.onload = function() {
    const previousEntries = localStorage.getItem('previousEntries');
    if (previousEntries) {
        saveEl.textContent += previousEntries;
    }
}
