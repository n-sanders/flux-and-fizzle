// script.js
let currentScenario;
let currentStopIndex = 0;
let svgDoc;

// Load scenario on page load
document.addEventListener('DOMContentLoaded', () => {
  fetch('data/round1.json')
    .then(response => response.json())
    .then(data => {
      currentScenario = data;
      showIntroduction();
      setupMap();
    })
    .catch(error => console.error('Error loading scenario:', error));
});

// Display introduction with Start Chase button
function showIntroduction() {
  const cluePanel = document.getElementById('clue-panel');
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

// Show the current stop’s details
function showStop(index) {
  const stop = currentScenario.stops[index];
  const witnessPanel = document.getElementById('witness-panel');
  witnessPanel.innerHTML = `<img src="images/${stop.witnessImage}" alt="Witness" class="img-fluid">`;

  const cluePanel = document.getElementById('clue-panel');
  if (stop.nextState === null) {
    // Final stop: show victory message and inventor image
    cluePanel.innerHTML = `
      <p><strong>Fact:</strong> ${stop.fact}</p>
      <p>${stop.clue}</p>
      <p>Congratulations! You've caught up with ${currentScenario.inventor}.</p>
      <img src="images/${currentScenario.inventor === 'Percy Flux' ? 'percy.png' : 'fiona.png'}" alt="${currentScenario.inventor}" class="img-fluid">
    `;
  } else {
    // Regular stop: show fact, clue, and notebook button
    cluePanel.innerHTML = `
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
      style.textContent += '.highlighted { fill: yellow; }';
  
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

// Check if the selected state is correct
function checkStateSelection(selectedState) {
    const currentStop = currentScenario.stops[currentStopIndex];
    if (selectedState.toLowerCase() === currentStop.nextState.toLowerCase()) {
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