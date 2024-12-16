// Data structures
let rinks = {};
let activities = {};
let weeklySchedule = {};
let categories = {};
let selectedCells = new Set();
let activeDropdown = null;

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Load initial data
async function loadInitialData() {
    try {
        // Start with default data
        const defaultData = {
            rinks: {},
            activities: {},
            weeklySchedule: {},
            categories: {}
        };

        try {
            const response = await fetch('/data/schedule.json');
            if (response.ok) {
                const data = await response.json();
                rinks = data.rinks || defaultData.rinks;
                activities = data.activities || defaultData.activities;
                weeklySchedule = data.weeklySchedule || defaultData.weeklySchedule;
                categories = data.categories || defaultData.categories;
            } else {
                console.log('Using default data as fetch failed');
                ({rinks, activities, weeklySchedule, categories} = defaultData);
            }
        } catch (error) {
            console.log('Using default data due to error:', error);
            ({rinks, activities, weeklySchedule, categories} = defaultData);
        }

        // Update UI
        displayRinks();
        displayActivities();
        updateRinkSelect();
        initializeScheduleGrid();
        buildCategoryDropdowns();
        
        // Initialize event listeners after data is loaded
        initializeEventListeners();
        
    } catch (error) {
        console.error('Error in loadInitialData:', error);
    }
}

function initializeEventListeners() {
    document.getElementById('addRinkBtn')?.addEventListener('click', addRink);
    document.getElementById('addSocialMediaBtn')?.addEventListener('click', addSocialMedia);
    document.getElementById('saveActivityBtn')?.addEventListener('click', saveActivity);
    document.getElementById('cancelEditBtn')?.addEventListener('click', cancelEdit);
    document.getElementById('rinkSelect')?.addEventListener('change', initializeScheduleGrid);
    document.getElementById('exportBtn')?.addEventListener('click', exportData);
    document.getElementById('importBtn')?.addEventListener('click', importData);
}

function calculateDropdownPosition(x, y, dropdown) {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const dropdownRect = dropdown.getBoundingClientRect();
    const dropdownHeight = dropdownRect.height;
    const dropdownWidth = dropdownRect.width;
    
    // If dropdown would extend below viewport, position it above the click point
    if (y + dropdownHeight > windowHeight) {
        y = Math.max(10, y - dropdownHeight);
    }
    
    // If dropdown would extend beyond right edge, move it left
    if (x + dropdownWidth > windowWidth) {
        x = Math.max(10, windowWidth - dropdownWidth - 10);
    }
    
    return { x, y };
}

// Category management functions
function addCategory(parentPath, newCategory) {
    let current = categories;
    
    if (parentPath) {
        // Handle nested categories
        const parts = parentPath.split('/');
        for (const part of parts) {
            if (!current[part]) {
                current[part] = { subcategories: {} };
            }
            current = current[part].subcategories;
        }
    }
    
    if (!current[newCategory]) {
        current[newCategory] = { subcategories: {} };
        return true;
    }
    return false;
}

function buildCategoryDropdowns() {
    const container = document.getElementById('categoryContainer');
    container.innerHTML = '';
    
    // Create main category dropdown
    const mainSelect = createCategorySelect('mainCategory', Object.keys(categories));
    container.appendChild(mainSelect);
    
    // Create subcategory dropdown (initially empty)
    const subSelect = createCategorySelect('subCategory', []);
    subSelect.style.display = 'none';
    container.appendChild(subSelect);
    
    return container;
}

function createCategorySelect(id, options) {
    const select = document.createElement('select');
    select.id = id;
    select.className = 'category-select';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select --';
    select.appendChild(defaultOption);
    
    options.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
    
    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = 'New...';
    select.appendChild(newOption);
    
    // Add change event listener based on select ID
    if (id === 'mainCategory') {
        select.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === 'new') {
                promptNewCategory('');
            } else {
                updateSubcategoryDropdown(value);
            }
        });
    } else if (id === 'subCategory') {
        select.addEventListener('change', (e) => {
            const mainCategory = document.getElementById('mainCategory').value;
            const value = e.target.value;
            
            if (value === 'new') {
                promptNewCategory(mainCategory);
            } else if (value) {
                document.getElementById('activityCategory').value = `${mainCategory}/${value}`;
            }
        });
    }
    
    return select;
}

