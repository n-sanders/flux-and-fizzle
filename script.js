// script.js
let currentScenario;
let currentStopIndex = 0;
let svgDoc;
let currentTheme = 'default';

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
  setupMap();
  
  // Set up event listeners for navigation links
  document.getElementById('scenario-cloud-fireworks').addEventListener('click', (e) => {
    e.preventDefault();
    loadScenario('cloud-fireworks');
    updateActiveNavLink('scenario-cloud-fireworks');
  });
  
  document.getElementById('scenario-flux-o-graph').addEventListener('click', (e) => {
    e.preventDefault();
    loadScenario('flux-o-graph');
    updateActiveNavLink('scenario-flux-o-graph');
  });
  
  document.getElementById('welcome').addEventListener('click', (e) => {
    e.preventDefault();
    showInitialMessage();
    updateActiveNavLink('welcome');
  });
  
  // Set up event listeners for theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      setTheme(theme);
      localStorage.setItem('preferredTheme', theme);
    });
  });
  
  // Load saved theme if any
  const savedTheme = localStorage.getItem('preferredTheme');
  if (savedTheme) {
    setTheme(savedTheme);
  }
  
  // Show initial message instead of loading a default scenario
  showInitialMessage();
});

// Show initial message before any scenario is selected
function showInitialMessage() {
  // Reset any existing scenario data
  currentScenario = null;
  currentStopIndex = 0;
  visitedStates = new Set();
  
  // Clear scenario title
  document.getElementById('scenario-title').textContent = 'Flux & Fizzle';
  
  // Load welcome message from JSON file
  fetch('data/welcome.json')
    .then(response => response.json())
    .then(data => {
      // Show welcome message in clue panel
      const cluePanel = document.getElementById('clue-panel');
      cluePanel.innerHTML = `
        <div class="initial-message">
          <h4 class="text-center">${data.title}</h4>
          <p>${data.description}</p>
          <p>${data.promptMessage}</p>
        </div>
      `;

      const witnessPanel = document.getElementById('witness-panel');
      witnessPanel.innerHTML = `<img src="images/${data.welcomeImage}" alt="inventor" class="img-fluid">`;
    })
    .catch(error => {
      console.error('Error loading welcome message:', error);
      // Fallback message if JSON fails to load
      const cluePanel = document.getElementById('clue-panel');
      cluePanel.innerHTML = `
        <div class="initial-message">
          <h4 class="text-center">Welcome to Flux & Fizzle!</h4>
          <p>Please select a scenario from the top menu to begin your adventure.</p>
        </div>
      `;
    });
    
  // Reset map if it exists
  if (svgDoc) {
    resetMap();
  }
}

// Set up theme selection buttons
function setupThemeSelection() {
  const themeButtons = document.querySelectorAll('.theme-btn');
  
  // Load saved theme from localStorage if available
  const savedTheme = localStorage.getItem('flux-fizzle-theme');
  if (savedTheme) {
    setTheme(savedTheme);
  }
  
  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const theme = button.getAttribute('data-theme');
      setTheme(theme);
      
      // Update active button
      themeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Save theme preference
      localStorage.setItem('flux-fizzle-theme', theme);
    });
  });
}

// Set the theme
function setTheme(theme) {
  // Remove any existing theme classes
  document.body.classList.remove('theme-dark', 'theme-purple');
  
  // Add the new theme class if it's not default
  if (theme !== 'default') {
    document.body.classList.add(`theme-${theme}`);
  }
  
  currentTheme = theme;
  
  // Update active button
  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-theme') === theme) {
      btn.classList.add('active');
    }
  });
  
  // Update map hover color based on theme
  updateMapHoverColor();
}

// Update the active navigation link
function updateActiveNavLink(activeId) {
  // Remove active class from all nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class to the selected link
  document.getElementById(activeId).classList.add('active');
}

