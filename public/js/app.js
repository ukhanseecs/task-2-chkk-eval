let currentSummary = "";
let supportedFileTypes = [];

// Fetch the supported file types when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/filetypes');
    const data = await response.json();
    supportedFileTypes = data.types || [];
    
    // Update the file input's accept attribute
    const acceptedFileTypes = supportedFileTypes.map(type => `.${type}`).join(',');
    document.getElementById('file').setAttribute('accept', acceptedFileTypes);
    
    // Display supported file types
    document.getElementById('supportedTypes').textContent = 
      `Supported file types: ${supportedFileTypes.join(', ')}`;
  } catch (error) {
    console.error('Error fetching supported file types:', error);
  }
});

function openTab(evt, tabName) {
  const tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove("active");
  }
  
  const tabs = document.getElementsByClassName("tab");
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove("active");
  }
  
  document.getElementById(tabName).classList.add("active");
  evt.currentTarget.classList.add("active");
}

// Copy summary to clipboard
document.getElementById('copyBtn').addEventListener('click', () => {
  if (!currentSummary) return;
  
  navigator.clipboard.writeText(currentSummary).then(() => {
    const tooltip = document.getElementById("copyTooltip");
    tooltip.textContent = "Copied!";
    const tooltipContainer = document.querySelector(".tooltip");
    tooltipContainer.classList.add("show");
    
    setTimeout(() => {
      tooltipContainer.classList.remove("show");
      setTimeout(() => {
        tooltip.textContent = "Copy to clipboard";
      }, 300);
    }, 2000);
  });
});

// Download summary as text file
document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!currentSummary) return;
  
  const blob = new Blob([currentSummary], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'meeting-summary.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Text input form submission
document.getElementById('summaryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const transcript = document.getElementById('transcript').value;
  const resultDiv = document.getElementById('result');
  const actionButtons = document.getElementById('actionButtons');
  
  if (!transcript.trim()) {
    resultDiv.innerHTML = '<p class="error">Please enter a transcript.</p>';
    actionButtons.style.display = 'none';
    return;
  }
  
  resultDiv.innerHTML = '<p>Generating summary...</p>';
  actionButtons.style.display = 'none';
  
  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentSummary = data.summary;
      resultDiv.innerHTML = '<h3>Summary:</h3><p>' + data.summary.replace(/\n/g, '<br>') + '</p>';
      actionButtons.style.display = 'block';
    } else {
      resultDiv.innerHTML = '<p class="error">Error: ' + (data.error || 'Unknown error') + '</p>';
      actionButtons.style.display = 'none';
    }
  } catch (error) {
    resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
    actionButtons.style.display = 'none';
  }
});

// File upload form submission
document.getElementById('fileUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('file');
  const resultDiv = document.getElementById('result');
  const processingDiv = document.getElementById('fileProcessing');
  const actionButtons = document.getElementById('actionButtons');
  
  if (!fileInput.files || fileInput.files.length === 0) {
    resultDiv.innerHTML = '<p class="error">Please select a file.</p>';
    actionButtons.style.display = 'none';
    return;
  }
  
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  
  resultDiv.innerHTML = '';
  processingDiv.style.display = 'block';
  actionButtons.style.display = 'none';
  
  try {
    const response = await fetch('/api/summarize/file', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentSummary = data.summary;
      resultDiv.innerHTML = '<h3>Summary:</h3><p>' + data.summary.replace(/\n/g, '<br>') + '</p>';
      actionButtons.style.display = 'block';
    } else {
      resultDiv.innerHTML = '<p class="error">Error: ' + (data.error || 'Unknown error') + '</p>';
      actionButtons.style.display = 'none';
    }
  } catch (error) {
    resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
    actionButtons.style.display = 'none';
  } finally {
    processingDiv.style.display = 'none';
    fileInput.value = ''; // Reset the file input
  }
});