function updateSubcategoryDropdown(mainCategory) {
    const subSelect = document.getElementById('subCategory');
    if (!mainCategory || mainCategory === 'new') {
        subSelect.style.display = 'none';
        return;
    }
    
    const subcategories = Object.keys(categories[mainCategory]?.subcategories || {});
    
    subSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select --';
    subSelect.appendChild(defaultOption);
    
    subcategories.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = sub;
        subSelect.appendChild(option);
    });
    
    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = 'New...';
    subSelect.appendChild(newOption);
    
    subSelect.style.display = 'inline-block';
    document.getElementById('activityCategory').value = mainCategory;
}

function promptNewCategory(parentPath) {
    const newCategory = prompt('Enter new category name:');
    if (newCategory && newCategory.trim()) {
        const categoryName = newCategory.trim();
        
        if (addCategory(parentPath, categoryName)) {
            // Rebuild dropdowns with new category
            buildCategoryDropdowns();
            
            if (parentPath) {
                // Adding a subcategory
                document.getElementById('mainCategory').value = parentPath;
                updateSubcategoryDropdown(parentPath);
                document.getElementById('subCategory').value = categoryName;
                document.getElementById('activityCategory').value = `${parentPath}/${categoryName}`;
            } else {
                // Adding a main category
                document.getElementById('mainCategory').value = categoryName;
                document.getElementById('activityCategory').value = categoryName;
                updateSubcategoryDropdown(categoryName);
            }
        } else {
            alert('Category already exists');
        }
    } else {
        // Reset dropdowns if cancelled
        if (parentPath) {
            document.getElementById('mainCategory').value = parentPath;
            updateSubcategoryDropdown(parentPath);
        } else {
            document.getElementById('mainCategory').value = '';
            document.getElementById('subCategory').style.display = 'none';
        }
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
        logo: document.getElementById('activityLogo').value,
        categoryPath: document.getElementById('activityCategory').value
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
        activities[editId] = {
            name: formData.name,
            color: formData.color,
            description: formData.description,
            website: formData.website,
            socialMedia: formData.socialMedia,
            logo: formData.logo,
            categoryPath: formData.categoryPath
        };
    } else {
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
            logo: formData.logo,
            categoryPath: formData.categoryPath
        };
    }
    
    displayActivities();
    clearActivityForm();
}

function showActivityDropdown(x, y) {
    const dropdown = document.createElement('div');
    dropdown.className = 'activity-dropdown';
    
    // Add "Clear Selection" option
    const clearOption = document.createElement('div');
    clearOption.className = 'dropdown-item';
    clearOption.textContent = 'Clear Selection';
    clearOption.onclick = clearSelectedSlots;
    dropdown.appendChild(clearOption);
    
    dropdown.appendChild(createSeparator());
    
    // First, group activities by their top-level category
    const categoryGroups = {};
    Object.entries(activities).forEach(([id, activity]) => {
        const categoryPath = activity.categoryPath || 'Uncategorized';
        const topCategory = categoryPath.split('/')[0];
        
        if (!categoryGroups[topCategory]) {
            categoryGroups[topCategory] = [];
        }
        categoryGroups[topCategory].push({ id, ...activity });
    });
    
    // Create menu items for each category
    Object.entries(categoryGroups).forEach(([category, activities]) => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-menu-item';
        
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'category-menu-title';
        categoryTitle.innerHTML = `${category} <span class="arrow">▸</span>`;
        categoryItem.appendChild(categoryTitle);
        
        // Create submenu for activities
        const submenu = document.createElement('div');
        submenu.className = 'submenu';
        
        // Add activities to submenu
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-option';
            activityItem.textContent = activity.name;
            activityItem.style.borderLeft = `5px solid ${activity.color}`;
            activityItem.onclick = (e) => {
                e.stopPropagation();
                assignActivityToSelectedSlots(activity.id);
            };
            submenu.appendChild(activityItem);
        });
        
        categoryItem.appendChild(submenu);
        dropdown.appendChild(categoryItem);
    });
    
    // Initial positioning to get dimensions
    dropdown.style.position = 'fixed';
    dropdown.style.visibility = 'hidden'; // Hide initially to measure
    document.body.appendChild(dropdown);
    
    // Calculate and set final position
    const { x: adjustedX, y: adjustedY } = calculateDropdownPosition(x, y, dropdown);
    dropdown.style.left = `${adjustedX}px`;
    dropdown.style.top = `${adjustedY}px`;
    dropdown.style.visibility = 'visible'; // Make visible after positioning
    
    removeDropdown();
    activeDropdown = dropdown;
    
    document.addEventListener('click', handleClickOutside);
}