// Load a scenario by name
function loadScenario(scenarioName) {
  fetch(`data/${scenarioName}.json`)
    .then(response => response.json())
    .then(data => {
      currentScenario = data;
      // Update scenario title
      document.getElementById('scenario-title').textContent = data.scenarioName;
      showIntroduction();
      
      // Reset the state if map is already initialized
      if (svgDoc) {
        resetMap();
        
        // Highlight possible states if they exist in the scenario
        if (data.possibleStates && Array.isArray(data.possibleStates)) {
          highlightPossibleStates(data.possibleStates);
        }
      }
    })
    .catch(error => console.error(`Error loading scenario ${scenarioName}:`, error));
}

// Reset map highlighting
function resetMap() {
  if (svgDoc) {
    const paths = svgDoc.querySelectorAll('path');
    paths.forEach(path => {
      path.classList.remove('highlighted', 'possible-state');
    });
  }
}

// Highlight possible states on the map
function highlightPossibleStates(stateNames) {
  if (!svgDoc) return;
  
  const paths = svgDoc.querySelectorAll('path');
  stateNames.forEach(stateName => {
    paths.forEach(path => {
      const titleElement = path.querySelector('title');
      if (titleElement && titleElement.textContent.trim().toLowerCase() === stateName.toLowerCase()) {
        path.classList.add('possible-state');
      }
    });
  });
}

// Display introduction with Start Chase button
function showIntroduction() {
  const cluePanel = document.getElementById('clue-panel');
  const witnessPanel = document.getElementById('witness-panel');
  
  // Clear witness panel
  witnessPanel.innerHTML = `<img src="images/${currentScenario.scenarioImage}" alt="inventor" class="img-fluid">`;
  
  cluePanel.innerHTML = `
    <p>${currentScenario.introduction}</p>
    <button id="start-chase" class="btn btn-primary">Start Chase</button>
  `;
  document.getElementById('start-chase').addEventListener('click', startChase);
}

// Start the chase at the first stop
function startChase() {
  currentStopIndex = 0;
  showStop(currentStopIndex);
}

// Show the current stop's details
function showStop(index) {
  const stop = currentScenario.stops[index];
  const witnessPanel = document.getElementById('witness-panel');
  witnessPanel.innerHTML = `<img src="images/${stop.witnessImage}" alt="Witness" class="img-fluid">`;

  const cluePanel = document.getElementById('clue-panel');
  if (stop.nextState === null) {
    // Final stop: show victory message and inventor image
    cluePanel.innerHTML = `
      <p><strong>Current State:</strong> ${stop.state}</p>
      <p><strong>Fact:</strong> ${stop.fact}</p>
      <p>${stop.clue}</p>
      <p>Congratulations! You've caught up with ${currentScenario.inventor}.</p>
    `;
  } else {
    // Regular stop: show fact, clue, and notebook button
    cluePanel.innerHTML = `
      <p><strong>Current State:</strong> ${stop.state}</p>
      <p><strong>Fact:</strong> ${stop.fact}</p>
      <p><strong>Clue:</strong> ${stop.clue}</p>
      <button id="open-notebook" class="btn btn-secondary">Open Notebook</button>
    `;
    document.getElementById('open-notebook').addEventListener('click', openNotebook);
  }

  highlightState(stop.state);
}

// Highlight the current state on the SVG map
function highlightState(stateName) {
  if (svgDoc) {
    const paths = svgDoc.querySelectorAll('path');
    paths.forEach(path => {
      path.classList.remove('highlighted');
      const titleElement = path.querySelector('title');
      if (titleElement && titleElement.textContent.trim().toLowerCase() === stateName.toLowerCase()) {
        path.classList.add('highlighted');
      }
    });
  }
}

