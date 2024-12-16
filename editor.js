// Data structures
let rinks = {};
let activities = {};
let weeklySchedule = {};

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
let selectedCells = new Set();
let activeDropdown = null;

// Load initial data
async function loadInitialData() {
    try {
        const response = await fetch('/data/schedule.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Initialize our data structures
        rinks = data.rinks || {};
        activities = data.activities || {};
        weeklySchedule = data.weeklySchedule || {};

        // Update UI
        displayRinks();
        displayActivities();
        updateRinkSelect();
        initializeScheduleGrid();
    } catch (error) {
        console.error('Error loading schedule data:', error);
        // Initialize with empty data structures if load fails
        rinks = {};
        activities = {};
        weeklySchedule = {};
    }
}

// Rink management
function addRink() {
    const id = document.getElementById('rinkId').value;
    const name = document.getElementById('rinkName').value;
    const description = document.getElementById('rinkDescription').value;
    const logo = document.getElementById('rinkLogo').value;

    if (id && name) {
        rinks[id] = { name, description, logo };
        weeklySchedule[id] = {};
        displayRinks();
        updateRinkSelect();
        clearRinkForm();
    }
}

function deleteRink(id) {
    delete rinks[id];
    delete weeklySchedule[id];
    displayRinks();
    updateRinkSelect();
}

function displayRinks() {
    const container = document.getElementById('rinksList');
    container.innerHTML = '';

    Object.entries(rinks).forEach(([id, rink]) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <strong>${rink.name}</strong> (${id})
            <br>${rink.description || ''}
            ${rink.logo ? `<br><img src="${rink.logo}" alt="logo" style="max-height: 30px;">` : ''}
            <button onclick="deleteRink('${id}')">Delete</button>
        `;
        container.appendChild(div);
    });
}

function updateRinkSelect() {
    const select = document.getElementById('rinkSelect');
    select.innerHTML = '';
    Object.entries(rinks).forEach(([id, rink]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = rink.name;
        select.appendChild(option);
    });
}

function clearRinkForm() {
    document.getElementById('rinkId').value = '';
    document.getElementById('rinkName').value = '';
    document.getElementById('rinkDescription').value = '';
    document.getElementById('rinkLogo').value = '';
}

// Activities management
function addActivity() {
    const id = document.getElementById('activityId').value;
    const name = document.getElementById('activityName').value;
    const color = document.getElementById('activityColor').value;
    const description = document.getElementById('activityDescription').value;
    const logo = document.getElementById('activityLogo').value;

    if (id && name) {
        activities[id] = { name, color, description, logo };
        displayActivities();
        clearActivityForm();
    }
}

function deleteActivity(id) {
    delete activities[id];
    displayActivities();
}

function addSocialMedia() {
    const platform = document.getElementById('socialPlatform').value;
    const url = document.getElementById('socialUrl').value;
    
    if (url) {
        const list = document.querySelector('.social-media-list');
        const item = document.createElement('div');
        item.className = 'social-media-item';
        item.innerHTML = `
            <span><strong>${platform}:</strong> ${url}</span>
            <button onclick="this.parentElement.remove()">Remove</button>
        `;
        list.appendChild(item);
        document.getElementById('socialUrl').value = '';
    }
}

function getFormData() {
    const socialMediaItems = document.querySelectorAll('.social-media-item');
    const socialMedia = Array.from(socialMediaItems).map(item => {
        const [platform, url] = item.querySelector('span').textContent.split(': ');
        return {
            platform: platform.replace(':', ''),
            url: url
        };
    });

    return {
        id: document.getElementById('activityId').value,
        name: document.getElementById('activityName').value,
        color: document.getElementById('activityColor').value,
        description: document.getElementById('activityDescription').value,
        website: document.getElementById('activityWebsite').value,
        socialMedia: socialMedia,
        logo: document.getElementById('activityLogo').value
    };
}

function setFormData(data) {
    document.getElementById('activityId').value = data.id;
    document.getElementById('activityName').value = data.name;
    document.getElementById('activityColor').value = data.color;
    document.getElementById('activityDescription').value = data.description || '';
    document.getElementById('activityWebsite').value = data.website || '';
    document.getElementById('activityLogo').value = data.logo || '';
    
    // Clear and rebuild social media list
    const socialList = document.querySelector('.social-media-list');
    socialList.innerHTML = '';
    
    if (data.socialMedia) {
        data.socialMedia.forEach(social => {
            const item = document.createElement('div');
            item.className = 'social-media-item';
            item.innerHTML = `
                <span><strong>${social.platform}:</strong> ${social.url}</span>
                <button onclick="this.parentElement.remove()">Remove</button>
            `;
            socialList.appendChild(item);
        });
    }
}

function clearActivityForm() {
    document.getElementById('activityEditId').value = '';
    document.getElementById('activityId').value = '';
    document.getElementById('activityName').value = '';
    document.getElementById('activityColor').value = '#ff0000';
    document.getElementById('activityDescription').value = '';
    document.getElementById('activityWebsite').value = '';
    document.getElementById('activityLogo').value = '';
    document.querySelector('.social-media-list').innerHTML = '';
    
    document.getElementById('saveActivityBtn').textContent = 'Add Activity';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('activityId').disabled = false;
}

function editActivity(id) {
    const activity = activities[id];
    document.getElementById('activityEditId').value = id;
    setFormData({...activity, id});
    
    document.getElementById('saveActivityBtn').textContent = 'Update Activity';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    document.getElementById('activityId').disabled = true;
    
    // Scroll to form
    document.getElementById('activityForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    clearActivityForm();
}

function saveActivity() {
    const formData = getFormData();
    const editId = document.getElementById('activityEditId').value;
    
    if (editId) {
        // Update existing activity
        activities[editId] = {
            name: formData.name,
            color: formData.color,
            description: formData.description,
            website: formData.website,
            socialMedia: formData.socialMedia,
            logo: formData.logo
        };
    } else {
        // Add new activity
        if (!formData.id) {
            alert('Activity ID is required');
            return;
        }
        if (activities[formData.id]) {
            alert('Activity ID already exists');
            return;
        }
        activities[formData.id] = {
            name: formData.name,
            color: formData.color,
            description: formData.description,
            website: formData.website,
            socialMedia: formData.socialMedia,
            logo: formData.logo
        };
    }
    
    displayActivities();
    clearActivityForm();
}

function displayActivities() {
    const container = document.getElementById('activitiesList');
    container.innerHTML = '';

    Object.entries(activities).forEach(([id, activity]) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.borderLeft = `5px solid ${activity.color}`;
        
        let socialLinksHtml = '';
        if (activity.socialMedia && activity.socialMedia.length > 0) {
            socialLinksHtml = `
                <div class="social-links">
                    ${activity.socialMedia.map(social => 
                        `<a href="${social.url}" class="social-link" target="_blank">${social.platform}</a>`
                    ).join('')}
                </div>
            `;
        }

        div.innerHTML = `
            <div class="activity-actions">
                <button onclick="editActivity('${id}')">Edit</button>
                <button onclick="deleteActivity('${id}')">Delete</button>
            </div>
            <strong>${activity.name}</strong> (${id})
            <br>${activity.description || ''}
            ${activity.website ? `<br><a href="${activity.website}" target="_blank">Website</a>` : ''}
            ${activity.logo ? `<br><img src="${activity.logo}" alt="logo" style="max-height: 30px;">` : ''}
            ${socialLinksHtml}
        `;
        container.appendChild(div);
    });
}

// Schedule management
function initializeScheduleGrid() {
    const grid = document.getElementById('scheduleGrid');
    grid.innerHTML = '';
    selectedCells.clear();

    // Create header row
    const headerRow = document.createElement('div');
    headerRow.className = 'schedule-header-row';
    
    // Add time/day header
    headerRow.appendChild(createDiv('Time/Day', 'schedule-header'));
    
    // Add day headers
    days.forEach(day => {
        headerRow.appendChild(createDiv(day.charAt(0).toUpperCase() + day.slice(1), 'schedule-header'));
    });
    
    // Add header row to grid
    grid.appendChild(headerRow);

    // Create body container
    const bodyContainer = document.createElement('div');
    bodyContainer.className = 'schedule-body';

    // Add time slots (every 15 minutes from 6:00 to 23:45)
    for (let hour = 6; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Add time label
            bodyContainer.appendChild(createDiv(timeString, 'time-label'));
            
            // Add day cells
            days.forEach(day => {
                const cell = createDiv('', 'time-slot');
                cell.dataset.time = timeString;
                cell.dataset.day = day;
                cell.onclick = (e) => handleCellClick(e, cell);
                updateScheduleCell(cell, day, timeString);
                bodyContainer.appendChild(cell);
            });
        }
    }

    // Add body container to grid
    grid.appendChild(bodyContainer);
}

function createDiv(content, className = '') {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = content;
    return div;
}

function handleCellClick(event, cell) {
    event.stopPropagation(); // Prevent event from bubbling up
    
    // Remove any existing dropdowns
    removeDropdown();

    // Toggle cell selection
    cell.classList.toggle('selected');
    const cellKey = `${cell.dataset.day}-${cell.dataset.time}`;
    
    if (cell.classList.contains('selected')) {
        selectedCells.add(cellKey);
    } else {
        selectedCells.delete(cellKey);
    }

    // If we have selected cells, show the activity dropdown
    if (selectedCells.size > 0) {
        showActivityDropdown(event.clientX, event.clientY);
    }
}

function showActivityDropdown(x, y) {
    const dropdown = document.createElement('div');
    dropdown.className = 'activity-dropdown';
    
    // Add "Clear Selection" option
    const clearOption = document.createElement('div');
    clearOption.textContent = 'Clear Selection';
    clearOption.onclick = clearSelectedSlots;
    dropdown.appendChild(clearOption);

    // Add separator
    const separator = document.createElement('div');
    separator.style.borderBottom = '1px solid #ccc';
    dropdown.appendChild(separator);

    // Add activities
    Object.entries(activities).forEach(([id, activity]) => {
        const option = document.createElement('div');
        option.textContent = activity.name;
        option.style.borderLeft = `5px solid ${activity.color}`;
        option.onclick = () => assignActivityToSelectedSlots(id);
        dropdown.appendChild(option);
    });

    // Position the dropdown
    dropdown.style.position = 'fixed';
    dropdown.style.left = `${x}px`;
    dropdown.style.top = `${y}px`;

    // Remove old dropdown if exists
    removeDropdown();

    // Add new dropdown
    document.body.appendChild(dropdown);
    activeDropdown = dropdown;

    // Close dropdown when clicking outside
    document.addEventListener('click', handleClickOutside);
}

function handleClickOutside(event) {
    if (activeDropdown && !activeDropdown.contains(event.target) && 
        !event.target.classList.contains('time-slot')) {
        removeDropdown();
        clearSelectedSlots();
    }
}

function removeDropdown() {
    if (activeDropdown) {
        activeDropdown.remove();
        activeDropdown = null;
        document.removeEventListener('click', handleClickOutside);
    }
}

function clearSelectedSlots() {
    document.querySelectorAll('.time-slot.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
    selectedCells.clear();
    removeDropdown();
}

function assignActivityToSelectedSlots(activityId) {
    // Get the current rink
    const rinkId = document.getElementById('rinkSelect').value;
    
    // Convert selected cells to sorted array of times for each day
    const daySlots = {};
    selectedCells.forEach(cellKey => {
        const [day, time] = cellKey.split('-');
        if (!daySlots[day]) daySlots[day] = [];
        daySlots[day].push(time);
    });

    // Process each day's slots
    Object.entries(daySlots).forEach(([day, times]) => {
        // Sort times
        times.sort();
        
        // Initialize or get the day's schedule
        if (!weeklySchedule[rinkId][day]) {
            weeklySchedule[rinkId][day] = [];
        }

        // Add the activity with start and end times
        weeklySchedule[rinkId][day].push({
            activityId,
            startTime: times[0],
            endTime: addMinutes(times[times.length - 1], 15) // Add 15 minutes to last slot
        });
    });

    // Clear selections and update grid
    clearSelectedSlots();
    initializeScheduleGrid();
}

function updateScheduleCell(cell, day, time) {
    const rinkId = document.getElementById('rinkSelect').value;
    const schedule = weeklySchedule[rinkId]?.[day];
    
    if (schedule) {
        const activity = schedule.find(item => {
            return time >= item.startTime && time < item.endTime;
        });

        if (activity) {
            const activityDetails = activities[activity.activityId];
            cell.style.backgroundColor = activityDetails.color;
            cell.textContent = activityDetails.name;
        }
    }
}

function addMinutes(timeStr, minutes) {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date(2024, 0, 1, hours, mins + minutes);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Export/Import functionality
function exportData() {
    const data = {
        rinks,
        activities,
        weeklySchedule
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    
    // Update the textarea
    document.getElementById('jsonData').value = jsonString;
    
    // Create and trigger download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.json';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function importData() {
    try {
        const data = JSON.parse(document.getElementById('jsonData').value);
        rinks = data.rinks || {};
        activities = data.activities || {};
        weeklySchedule = data.weeklySchedule || {};
        displayRinks();
        displayActivities();
        updateRinkSelect();
        initializeScheduleGrid();
    } catch (error) {
        alert('Invalid JSON format');
    }
}

// Tab management
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    const tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    if (tabName === 'Schedule') {
        initializeScheduleGrid();
    }
}

// Initialize on load
document.getElementById("defaultOpen").click();
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    document.getElementById("defaultOpen").click();
});