// Update CSS styles
const style = document.createElement('style');
style.textContent = `
    .activity-dropdown {
        position: fixed;
        background: white;
        border: 1px solid #ccc;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1000;
        min-width: 200px;
        padding: 4px 0;
    }

    .dropdown-item {
        padding: 8px 12px;
        cursor: pointer;
    }

    .dropdown-item:hover {
        background-color: #f0f0f0;
    }

    .category-menu-item {
        position: relative;
    }

    .category-menu-title {
        padding: 8px 24px 8px 12px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .category-menu-title:hover {
        background-color: #f0f0f0;
    }

    .category-menu-title .arrow {
        margin-left: 8px;
    }

    .submenu {
        display: none;
        position: absolute;
        left: 100%;
        top: 0;
        background: white;
        border: 1px solid #ccc;
        box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        min-width: 200px;
        padding: 4px 0;
    }

    .category-menu-item:hover > .submenu {
        display: block;
    }

    .activity-option {
        padding: 8px 24px 8px 12px;
        cursor: pointer;
        white-space: nowrap;
    }

    .activity-option:hover {
        background-color: #f0f0f0;
    }

    .dropdown-separator {
        height: 1px;
        background-color: #ddd;
        margin: 4px 0;
    }
`;
document.head.appendChild(style);

function createCategoryMenuItem(category, data) {
    const item = document.createElement('div');
    item.className = 'category-menu-item';
    
    const titleContainer = document.createElement('div');
    titleContainer.className = 'category-menu-title';
    titleContainer.textContent = category;
    
    if (Object.keys(data.subcategories).length > 0 || data.items.length > 0) {
        titleContainer.innerHTML += '<span class="arrow">▸</span>';
    }
    
    item.appendChild(titleContainer);
    
    // Create submenu
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    
    // Add activities for this category
    data.items.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-option';
        activityItem.textContent = activity.name;
        activityItem.style.borderLeft = `5px solid ${activity.color}`;
        activityItem.onclick = (e) => {
            e.stopPropagation();
            assignActivityToSelectedSlots(activity.id);
        };
        submenu.appendChild(activityItem);
    });
    
    // Add subcategories
    Object.entries(data.subcategories).forEach(([subCategory, subData]) => {
        submenu.appendChild(createCategoryMenuItem(subCategory, subData));
    });
    
    if (submenu.children.length > 0) {
        item.appendChild(submenu);
    }
    
    // Handle hover events
    item.addEventListener('mouseenter', () => {
        closeAllSubmenus(item.parentElement);
        if (submenu.children.length > 0) {
            item.classList.add('open');
        }
    });
    
    return item;
}

function closeAllSubmenus(parent) {
    parent.querySelectorAll('.category-menu-item.open').forEach(item => {
        if (!parent.contains(item)) {
            item.classList.remove('open');
        }
    });
}

function createSeparator() {
    const separator = document.createElement('div');
    separator.className = 'dropdown-separator';
    return separator;
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

    // Add headers
    grid.appendChild(createDiv('Time/Day', 'schedule-header'));
    days.forEach(day => {
        grid.appendChild(createDiv(day.charAt(0).toUpperCase() + day.slice(1), 'schedule-header'));
    });

    // Add time slots (every 15 minutes from 6:00 to 23:45)
    for (let hour = 6; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            grid.appendChild(createDiv(timeString));
            
            days.forEach(day => {
                const cell = createDiv('', 'time-slot');
                cell.dataset.time = timeString;
                cell.dataset.day = day;
                cell.onclick = (e) => handleCellClick(e, cell);
                updateScheduleCell(cell, day, timeString);
                grid.appendChild(cell);
            });
        }
    }
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
        weeklySchedule,
        categories
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    document.getElementById('jsonData').value = jsonString;
    
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
        categories = data.categories || {};
        displayRinks();
        displayActivities();
        updateRinkSelect();
        initializeScheduleGrid();
        buildCategoryDropdowns();
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

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    document.getElementById("defaultOpen")?.click();
    await loadInitialData();
    console.log('Initialization complete');
});