function setupMap() {
  const svgObject = document.getElementById('us-map');
  svgObject.addEventListener('load', () => {
    svgDoc = svgObject.contentDocument;
    let style = svgDoc.querySelector('style');
    if (!style) {
      style = svgDoc.createElement('style');
      svgDoc.querySelector('svg').appendChild(style);
    }
    
    // Add styles for highlighted and hover states
    style.textContent += `
      .highlighted { fill: yellow !important; }
      .possible-state { fill: var(--possible-state-color, #9dcdb7); }
      path { transition: fill 0.2s; }
      path:hover:not(.highlighted) { 
        fill: var(--hover-state-color, #d3d3d3); 
        cursor: pointer;
      }
      path[title] {
        cursor: pointer;
      }
      @keyframes pulse {
        0% {
          opacity: 0.8;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.8;
        }
      }
      .possible-state:not(.highlighted) {
        animation: pulse 2s infinite;
      }
    `;

    // Change hover color based on theme
    updateMapHoverColor();

    const paths = svgDoc.querySelectorAll('path');
    paths.forEach(path => {      
      path.addEventListener('click', () => {
        const titleElement = path.querySelector('title');
        if (titleElement) {
          const stateName = titleElement.textContent.trim();
          checkStateSelection(stateName);
        }
      });
    });
  });
}

// Update map hover color based on current theme
function updateMapHoverColor() {
  if (!svgDoc) return;
  
  let hoverColor, highlightColor, possibleStateColor;
  
  if (document.body.classList.contains('theme-dark')) {
    hoverColor = '#444444'; // Darker hover for dark theme
    highlightColor = '#ffd700'; // Gold color for highlighted states in dark theme
    possibleStateColor = '#264d73'; // Dark blue for possible states in dark theme
  } else if (document.body.classList.contains('theme-purple')) {
    hoverColor = '#d0bfff'; // Light purple hover for purple theme
    highlightColor = '#9966cc'; // Deeper purple for highlighted states
    possibleStateColor = '#e6ccff'; // Lighter purple for possible states
  } else {
    hoverColor = '#3498db'; // Default light cyan hover
    highlightColor = '#ffeb3b'; // Yellow for highlighted states in default theme
    possibleStateColor = '#9dcdb7'; // Light blue for possible states in default theme
  }
  
  // Set the CSS variables for hover and highlight colors
  svgDoc.documentElement.style.setProperty('--hover-state-color', hoverColor);
  svgDoc.documentElement.style.setProperty('--possible-state-color', possibleStateColor);
  
  // Update the highlight style
  let styleElement = svgDoc.querySelector('style');
  if (styleElement) {
    // Replace the highlighted style rule
    const styleContent = styleElement.textContent;
    const updatedStyle = styleContent.replace(
      /\.highlighted\s*{\s*fill:\s*[^;!]+(!important)?;?\s*}/,
      `.highlighted { fill: ${highlightColor} !important; }`
    );
    styleElement.textContent = updatedStyle;
  }
}

// Check if the selected state is correct
function checkStateSelection(selectedState) {
  // First, remove highlighting from any previously highlighted state
  if (svgDoc) {
    const paths = svgDoc.querySelectorAll('path.highlighted');
    paths.forEach(path => path.classList.remove('highlighted'));
    
    // Add highlighting to the selected state
    const allPaths = svgDoc.querySelectorAll('path');
    allPaths.forEach(path => {
      const titleElement = path.querySelector('title');
      if (titleElement && titleElement.textContent.trim().toLowerCase() === selectedState.toLowerCase()) {
        path.classList.add('highlighted');
      }
    });
  }
  
  // Then check if the selection is correct
  const currentStop = currentScenario.stops[currentStopIndex];
  if (selectedState.toLowerCase() === currentStop.nextState?.toLowerCase()) {
    currentStopIndex++;
    showStop(currentStopIndex);
  } else {
    const cluePanel = document.getElementById('clue-panel');
    cluePanel.innerHTML += `<p class="text-danger">No sign of ${currentScenario.inventor}—try again!</p>`;
  }
}

// Open the notebook modal with research text
function openNotebook() {
  const notebookContent = document.getElementById('notebook-content');
  notebookContent.innerHTML = currentScenario.research;
  const notebookModal = new bootstrap.Modal(document.getElementById('notebookModal'));
  notebookModal.show();
}